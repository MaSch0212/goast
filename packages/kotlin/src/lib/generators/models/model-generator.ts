import { dirname } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import {
  ApiSchema,
  ApiSchemaProperty,
  AppendValue,
  AppendValueGroup,
  appendValueGroup,
  createOverwriteProxy,
  getSchemaReference,
  notNullish,
  resolveAnyOfAndAllOf,
  toCasing,
} from '@goast/core';

import { KotlinModelGeneratorContext, KotlinModelGeneratorOutput } from './models';
import {
  KtAnnotation,
  KtAnnotationTarget,
  KtClass,
  KtEnum,
  KtFunction,
  KtInterface,
  KtParameter,
  KtProperty,
  KtReference,
  ktAnnotation,
  ktArgument,
  ktCall,
  ktClass,
  ktClassParameter,
  ktConstructor,
  ktDoc,
  ktEnum,
  ktEnumValue,
  ktFunction,
  ktGenericReferenceFactory,
  ktInterface,
  ktNamedArgument,
  ktParameter,
  ktProperty,
  ktReference,
  ktReferenceFactory,
  ktString,
} from '../../ast';
import { KotlinFileBuilder } from '../../file-builder';
import { KotlinFileGenerator } from '../file-generator';

type Context = KotlinModelGeneratorContext;
type Output = KotlinModelGeneratorOutput;
type Builder = KotlinFileBuilder;

const kotlin = {
  any: ktReferenceFactory('Any'),
  nothing: ktReferenceFactory('Nothing'),
  string: ktReferenceFactory('String'),
  int: ktReferenceFactory('Int'),
  long: ktReferenceFactory('Long'),
  float: ktReferenceFactory('Float'),
  double: ktReferenceFactory('Double'),
  boolean: ktReferenceFactory('Boolean'),
  list: ktGenericReferenceFactory<1>('List'),
  map: ktGenericReferenceFactory<2>('Map'),
  mutableMap: ktGenericReferenceFactory<2>('MutableMap'),
};

const jackson = {
  jsonTypeInfo: ktReferenceFactory('JsonTypeInfo', 'com.fasterxml.jackson.annotation'),
  jsonSubTypes: ktReferenceFactory('JsonSubTypes', 'com.fasterxml.jackson.annotation'),
  jsonProperty: ktReferenceFactory('JsonProperty', 'com.fasterxml.jackson.annotation'),
  jsonInclude: ktReferenceFactory('JsonInclude', 'com.fasterxml.jackson.annotation'),
  jsonIgnore: ktReferenceFactory('JsonIgnore', 'com.fasterxml.jackson.annotation'),
  jsonAnySetter: ktReferenceFactory('JsonAnySetter', 'com.fasterxml.jackson.annotation'),
  jsonAnyGetter: ktReferenceFactory('JsonAnyGetter', 'com.fasterxml.jackson.annotation'),
};

const jakarta = {
  pattern: ktReferenceFactory('Pattern', 'jakarta.validation.constraints'),
  valid: ktReferenceFactory('Valid', 'jakarta.validation'),
};

const swagger = {
  schema: ktReferenceFactory('Schema', 'io.swagger.v3.oas.annotations.media'),
};

const java = {
  offsetDateTime: ktReferenceFactory('OffsetDateTime', 'java.time'),
};

export interface KotlinModelGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): TOutput;
}

export type KotlinModelGeneratorSubContext = {
  getSchemaDeclaration: Context;
  getClass: Context & { schema: ApiSchema<'object'> };
  getClassParameter: KotlinModelGeneratorSubContext['getClass'] & {
    inheritedSchemas: ApiSchema[];
    parameters: ApiSchemaProperty[];
    property: ApiSchemaProperty;
  };
};

