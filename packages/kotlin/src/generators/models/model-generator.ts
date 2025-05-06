import { dirname } from 'node:path';

// @deno-types="npm:@types/fs-extra@11"
import fs from 'fs-extra';

import {
  type ApiSchema,
  type ApiSchemaKind,
  type ApiSchemaProperty,
  type AppendValue,
  type AppendValueGroup,
  appendValueGroup,
  createOverwriteProxy,
  getSchemaReference,
  type MaybePromise,
  modify,
  modifyEach,
  notNullish,
  resolveAnyOfAndAllOf,
  builderTemplate as s,
  type SourceBuilder,
  toCasing,
} from '@goast/core';

import { kt } from '../../ast/index.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { KotlinFileGenerator } from '../file-generator.ts';
import type { DefaultKotlinModelGeneratorArgs as Args } from './index.ts';
import type { KotlinModelGeneratorContext, KotlinModelGeneratorOutput } from './models.ts';

type Context = KotlinModelGeneratorContext;
type Output = KotlinModelGeneratorOutput;
type Builder = KotlinFileBuilder;

export interface KotlinModelGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): MaybePromise<TOutput>;
}

export class DefaultKotlinModelGenerator extends KotlinFileGenerator<Context, Output> implements KotlinModelGenerator {
  public generate(ctx: Context): MaybePromise<KotlinModelGeneratorOutput> {
    if (/\/(anyOf|allOf)(\/[0-9]+)?$/.test(ctx.schema.$src.path)) {
      // Do not generate types that are only used for anyOf and/or allOf
      return { type: kt.refs.any({ nullable: true }) };
    }

    if (this.shouldGenerateTypeDeclaration(ctx, { schema: ctx.schema })) {
      const typeName = this.getDeclarationTypeName(ctx, { schema: ctx.schema });
      const packageName = this.getPackageName(ctx, { schema: ctx.schema });
      const filePath = `${ctx.config.outputDir}/${packageName.replace(/\./g, '/')}/${typeName}.kt`;
      console.log(`Generating model ${packageName}.${typeName} to ${filePath}...`);
      fs.ensureDirSync(dirname(filePath));

      fs.writeFileSync(
        filePath,
        new KotlinFileBuilder(packageName, ctx.config).append(this.getFileContent(ctx, {})).toString(),
      );

      return { type: kt.reference(typeName, packageName) };
    } else {
      return { type: this.getType(ctx, { schema: ctx.schema }) };
    }
  }

