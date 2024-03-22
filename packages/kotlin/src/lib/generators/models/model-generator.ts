/* eslint-disable unused-imports/no-unused-vars */
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
  modifyEach,
  notNullish,
  resolveAnyOfAndAllOf,
  toCasing,
} from '@goast/core';

import { DefaultKotlinModelGeneratorArgs as Args } from '.';
import { KotlinModelGeneratorContext, KotlinModelGeneratorOutput } from './models';
import {
  KtAnnotation,
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
  ktInterface,
  ktNamedArgument,
  ktParameter,
  ktProperty,
  ktReference,
  ktString,
} from '../../ast';
import { KotlinFileBuilder } from '../../file-builder';
import * as kt from '../../references';
import { KotlinFileGenerator } from '../file-generator';

type Context = KotlinModelGeneratorContext;
type Output = KotlinModelGeneratorOutput;
type Builder = KotlinFileBuilder;

export interface KotlinModelGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): TOutput;
}

export class DefaultKotlinModelGenerator extends KotlinFileGenerator<Context, Output> implements KotlinModelGenerator {
  public generate(ctx: Context): KotlinModelGeneratorOutput {
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

    if (this.shouldGenerateTypeDeclaration(ctx, { schema: ctx.schema })) {
      const typeName = this.getDeclarationTypeName(ctx, { schema: ctx.schema });
      const packageName = this.getPackageName(ctx, { schema: ctx.schema });
      const filePath = `${ctx.config.outputDir}/${packageName.replace(/\./g, '/')}/${typeName}.kt`;
      console.log(`Generating model ${packageName}.${typeName} to ${filePath}...`);
      ensureDirSync(dirname(filePath));

      writeFileSync(
        filePath,
        new KotlinFileBuilder(packageName, ctx.config).append(this.getFileContent(ctx, {})).toString()
      );

      return { typeName, packageName, additionalImports: [] };
    } else {
      const reference = this.getType(ctx, { schema: ctx.schema });
      const builder = new KotlinFileBuilder(undefined, ctx.config).append(reference);
      const additionalImports = builder.imports.imports.filter(
        (x) => x.packageName !== reference.packageName && x.typeName !== reference.name
      );
      builder.imports.clear();
      return { typeName: builder.toString(false), packageName: reference.packageName ?? undefined, additionalImports };
    }
  }

  protected getFileContent(ctx: Context, args: Args.GetFileContent): AppendValueGroup<Builder> {
    return appendValueGroup<Builder>(
      [this.getSchemaDeclaration(ctx, { schema: this.normalizeSchema(ctx, { schema: ctx.schema }) })],
      '\n\n'
    );
  }

  protected getSchemaDeclaration(ctx: Context, args: Args.GetSchemaDeclaration): AppendValue<Builder> {
    const { schema } = args;

    if (schema.kind === 'object') {
      return schema.discriminator ? this.getInterface(ctx, { schema }) : this.getClass(ctx, { schema });
    } else if (schema.enum !== undefined && schema.enum.length > 0) {
      return this.getEnum(ctx, { schema });
    }

    return '// The generator was not able to generate this schema.\n// This should not happend. If you see this comment, please open an Issue on Github.';
  }

  protected getClass(ctx: Context, args: Args.GetClass): KtClass<Builder> {
    const { schema } = args;
    const inheritedSchemas = this.getInheritedSchemas(ctx, { schema });
    const parameters = this.getClassProperties(ctx, { schema });

    return ktClass(this.getDeclarationTypeName(ctx, { schema }), {
      doc: ktDoc(schema.description?.trim()),
      classKind: parameters.length === 0 ? null : 'data',
      implements: inheritedSchemas.map((schema) => this.getType(ctx, { schema })),
      primaryConstructor: ktConstructor(
        parameters.map((property) => this.getClassParameter(ctx, { ...args, inheritedSchemas, parameters, property }))
      ),
      members: [
        ...(schema.additionalProperties !== undefined && schema.additionalProperties !== false
          ? [
              this.getAdditionalPropertiesProperty(ctx, { schema }),
              this.getAdditionalPropertiesSetter(ctx, { schema }),
              this.getAdditionalPropertiesGetter(ctx, { schema }),
            ]
          : []),
      ],
    });
  }