export class DefaultKotlinModelGenerator extends KotlinFileGenerator<Context, Output> implements KotlinModelGenerator {
  public generate(ctx: KotlinModelGeneratorContext): KotlinModelGeneratorOutput {
    if (/\/(anyOf|allOf)(\/[0-9]+)?$/.test(ctx.schema.$src.path)) {
      // Do not generate types that are only used for anyOf and/or allOf
      return { typeName: 'Any?', packageName: undefined, additionalImports: [] };
    }

    if (ctx.schema.id === ctx.schema.name) {
      // TODO: Add this to @goast/core
      const match = ctx.schema.$src.path.match(/\/components\/responses\/([^/]+)\/content\/.+\/schema/);
      if (match) {
        ctx.schema.name = match[1].toLowerCase().endsWith('response') ? match[1] : match[1] + 'Response';
      }
    }

    if (ctx.schema.isNameGenerated) {
      // TODO: Change this in @goast/core
      const match = ctx.schema.$src.path.match(/\/paths\/(?<path>.+)\/(?<method>.+)\/responses\/(?<status>\d+)\//);
      if (match && match.groups) {
        const { path, method, status } = match.groups;
        const endpoint = ctx.data.endpoints.find((e) => e.path === path && e.method === method);
        if (endpoint) {
          ctx.schema.name = `${endpoint.name}${status}Response`;
        }
      }
    }

    if (this.shouldGenerateTypeDeclaration(ctx, ctx.schema)) {
      const typeName = this.getDeclarationTypeName(ctx, ctx.schema);
      const packageName = this.getPackageName(ctx, ctx.schema);
      const filePath = `${ctx.config.outputDir}/${packageName.replace(/\./g, '/')}/${typeName}.kt`;
      console.log(`Generating model ${packageName}.${typeName} to ${filePath}...`);
      ensureDirSync(dirname(filePath));

      writeFileSync(
        filePath,
        new KotlinFileBuilder(packageName, ctx.config).append(this.getFileContent(ctx)).toString()
      );

      return { typeName, packageName, additionalImports: [] };
    } else {
      const reference = this.getType(ctx, ctx.schema);
      const builder = new KotlinFileBuilder(undefined, ctx.config).append(reference);
      const additionalImports = builder.imports.imports.filter(
        (x) => x.packageName !== reference.packageName && x.typeName !== reference.name
      );
      builder.imports.clear();
      return { typeName: builder.toString(false), packageName: reference.packageName ?? undefined, additionalImports };
    }
  }

  protected getFileContent(ctx: Context): AppendValueGroup<Builder> {
    return appendValueGroup<Builder>(
      [this.getSchemaDeclaration({ ...ctx, schema: this.normalizeSchema(ctx, ctx.schema) })],
      '\n\n'
    );
  }

  protected getSchemaDeclaration(ctx: KotlinModelGeneratorSubContext['getSchemaDeclaration']): AppendValue<Builder> {
    const { schema } = ctx;

    if (schema.kind === 'object') {
      return schema.discriminator ? this.getInterface(ctx, schema) : this.getClass({ ...ctx, schema });
    } else if (schema.enum !== undefined && schema.enum.length > 0) {
      return this.getEnum(ctx, schema);
    }

    return '// The generator was not able to generate this schema.\n// This should not happend. If you see this comment, please open an Issue on Github.';
  }

  protected getClass(ctx: KotlinModelGeneratorSubContext['getClass']): KtClass<Builder> {
    const { schema } = ctx;
    const inheritedSchemas = this.getInheritedSchemas(ctx, schema);
    const parameters = this.getClassProperties(ctx, schema);
    return ktClass(this.getDeclarationTypeName(ctx, schema), {
      doc: ktDoc(schema.description?.trim()),
      classKind: parameters.length === 0 ? null : 'data',
      implements: inheritedSchemas.map((schema) => this.getType(ctx, schema)),
      primaryConstructor: ktConstructor(
        parameters.map((property) => this.getClassParameter({ ...ctx, schema, inheritedSchemas, parameters, property }))
      ),
      members: [
        ...(schema.additionalProperties !== undefined && schema.additionalProperties !== false
          ? [
              this.getAdditionalPropertiesProperty(ctx, schema),
              this.getAdditionalPropertiesSetter(ctx, schema),
              this.getAdditionalPropertiesGetter(ctx, schema),
            ]
          : []),
      ],
    });
  }

  protected getInterface(ctx: Context, schema: ApiSchema<'object'>): KtInterface<Builder> {
    return ktInterface(this.getDeclarationTypeName(ctx, schema), {
      doc: ktDoc(schema.description?.trim()),
      annotations: [
        this.getJacksonJsonTypeInfoAnnotation(ctx, schema),
        this.getJacksonJsonSubTypesAnnotation(ctx, schema),
      ].filter(notNullish),
      members: this.sortProperties(ctx, schema, schema.properties.values()).map((property) =>
        this.getInterfaceProperty(ctx, schema, property)
      ),
    });
  }

  protected getEnum(ctx: Context, schema: ApiSchema): KtEnum<Builder> {
    return ktEnum(
      this.getDeclarationTypeName(ctx, schema),
      schema.enum?.map((x) =>
        ktEnumValue(toCasing(String(x), ctx.config.enumValueNameCasing), {
          annotations: [ktAnnotation(jackson.jsonProperty(), [ktArgument(ktString(String(x)))])],
          arguments: [ktArgument(ktString(String(x)))],
        })
      ) ?? [],
      {
        doc: ktDoc(schema.description?.trim()),
        primaryConstructor: ktConstructor([
          ktClassParameter(toCasing('value', ctx.config.propertyNameCasing), kotlin.string(), { property: 'readonly' }),
        ]),
      }
    );
  }

  protected getType(ctx: Context, schema: ApiSchema, nullable?: boolean): KtReference<Builder> {
    const generatedType = this.getGeneratedType(ctx, schema, nullable);
    if (generatedType) {
      return generatedType;
    }

    nullable = nullable ?? schema.nullable;
    switch (schema.kind) {
      case 'boolean':
        return kotlin.boolean(nullable);
      case 'integer':
      case 'number':
        switch (schema.format) {
          case 'int32':
            return kotlin.int(nullable);
          case 'int64':
            return kotlin.long(nullable);
          case 'float':
            return kotlin.float(nullable);
          case 'double':
            return kotlin.double(nullable);
          default:
            return schema.kind === 'integer' ? kotlin.int(nullable) : kotlin.double(nullable);
        }
      case 'string':
        switch (schema.format) {
          case 'date-time':
            return java.offsetDateTime(nullable);
          default:
            return kotlin.string(nullable);
        }
      case 'null':
        return kotlin.nothing(nullable);
      case 'unknown':
        return kotlin.any(nullable);
      case 'array':
        return kotlin.list([schema.items ? this.getType(ctx, schema.items) : kotlin.any(true)], nullable);
      case 'object':
        return schema.properties.size === 0 && schema.additionalProperties
          ? kotlin.map([kotlin.string(), this.getAdditionalPropertiesType(ctx, schema)], nullable)
          : kotlin.any(nullable);
      default:
        return kotlin.any(nullable);
    }
  }

  protected getGeneratedType(ctx: Context, schema: ApiSchema, nullable?: boolean): KtReference<Builder> | null {
    schema = getSchemaReference(schema, ['description']);
    if (this.shouldGenerateTypeDeclaration(ctx, schema)) {
      return ktReference(this.getDeclarationTypeName(ctx, schema), this.getPackageName(ctx, schema), {
        nullable: nullable ?? schema.nullable,
      });
    }
    return null;
  }

  protected getAdditionalPropertiesType(ctx: Context, schema: ApiSchema<'object'>): KtReference<Builder> {
    return typeof schema.additionalProperties === 'object'
      ? this.getType(ctx, schema.additionalProperties)
      : kotlin.any(true);
  }

  protected getDefaultValue(ctx: Context, schema: ApiSchema): AppendValue<Builder> {
    if (schema.default === null || schema.default === undefined) {
      return 'null';
    } else {
      switch (schema.kind) {
        case 'boolean':
          return Boolean(schema.default) || String(schema.default).toLowerCase() === 'true' ? 'true' : 'false';
        case 'integer':
        case 'number':
          return String(schema.default);
        case 'string':
          return schema.enum && schema.enum.length > 0
            ? appendValueGroup<Builder>([
                this.getType(ctx, schema),
                '.',
                toCasing(String(schema.default), ctx.config.enumValueNameCasing),
              ])
            : ktString(String(schema.default));
        default:
          return 'null';
      }
    }
  }

  // #region Members
  protected getClassParameter(ctx: KotlinModelGeneratorSubContext['getClassParameter']): KtParameter<Builder> {
    const { schema, inheritedSchemas, property } = ctx;
    return ktClassParameter(
      toCasing(property.name, ctx.config.propertyNameCasing),
      this.getType(ctx, property.schema, schema.required.has(property.name) ? undefined : true),
      {
        description: property.schema.description?.trim(),
        annotations: [
          this.getJakartaPatternAnnotation(ctx, schema, property),
          this.getJakartaValidAnnotation(ctx, schema, property),
          this.getSwaggerSchemaAnnotation(ctx, schema, property),
          this.getJacksonJsonPropertyAnnotation(ctx, schema, property),
          this.getJacksonJsonIncludeAnnotation(ctx, schema, property),
        ].filter(notNullish),
        override: inheritedSchemas.some((x) => this.hasProperty(ctx, x, property.name)),
        property: 'readonly',
        default:
          property.schema.default !== undefined || !schema.required.has(property.name)
            ? this.getDefaultValue(ctx, property.schema)
            : null,
      }
    );
  }

  protected getInterfaceProperty(
    ctx: Context,
    schema: ApiSchema<'object'>,
    property: ApiSchemaProperty
  ): KtProperty<Builder> {
    return ktProperty(toCasing(property.name, ctx.config.propertyNameCasing), {
      doc: ktDoc(property.schema.description?.trim()),
      annotations: [
        this.getJacksonJsonPropertyAnnotation(ctx, schema, property, 'get'),
        this.getJacksonJsonIncludeAnnotation(ctx, schema, property, 'get'),
      ].filter(notNullish),
      type: this.getType(ctx, property.schema, schema.required.has(property.name) ? undefined : true),
    });
  }

  protected getAdditionalPropertiesProperty(ctx: Context, schema: ApiSchema<'object'>): KtProperty<Builder> {
    return ktProperty(toCasing('additionalProperties', ctx.config.propertyNameCasing), {
      annotations: [ktAnnotation(jackson.jsonIgnore())],
      type: ktReference('MutableMap', null, {
        generics: ['String', this.getAdditionalPropertiesType(ctx, schema)],
      }),
      default: 'mutableMapOf()',
    });
  }

  protected getAdditionalPropertiesSetter(ctx: Context, schema: ApiSchema<'object'>): KtFunction<Builder> {
    return ktFunction(toCasing('set', ctx.config.functionNameCasing), {
      annotations: [ktAnnotation(jackson.jsonAnySetter())],
      parameters: [
        ktParameter(toCasing('name', ctx.config.parameterNameCasing), 'String'),
        ktParameter(toCasing('value', ctx.config.parameterNameCasing), this.getAdditionalPropertiesType(ctx, schema)),
      ],
      body: `this.${toCasing('additionalProperties', ctx.config.propertyNameCasing)}[name] = value`,
    });
  }

  protected getAdditionalPropertiesGetter(ctx: Context, schema: ApiSchema<'object'>): KtFunction<Builder> {
    return ktFunction(toCasing('getMap', ctx.config.functionNameCasing), {
      annotations: [ktAnnotation(jackson.jsonAnyGetter())],
      returnType: kotlin.map([kotlin.string(), this.getAdditionalPropertiesType(ctx, schema)]),
      body: `return this.${toCasing('additionalProperties', ctx.config.propertyNameCasing)}`,
    });
  }
  // #endregion

  // #region Annotations
  protected getJacksonJsonTypeInfoAnnotation(ctx: Context, schema: ApiSchema<'object'>): KtAnnotation<Builder> | null {
    return ctx.config.addJacksonAnnotations && schema.discriminator
      ? ktAnnotation(jackson.jsonTypeInfo(), [
          ktNamedArgument('use', 'JsonTypeInfo.Id.NAME'),
          ktNamedArgument('include', 'JsonTypeInfo.As.EXISTING_PROPERTY'),
          ktNamedArgument('property', ktString(schema.discriminator.propertyName)),
          ktNamedArgument('visible', 'true'),
        ])
      : null;
  }

  protected getJacksonJsonSubTypesAnnotation(ctx: Context, schema: ApiSchema<'object'>): KtAnnotation<Builder> | null {
    if (!ctx.config.addJacksonAnnotations || !schema.discriminator) return null;
    const entries = Object.entries(schema.discriminator.mapping);
    return entries.length > 0
      ? ktAnnotation(
          jackson.jsonSubTypes(),
          entries.map(([value, schema]) =>
            ktArgument(
              ktCall(
                [jackson.jsonSubTypes(), 'Type'],
                [
                  ktNamedArgument('value', appendValueGroup<Builder>([this.getType(ctx, schema), '::class'])),
                  ktNamedArgument('name', ktString(value)),
                ]
              )
            )
          )
        )
      : null;
  }

  protected getJacksonJsonPropertyAnnotation(
    ctx: Context,
    schema: ApiSchema,
    property: ApiSchemaProperty,
    target?: KtAnnotationTarget
  ): KtAnnotation<Builder> | null {
    return ctx.config.addJacksonAnnotations
      ? ktAnnotation(
          jackson.jsonProperty(),
          [
            ktArgument(ktString(property.name)),
            schema.required.has(property.name) ? ktNamedArgument('required', 'true') : null,
          ].filter(notNullish),
          { target }
        )
      : null;
  }

  protected getJacksonJsonIncludeAnnotation(
    ctx: Context,
    schema: ApiSchema,
    property: ApiSchemaProperty,
    target?: KtAnnotationTarget
  ): KtAnnotation<Builder> | null {
    return ctx.config.addJacksonAnnotations && property.schema.custom['exclude-when-null'] === true
      ? ktAnnotation(jackson.jsonInclude(), [ktArgument((b) => b.append(jackson.jsonInclude(), '.Include.NON_NULL'))], {
          target,
        })
      : null;
  }

  protected getJakartaPatternAnnotation(
    ctx: Context,
    schema: ApiSchema,
    property: ApiSchemaProperty
  ): KtAnnotation<Builder> | null {
    return ctx.config.addJakartaValidationAnnotations && property.schema.kind === 'string' && property.schema.pattern
      ? ktAnnotation(jakarta.pattern(), [ktNamedArgument('regexp', ktString(property.schema.pattern))], {
          target: 'get',
        })
      : null;
  }

  protected getJakartaValidAnnotation(
    ctx: Context,
    schema: ApiSchema,
    property: ApiSchemaProperty
  ): KtAnnotation<Builder> | null {
    return ctx.config.addJakartaValidationAnnotations && this.shouldGenerateTypeDeclaration(ctx, property.schema)
      ? ktAnnotation(jakarta.valid(), [], { target: 'field' })
      : null;
  }

  protected getSwaggerSchemaAnnotation(
    ctx: Context,
    schema: ApiSchema,
    property: ApiSchemaProperty
  ): KtAnnotation<Builder> | null {
    return ctx.config.addSwaggerAnnotations
      ? ktAnnotation(
          swagger.schema(),
          [
            property.schema.example !== undefined
              ? ktNamedArgument('example', ktString(String(property.schema.example)))
              : null,
            schema.required.has(property.name) ? ktNamedArgument('required', 'true') : null,
            property.schema.description !== undefined
              ? ktNamedArgument('description', ktString(property.schema.description))
              : null,
          ].filter(notNullish)
        )
      : null;
  }
  // #endregion

  protected getPackageName(ctx: Context, schema: ApiSchema): string {
    const packageSuffix =
      typeof ctx.config.packageSuffix === 'string' ? ctx.config.packageSuffix : ctx.config.packageSuffix(schema);
    return ctx.config.packageName + packageSuffix;
  }

  protected shouldGenerateTypeDeclaration(ctx: Context, schema: ApiSchema): boolean {
    // All enum types should have its own type declaration
    if (schema.enum !== undefined && schema.enum.length > 0) {
      return true;
    }

    // All primitive types already exist and do not need its own type declaration
    if (
      schema.kind !== 'combined' &&
      schema.kind !== 'multi-type' &&
      schema.kind !== 'object' &&
      schema.kind !== 'oneOf'
    ) {
      return false;
    }

    // Too complex types cannot be represented in Kotlin, so they fallback to Any
    if (schema.kind === 'multi-type') {
      return false;
    }
    schema = this.normalizeSchema(ctx, schema);
    if (schema.kind === 'combined' || schema.kind === 'oneOf') {
      return false;
    }

    // Only object types with properties should have its own type declaration
    if (
      schema.kind === 'object' &&
      schema.properties.size === 0 &&
      schema.anyOf.length === 0 &&
      schema.allOf.length === 0
    ) {
      return false;
    }

    return true;
  }

  protected getDeclarationTypeName(ctx: Context, schema: ApiSchema): string {
    return toCasing(schema.name, ctx.config.typeNameCasing);
  }

  protected getInheritedSchemas(ctx: KotlinModelGeneratorContext, schema: ApiSchema) {
    return schema.inheritedSchemas
      .filter((x) => this.shouldGenerateTypeDeclaration(ctx, x) && !x.isNameGenerated)
      .filter((item, index, self) => self.indexOf(item) === index);
  }

  protected getClassProperties(ctx: Context, schema: ApiSchema<'object'>): ApiSchemaProperty[] {
    const inheritedSchemas = this.getInheritedSchemas(ctx, schema);
    const properties: ApiSchemaProperty[] = [];
    const appendedProperties: ApiSchemaProperty[] = [];
    for (const property of schema.properties.values()) {
      const discriminator = inheritedSchemas.find(
        (x) => x.discriminator?.propertyName === property.name
      )?.discriminator;
      if (discriminator) {
        const schemaMappings = Object.entries(discriminator.mapping).filter(([_, v]) => v.id === schema.id);
        if (schemaMappings.length === 1) {
          const p = createOverwriteProxy(property);
          const s = createOverwriteProxy(p.schema);
          p.schema = s;
          s.default = schemaMappings[0][0];
          appendedProperties.push(p);
          continue;
        }
      }

      properties.push(property);
    }

    return [...this.sortProperties(ctx, schema, properties), ...appendedProperties];
  }

  protected sortProperties(
    ctx: Context,
    schema: ApiSchema,
    properties: Iterable<ApiSchemaProperty>
  ): ApiSchemaProperty[] {
    return [...properties].sort((a, b) => classify(a) - classify(b));

    function classify(p: ApiSchemaProperty) {
      if (p.schema.default !== undefined) return 1;
      if (schema.required.has(p.name)) return 0;
      return 2;
    }
  }

  private normalizeSchema(ctx: Context, schema: ApiSchema): ApiSchema {
    if (schema.kind === 'oneOf') {
      schema =
        ctx.config.oneOfBehavior === 'treat-as-any-of'
          ? { ...(schema as any), kind: 'combined', anyOf: schema.oneOf, allOf: [], oneOf: undefined }
          : { ...(schema as any), kind: 'combined', allOf: schema.oneOf, anyOf: [], oneOf: undefined };
      ctx.schema = schema;
    }
    if (schema.kind === 'object' || schema.kind === 'combined') {
      const mergedSchema = resolveAnyOfAndAllOf(schema, true);
      if (mergedSchema) {
        schema = mergedSchema;
      }
    }

    return schema;
  }

  private hasProperty(ctx: Context, schema: ApiSchema, name: string): boolean {
    return (
      ('properties' in schema && schema.properties.has(name)) ||
      ('anyOf' in schema && schema.anyOf.some((x) => this.hasProperty(ctx, x, name))) ||
      ('allOf' in schema && schema.allOf.some((x) => this.hasProperty(ctx, x, name)))
    );
  }
}