  protected getFileContent(ctx: Context, _args: Args.GetFileContent): AppendValueGroup<Builder> {
    return appendValueGroup<Builder>(
      [this.getSchemaDeclaration(ctx, { schema: this.normalizeSchema(ctx, { schema: ctx.schema }) })],
      '\n\n',
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

  protected getClass(ctx: Context, args: Args.GetClass): kt.Class<Builder> {
    const { schema } = args;
    const inheritedSchemas = this.getInheritedSchemas(ctx, { schema });
    const parameters = this.getClassProperties(ctx, { schema });

    return kt.class(this.getDeclarationTypeName(ctx, { schema }), {
      doc: kt.doc(schema.description?.trim()),
      annotations: [schema.deprecated ? kt.annotation(kt.refs.deprecated(), [kt.argument(kt.string(''))]) : null],
      classKind: parameters.length === 0 ? null : 'data',
      implements: inheritedSchemas.map((schema) => this.getType(ctx, { schema })),
      primaryConstructor: kt.constructor(
        parameters.map((property) => this.getClassParameter(ctx, { ...args, inheritedSchemas, parameters, property })),
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

  protected getInterface(ctx: Context, args: Args.GetInterface): kt.Interface<Builder> {
    const { schema } = args;

    return kt.interface(this.getDeclarationTypeName(ctx, { schema }), {
      doc: kt.doc(schema.description?.trim()),
      annotations: [
        this.getJacksonJsonTypeInfoAnnotation(ctx, { schema }),
        this.getJacksonJsonSubTypesAnnotation(ctx, { schema }),
        schema.deprecated ? kt.annotation(kt.refs.deprecated(), [kt.argument(kt.string(''))]) : null,
      ].filter(notNullish),
      members: this.sortProperties(ctx, { schema, properties: schema.properties.values() }).map((property) =>
        this.getInterfaceProperty(ctx, { schema, property })
      ),
    });
  }

  protected getEnum(ctx: Context, args: Args.GetEnum): kt.Enum<Builder> {
    const { schema } = args;

    const name = this.getDeclarationTypeName(ctx, { schema });
    return kt.enum(
      name,
      schema.enum?.map((x) =>
        kt.enumValue(toCasing(String(x), ctx.config.enumValueNameCasing), {
          annotations: [kt.annotation(kt.refs.jackson.jsonProperty(), [kt.argument(kt.string(String(x)))])],
          arguments: [kt.argument(kt.string(String(x)))],
        })
      ) ?? [],
      {
        doc: kt.doc(schema.description?.trim()),
        annotations: [schema.deprecated ? kt.annotation(kt.refs.deprecated(), [kt.argument(kt.string(''))]) : null],
        primaryConstructor: kt.constructor([
          kt.parameter.class(toCasing('value', ctx.config.propertyNameCasing), kt.refs.string(), {
            property: 'readonly',
          }),
        ]),
        companionObject: kt.object({
          members: [
            kt.function('fromValue', {
              parameters: [kt.parameter('value', kt.refs.string())],
              returnType: kt.reference(name, null, { nullable: true }),
              singleExpression: true,
              body: !schema.enum?.length ? 'null' : s`\nwhen(value) {${s.indent`${
                appendValueGroup([
                  schema.enum.map((x) =>
                    s`\n${kt.string(String(x))} -> ${toCasing(String(x), ctx.config.enumValueNameCasing)}`
                  ),
                ])
              }
                else -> null`}
              }`,
            }),
          ],
        }),
      },
    );
  }

  protected getType(ctx: Context, args: Args.GetType): kt.Reference<SourceBuilder> {
    const { schema } = args;

    const generatedType = this.getGeneratedType(ctx, { schema, nullable: args.nullable });
    if (generatedType) {
      return generatedType;
    }

    const nullable = args.nullable ?? schema.nullable;
    switch (schema.kind) {
      case 'boolean':
        return kt.refs.boolean({ nullable });
      case 'integer':
      case 'number':
        switch (schema.format) {
          case 'int32':
            return kt.refs.int({ nullable });
          case 'int64':
            return kt.refs.long({ nullable });
          case 'float':
            return kt.refs.float({ nullable });
          case 'double':
            return kt.refs.double({ nullable });
          default:
            return schema.kind === 'integer' ? kt.refs.int({ nullable }) : kt.refs.double({ nullable });
        }
      case 'string':
        switch (schema.format) {
          case 'date-time':
            return kt.refs.java.offsetDateTime({ nullable });
          default:
            return kt.refs.string({ nullable });
        }
      case 'null':
        return kt.refs.nothing({ nullable });
      case 'unknown':
        return kt.refs.any({ nullable });
      case 'array':
        return kt.refs.list(
          [schema.items ? this.getType(ctx, { schema: schema.items }) : kt.refs.any({ nullable: true })],
          { nullable },
        );
      case 'object':
        return schema.properties.size === 0 && schema.additionalProperties
          ? kt.refs.map([kt.refs.string(), this.getAdditionalPropertiesType(ctx, { schema })], { nullable })
          : kt.refs.any({ nullable });
      default:
        return kt.refs.any({ nullable });
    }
  }

  protected getGeneratedType(ctx: Context, args: Args.GetGeneratedType): kt.Reference<SourceBuilder> | null {
    const schema = getSchemaReference(args.schema, ['description']);
    if (this.shouldGenerateTypeDeclaration(ctx, { schema })) {
      return kt.reference(this.getDeclarationTypeName(ctx, { schema }), this.getPackageName(ctx, { schema }), {
        nullable: args.nullable ?? schema.nullable,
      });
    }
    return null;
  }

  protected getAdditionalPropertiesType(
    ctx: Context,
    args: Args.GetAdditionalPropertiesType,
  ): kt.Reference<SourceBuilder> {
    const { schema } = args;

    return typeof schema.additionalProperties === 'object'
      ? this.getType(ctx, { schema: schema.additionalProperties })
      : kt.refs.any({ nullable: true });
  }

  protected getDefaultValue(ctx: Context, args: Args.GetDefaultValue): kt.Value<Builder> {
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
            ? kt.call([this.getType(ctx, { schema }), toCasing(String(schema.default), ctx.config.enumValueNameCasing)])
            : kt.string(String(schema.default));
        case 'array':
          return kt.call(
            kt.refs.listOf.infer(),
            Array.isArray(schema.default) ? schema.default.map((x) => kt.toNode(x)) : [],
          );
        default:
          return 'null';
      }
    }
  }

  // #region Members
  protected getClassParameter(ctx: Context, args: Args.GetClassParameter): kt.Parameter<Builder> {
    const { schema, inheritedSchemas, property } = args;

    return kt.parameter.class(
      toCasing(property.name, ctx.config.propertyNameCasing),
      this.getType(ctx, { schema: property.schema, nullable: schema.required.has(property.name) ? undefined : true }),
      {
        description: property.schema.description?.trim(),
        annotations: [
          ...this.getJakartaValidationAnnotations(ctx, { schema, property }),
          this.getSwaggerSchemaAnnotation(ctx, { schema, property }),
          this.getJacksonJsonPropertyAnnotation(ctx, { schema, property }),
          this.getJacksonJsonPropertyDescriptionAnnotation(ctx, { schema, property }),
          modify(this.getJacksonJsonIncludeAnnotation(ctx, { schema, property }), (x) => (x.target = 'get')),
          property.schema.deprecated ? kt.annotation(kt.refs.deprecated(), [kt.argument(kt.string(''))]) : null,
        ].filter(notNullish),
        override: inheritedSchemas.some((schema) => this.hasProperty(ctx, { schema, propertyName: property.name })),
        property: 'readonly',
        default: property.schema.default !== undefined || !schema.required.has(property.name)
          ? this.getDefaultValue(ctx, { schema: property.schema })
          : null,
      },
    );
  }

  protected getInterfaceProperty(ctx: Context, args: Args.GetInterfaceProperty): kt.Property<Builder> {
    const { schema, property } = args;

    return kt.property(toCasing(property.name, ctx.config.propertyNameCasing), {
      doc: kt.doc(property.schema.description?.trim()),
      annotations: modifyEach(
        [
          this.getJacksonJsonPropertyAnnotation(ctx, { schema, property }),
          this.getJacksonJsonPropertyDescriptionAnnotation(ctx, { schema, property }),
          this.getJacksonJsonIncludeAnnotation(ctx, { schema, property }),
          property.schema.deprecated ? kt.annotation(kt.refs.deprecated(), [kt.argument(kt.string(''))]) : null,
        ].filter(notNullish),
        (x) => (x.target = 'get'),
      ),
      type: this.getType(ctx, {
        schema: property.schema,
        nullable: schema.required.has(property.name) ? undefined : true,
      }),
    });
  }

  protected getAdditionalPropertiesProperty(
    ctx: Context,
    args: Args.GetAdditionalPropertiesProperty,
  ): kt.Property<Builder> {
    const { schema } = args;

    return kt.property(toCasing('additionalProperties', ctx.config.propertyNameCasing), {
      annotations: [kt.annotation(kt.refs.jackson.jsonIgnore())],
      type: kt.reference('MutableMap', null, {
        generics: ['String', this.getAdditionalPropertiesType(ctx, { schema })],
      }),
      default: 'mutableMapOf()',
    });
  }

  protected getAdditionalPropertiesSetter(
    ctx: Context,
    args: Args.GetAdditionalPropertiesSetter,
  ): kt.Function<Builder> {
    const { schema } = args;

    return kt.function(toCasing('set', ctx.config.functionNameCasing), {
      annotations: [kt.annotation(kt.refs.jackson.jsonAnySetter())],
      parameters: [
        kt.parameter(toCasing('name', ctx.config.parameterNameCasing), 'String'),
        kt.parameter(
          toCasing('value', ctx.config.parameterNameCasing),
          this.getAdditionalPropertiesType(ctx, { schema }),
        ),
      ],
      body: `this.${toCasing('additionalProperties', ctx.config.propertyNameCasing)}[name] = value`,
    });
  }

  protected getAdditionalPropertiesGetter(
    ctx: Context,
    args: Args.GetAdditionalPropertiesGetter,
  ): kt.Function<Builder> {
    const { schema } = args;

    return kt.function(toCasing('getMap', ctx.config.functionNameCasing), {
      annotations: [kt.annotation(kt.refs.jackson.jsonAnyGetter())],
      returnType: kt.refs.map([kt.refs.string(), this.getAdditionalPropertiesType(ctx, { schema })]),
      body: `return this.${toCasing('additionalProperties', ctx.config.propertyNameCasing)}`,
    });
  }
  // #endregion

  // #region Annotations
  protected getJacksonJsonTypeInfoAnnotation(
    ctx: Context,
    args: Args.GetJacksonJsonTypeInfoAnnotation,
  ): kt.Annotation<Builder> | null {
    const { schema } = args;

    return ctx.config.addJacksonAnnotations && schema.discriminator
      ? kt.annotation(kt.refs.jackson.jsonTypeInfo(), [
        kt.argument.named('use', 'JsonTypeInfo.Id.NAME'),
        kt.argument.named(
          'include',
          'properties' in schema && schema.properties.has(schema.discriminator.propertyName)
            ? 'JsonTypeInfo.As.EXISTING_PROPERTY'
            : 'JsonTypeInfo.As.PROPERTY',
        ),
        kt.argument.named('property', kt.string(schema.discriminator.propertyName)),
        kt.argument.named('visible', 'true'),
      ])
      : null;
  }

  protected getJacksonJsonSubTypesAnnotation(
    ctx: Context,
    args: Args.GetJacksonJsonSubTypesAnnotation,
  ): kt.Annotation<Builder> | null {
    const { schema } = args;

    if (!ctx.config.addJacksonAnnotations || !schema.discriminator) return null;
    const entries = Object.entries(schema.discriminator.mapping);
    return entries.length > 0
      ? kt.annotation(
        kt.refs.jackson.jsonSubTypes(),
        entries.map(([value, schema]) =>
          kt.argument(
            kt.call(
              [kt.refs.jackson.jsonSubTypes(), 'Type'],
              [
                kt.argument.named(
                  'value',
                  modify(this.getType(ctx, { schema }), (x) => (x.classReference = true)),
                ),
                kt.argument.named('name', kt.string(value)),
              ],
            ),
          )
        ),
      )
      : null;
  }

  protected getJacksonJsonPropertyAnnotation(
    ctx: Context,
    args: Args.GetJacksonJsonPropertyAnnotation,
  ): kt.Annotation<Builder> | null {
    const { schema, property } = args;

    return ctx.config.addJacksonAnnotations
      ? kt.annotation(kt.refs.jackson.jsonProperty(), [
        kt.argument(kt.string(property.name)),
        schema.required.has(property.name) ? kt.argument.named('required', 'true') : null,
      ])
      : null;
  }

  protected getJacksonJsonPropertyDescriptionAnnotation(
    ctx: Context,
    args: Args.GetJacksonJsonPropertyDescriptionAnnotation,
  ): kt.Annotation<Builder> | null {
    const { property } = args;

    return ctx.config.addJacksonAnnotations && property.schema.description
      ? kt.annotation(kt.refs.jackson.jsonPropertyDescription(), [
        kt.argument(kt.string(property.schema.description)),
      ])
      : null;
  }

  protected getJacksonJsonIncludeAnnotation(
    ctx: Context,
    args: Args.GetJacksonJsonIncludeAnnotation,
  ): kt.Annotation<Builder> | null {
    const { property } = args;

    return ctx.config.addJacksonAnnotations && property.schema.custom['exclude-when-null'] === true
      ? kt.annotation(kt.refs.jackson.jsonInclude(), [
        kt.argument(kt.call([kt.refs.jackson.jsonInclude(), 'Include', 'NON_NULL'])),
      ])
      : null;
  }

  protected getJakartaValidationAnnotations(
    ctx: Context,
    args: Args.GetJakartaValidationAnnotations,
  ): kt.Annotation<Builder>[] {
    const { property } = args;
    const annotations: kt.Annotation<Builder>[] = [];
    if (!ctx.config.addJakartaValidationAnnotations) {
      return annotations;
    }

    if (property.schema.kind === 'string') {
      if (property.schema.pattern) {
        annotations.push(
          kt.annotation(kt.refs.jakarta.pattern(), [kt.argument.named('regexp', kt.string(property.schema.pattern))], {
            target: 'get',
          }),
        );
      }
      if (property.schema.minLength === 1 && property.schema.maxLength === undefined) {
        annotations.push(kt.annotation(kt.refs.jakarta.notEmpty(), [], { target: 'get' }));
      } else if (property.schema.minLength !== undefined || property.schema.maxLength !== undefined) {
        annotations.push(kt.annotation(kt.refs.jakarta.size(), [
          property.schema.minLength !== undefined ? kt.argument.named('min', property.schema.minLength) : null,
          property.schema.maxLength !== undefined ? kt.argument.named('max', property.schema.maxLength) : null,
        ], { target: 'get' }));
      }
    } else if (property.schema.kind === 'number' || property.schema.kind === 'integer') {
      if (property.schema.minimum !== undefined) {
        annotations.push(
          kt.annotation(kt.refs.jakarta.min(), [kt.argument.named('value', property.schema.minimum)], {
            target: 'get',
          }),
        );
      }
      if (property.schema.maximum !== undefined) {
        annotations.push(
          kt.annotation(kt.refs.jakarta.max(), [kt.argument.named('value', property.schema.maximum)], {
            target: 'get',
          }),
        );
      }
    } else if (property.schema.kind === 'array') {
      if (property.schema.minItems !== undefined || property.schema.maxItems !== undefined) {
        annotations.push(kt.annotation(kt.refs.jakarta.size(), [
          property.schema.minItems !== undefined ? kt.argument.named('min', property.schema.minItems) : null,
          property.schema.maxItems !== undefined ? kt.argument.named('max', property.schema.maxItems) : null,
        ], { target: 'get' }));
      }
    }

    if (this.shouldGenerateTypeDeclaration(ctx, { schema: property.schema })) {
      annotations.push(kt.annotation(kt.refs.jakarta.valid(), [], { target: 'field' }));
    }

    return annotations;
  }

  protected getSwaggerSchemaAnnotation(
    ctx: Context,
    args: Args.GetSwaggerSchemaAnnotation,
  ): kt.Annotation<Builder> | null {
    const { schema, property } = args;

    return ctx.config.addSwaggerAnnotations
      ? kt.annotation(kt.refs.swagger.schema(), [
        property.schema.example !== undefined
          ? kt.argument.named('example', kt.string(String(property.schema.example)))
          : null,
        schema.required.has(property.name) ? kt.argument.named('required', 'true') : null,
        property.schema.description !== undefined
          ? kt.argument.named('description', kt.string(property.schema.description))
          : null,
        property.schema.deprecated ? kt.argument.named('deprecated', kt.toNode(property.schema.deprecated)) : null,
      ])
      : null;
  }
  // #endregion

  protected getPackageName(ctx: Context, args: Args.GetPackageName): string {
    const { schema } = args;

    const packageSuffix = typeof ctx.config.packageSuffix === 'string'
      ? ctx.config.packageSuffix
      : ctx.config.packageSuffix(schema);
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

    // Schemas representable by a simple Map type do not need its own type declaration
    if (schema.kind === 'object' && schema.properties.size === 0 && schema.additionalProperties) {
      return false;
    }

    if (schema.kind === 'object' && ctx.config.emptyObjectTypeBehavior === 'use-any' && schema.properties.size === 0) {
      return false;
    }

    // Dynamically generated schemas do not have its own type declaration
    if (!ctx.data.schemas.some((x) => x.id === schema.id)) {
      return false;
    }

    // multipart schemas should not have its own type declaration
    if (schema.$src.path.endsWith('/requestBody/content/multipart/form-data/schema')) {
      return false;
    }

    return true;
  }

  protected getDeclarationTypeName(ctx: Context, args: Args.GetDeclarationTypeName): string {
    return toCasing(args.schema.name, ctx.config.typeNameCasing);
  }

  protected getInheritedSchemas(
    ctx: Context,
    args: Args.GetInheritedSchemas,
  ): (ApiSchema<ApiSchemaKind> & { discriminator: NonNullable<ApiSchema['discriminator']> })[] {
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
        (x) => x.discriminator?.propertyName === property.name,
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

  protected sortProperties(_ctx: Context, args: Args.SortProperties): ApiSchemaProperty[] {
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
      schema = ctx.config.oneOfBehavior === 'treat-as-any-of'
        // deno-lint-ignore no-explicit-any
        ? { ...(schema as any), kind: 'combined', anyOf: schema.oneOf, allOf: [], oneOf: undefined }
        // deno-lint-ignore no-explicit-any
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