  protected getInterface(ctx: Context, args: Args.GetInterface): KtInterface<Builder> {
    const { schema } = args;

    return ktInterface(this.getDeclarationTypeName(ctx, { schema }), {
      doc: ktDoc(schema.description?.trim()),
      annotations: [
        this.getJacksonJsonTypeInfoAnnotation(ctx, { schema }),
        this.getJacksonJsonSubTypesAnnotation(ctx, { schema }),
      ].filter(notNullish),
      members: this.sortProperties(ctx, { schema, properties: schema.properties.values() }).map((property) =>
        this.getInterfaceProperty(ctx, { schema, property })
      ),
    });
  }

  protected getEnum(ctx: Context, args: Args.GetEnum): KtEnum<Builder> {
    const { schema } = args;

    return ktEnum(
      this.getDeclarationTypeName(ctx, { schema }),
      schema.enum?.map((x) =>
        ktEnumValue(toCasing(String(x), ctx.config.enumValueNameCasing), {
          annotations: [ktAnnotation(kt.jackson.jsonProperty(), [ktArgument(ktString(String(x)))])],
          arguments: [ktArgument(ktString(String(x)))],
        })
      ) ?? [],
      {
        doc: ktDoc(schema.description?.trim()),
        primaryConstructor: ktConstructor([
          ktClassParameter(toCasing('value', ctx.config.propertyNameCasing), kt.string(), { property: 'readonly' }),
        ]),
      }
    );
  }

  protected getType(ctx: Context, args: Args.GetType): KtReference<Builder> {
    const { schema } = args;

    const generatedType = this.getGeneratedType(ctx, { schema, nullable: args.nullable });
    if (generatedType) {
      return generatedType;
    }

    const nullable = args.nullable ?? schema.nullable;
    switch (schema.kind) {
      case 'boolean':
        return kt.boolean(nullable);
      case 'integer':
      case 'number':
        switch (schema.format) {
          case 'int32':
            return kt.int(nullable);
          case 'int64':
            return kt.long(nullable);
          case 'float':
            return kt.float(nullable);
          case 'double':
            return kt.double(nullable);
          default:
            return schema.kind === 'integer' ? kt.int(nullable) : kt.double(nullable);
        }
      case 'string':
        switch (schema.format) {
          case 'date-time':
            return kt.java.offsetDateTime(nullable);
          default:
            return kt.string(nullable);
        }
      case 'null':
        return kt.nothing(nullable);
      case 'unknown':
        return kt.any(nullable);
      case 'array':
        return kt.list([schema.items ? this.getType(ctx, { schema: schema.items }) : kt.any(true)], nullable);
      case 'object':
        return schema.properties.size === 0 && schema.additionalProperties
          ? kt.map([kt.string(), this.getAdditionalPropertiesType(ctx, { schema })], nullable)
          : kt.any(nullable);
      default:
        return kt.any(nullable);
    }
  }

  protected getGeneratedType(ctx: Context, args: Args.GetGeneratedType): KtReference<Builder> | null {
    const schema = getSchemaReference(args.schema, ['description']);
    if (this.shouldGenerateTypeDeclaration(ctx, { schema })) {
      return ktReference(this.getDeclarationTypeName(ctx, { schema }), this.getPackageName(ctx, { schema }), {
        nullable: args.nullable ?? schema.nullable,
      });
    }
    return null;
  }

  protected getAdditionalPropertiesType(ctx: Context, args: Args.GetAdditionalPropertiesType): KtReference<Builder> {
    const { schema } = args;

    return typeof schema.additionalProperties === 'object'
      ? this.getType(ctx, { schema: schema.additionalProperties })
      : kt.any(true);
  }

  protected getDefaultValue(ctx: Context, args: Args.GetDefaultValue): AppendValue<Builder> {
    const { schema } = args;

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
                this.getType(ctx, { schema }),
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
  protected getClassParameter(ctx: Context, args: Args.GetClassParameter): KtParameter<Builder> {
    const { schema, inheritedSchemas, property } = args;

    return ktClassParameter(
      toCasing(property.name, ctx.config.propertyNameCasing),
      this.getType(ctx, { schema: property.schema, nullable: schema.required.has(property.name) ? undefined : true }),
      {
        description: property.schema.description?.trim(),
        annotations: [
          this.getJakartaPatternAnnotation(ctx, { schema, property }),
          this.getJakartaValidAnnotation(ctx, { schema, property }),
          this.getSwaggerSchemaAnnotation(ctx, { schema, property }),
          this.getJacksonJsonPropertyAnnotation(ctx, { schema, property }),
          this.getJacksonJsonIncludeAnnotation(ctx, { schema, property }),
        ].filter(notNullish),
        override: inheritedSchemas.some((schema) => this.hasProperty(ctx, { schema, propertyName: property.name })),
        property: 'readonly',
        default:
          property.schema.default !== undefined || !schema.required.has(property.name)
            ? this.getDefaultValue(ctx, { schema: property.schema })
            : null,
      }
    );
  }

  protected getInterfaceProperty(ctx: Context, args: Args.GetInterfaceProperty): KtProperty<Builder> {
    const { schema, property } = args;

    return ktProperty(toCasing(property.name, ctx.config.propertyNameCasing), {
      doc: ktDoc(property.schema.description?.trim()),
      annotations: modifyEach(
        [
          this.getJacksonJsonPropertyAnnotation(ctx, { schema, property }),
          this.getJacksonJsonIncludeAnnotation(ctx, { schema, property }),
        ].filter(notNullish),
        (x) => (x.target = 'get')
      ),
      type: this.getType(ctx, {
        schema: property.schema,
        nullable: schema.required.has(property.name) ? undefined : true,
      }),
    });
  }

  protected getAdditionalPropertiesProperty(
    ctx: Context,
    args: Args.GetAdditionalPropertiesProperty
  ): KtProperty<Builder> {
    const { schema } = args;

    return ktProperty(toCasing('additionalProperties', ctx.config.propertyNameCasing), {
      annotations: [ktAnnotation(kt.jackson.jsonIgnore())],
      type: ktReference('MutableMap', null, {
        generics: ['String', this.getAdditionalPropertiesType(ctx, { schema })],
      }),
      default: 'mutableMapOf()',
    });
  }

  protected getAdditionalPropertiesSetter(ctx: Context, args: Args.GetAdditionalPropertiesSetter): KtFunction<Builder> {
    const { schema } = args;

    return ktFunction(toCasing('set', ctx.config.functionNameCasing), {
      annotations: [ktAnnotation(kt.jackson.jsonAnySetter())],
      parameters: [
        ktParameter(toCasing('name', ctx.config.parameterNameCasing), 'String'),
        ktParameter(
          toCasing('value', ctx.config.parameterNameCasing),
          this.getAdditionalPropertiesType(ctx, { schema })
        ),
      ],
      body: `this.${toCasing('additionalProperties', ctx.config.propertyNameCasing)}[name] = value`,
    });
  }

  protected getAdditionalPropertiesGetter(ctx: Context, args: Args.GetAdditionalPropertiesGetter): KtFunction<Builder> {
    const { schema } = args;

    return ktFunction(toCasing('getMap', ctx.config.functionNameCasing), {
      annotations: [ktAnnotation(kt.jackson.jsonAnyGetter())],
      returnType: kt.map([kt.string(), this.getAdditionalPropertiesType(ctx, { schema })]),
      body: `return this.${toCasing('additionalProperties', ctx.config.propertyNameCasing)}`,
    });
  }
  // #endregion

  // #region Annotations
  protected getJacksonJsonTypeInfoAnnotation(
    ctx: Context,
    args: Args.GetJacksonJsonTypeInfoAnnotation
  ): KtAnnotation<Builder> | null {
    const { schema } = args;

    return ctx.config.addJacksonAnnotations && schema.discriminator
      ? ktAnnotation(kt.jackson.jsonTypeInfo(), [
          ktNamedArgument('use', 'JsonTypeInfo.Id.NAME'),
          ktNamedArgument('include', 'JsonTypeInfo.As.EXISTING_PROPERTY'),
          ktNamedArgument('property', ktString(schema.discriminator.propertyName)),
          ktNamedArgument('visible', 'true'),
        ])
      : null;
  }

  protected getJacksonJsonSubTypesAnnotation(
    ctx: Context,
    args: Args.GetJacksonJsonSubTypesAnnotation
  ): KtAnnotation<Builder> | null {
    const { schema } = args;

    if (!ctx.config.addJacksonAnnotations || !schema.discriminator) return null;
    const entries = Object.entries(schema.discriminator.mapping);
    return entries.length > 0
      ? ktAnnotation(
          kt.jackson.jsonSubTypes(),
          entries.map(([value, schema]) =>
            ktArgument(
              ktCall(
                [kt.jackson.jsonSubTypes(), 'Type'],
                [
                  ktNamedArgument('value', appendValueGroup<Builder>([this.getType(ctx, { schema }), '::class'])),
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
    args: Args.GetJacksonJsonPropertyAnnotation
  ): KtAnnotation<Builder> | null {
    const { schema, property } = args;

    return ctx.config.addJacksonAnnotations
      ? ktAnnotation(
          kt.jackson.jsonProperty(),
          [
            ktArgument(ktString(property.name)),
            schema.required.has(property.name) ? ktNamedArgument('required', 'true') : null,
          ].filter(notNullish)
        )
      : null;
  }

  protected getJacksonJsonIncludeAnnotation(
    ctx: Context,
    args: Args.GetJacksonJsonIncludeAnnotation
  ): KtAnnotation<Builder> | null {
    const { property } = args;

    return ctx.config.addJacksonAnnotations && property.schema.custom['exclude-when-null'] === true
      ? ktAnnotation(kt.jackson.jsonInclude(), [
          ktArgument((b) => b.append(kt.jackson.jsonInclude(), '.Include.NON_NULL')),
        ])
      : null;
  }

  protected getJakartaPatternAnnotation(
    ctx: Context,
    args: Args.GetJakartaPatternAnnotation
  ): KtAnnotation<Builder> | null {
    const { property } = args;

    return ctx.config.addJakartaValidationAnnotations && property.schema.kind === 'string' && property.schema.pattern
      ? ktAnnotation(kt.jakarta.pattern(), [ktNamedArgument('regexp', ktString(property.schema.pattern))], {
          target: 'get',
        })
      : null;
  }

  protected getJakartaValidAnnotation(
    ctx: Context,
    args: Args.GetJakartaValidAnnotation
  ): KtAnnotation<Builder> | null {
    const { property } = args;

    return ctx.config.addJakartaValidationAnnotations &&
      this.shouldGenerateTypeDeclaration(ctx, { schema: property.schema })
      ? ktAnnotation(kt.jakarta.valid(), [], { target: 'field' })
      : null;
  }

  protected getSwaggerSchemaAnnotation(
    ctx: Context,
    args: Args.GetSwaggerSchemaAnnotation
  ): KtAnnotation<Builder> | null {
    const { schema, property } = args;

    return ctx.config.addSwaggerAnnotations
      ? ktAnnotation(
          kt.swagger.schema(),
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

  protected getPackageName(ctx: Context, args: Args.GetPackageName): string {
    const { schema } = args;

    const packageSuffix =
      typeof ctx.config.packageSuffix === 'string' ? ctx.config.packageSuffix : ctx.config.packageSuffix(schema);
    return ctx.config.packageName + packageSuffix;
  }

  protected shouldGenerateTypeDeclaration(ctx: Context, args: Args.ShouldGenerateTypeDeclaration): boolean {
    let { schema } = args;

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
    schema = this.normalizeSchema(ctx, { schema });
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

  protected getDeclarationTypeName(ctx: Context, args: Args.GetDeclarationTypeName): string {
    return toCasing(args.schema.name, ctx.config.typeNameCasing);
  }

  protected getInheritedSchemas(ctx: Context, args: Args.GetInheritedSchemas) {
    return args.schema.inheritedSchemas
      .filter((schema) => this.shouldGenerateTypeDeclaration(ctx, { schema }) && !schema.isNameGenerated)
      .filter((item, index, self) => self.indexOf(item) === index);
  }

  protected getClassProperties(ctx: Context, args: Args.GetClassProperties): ApiSchemaProperty[] {
    const { schema } = args;

    const inheritedSchemas = this.getInheritedSchemas(ctx, { schema });
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

    return [...this.sortProperties(ctx, { schema, properties }), ...appendedProperties];
  }

  protected sortProperties(ctx: Context, args: Args.SortProperties): ApiSchemaProperty[] {
    return [...args.properties].sort((a, b) => classify(a) - classify(b));

    function classify(p: ApiSchemaProperty) {
      if (p.schema.default !== undefined) return 1;
      if (args.schema.required.has(p.name)) return 0;
      return 2;
    }
  }

  protected normalizeSchema(ctx: Context, args: Args.NormalizeSchema): ApiSchema {
    let { schema } = args;

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

  protected hasProperty(ctx: Context, args: Args.HasProperty): boolean {
    const { schema, propertyName } = args;

    return (
      ('properties' in schema && schema.properties.has(propertyName)) ||
      ('anyOf' in schema && schema.anyOf.some((schema) => this.hasProperty(ctx, { schema, propertyName }))) ||
      ('allOf' in schema && schema.allOf.some((schema) => this.hasProperty(ctx, { schema, propertyName })))
    );
  }
}
