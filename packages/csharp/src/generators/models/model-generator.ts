import {
  type ApiSchema,
  type ApiSchemaProperty,
  type AppendValue,
  type AppendValueGroup,
  appendValueGroup,
  DEFAULT_IGNORED_SCHEMA_PROPERTIES,
  getSchemaReference,
  getSourceDisplayName,
  type MaybePromise,
  notNullish,
  resolveAnyOfAndAllOf,
  type SourceBuilder,
  toCasing,
} from '@goast/core';

import { cs } from '../../ast/index.ts';
import { CSharpFileBuilder } from '../../file-builder.ts';
import { getSourceDocLine, toCSharpPropertyName } from '../../utils.ts';
import { CSharpFileGenerator } from '../file-generator.ts';
import type { DefaultCSharpModelGeneratorArgs as Args } from './index.ts';
import type { CSharpModelGeneratorContext, CSharpModelGeneratorOutput } from './models.ts';

type Context = CSharpModelGeneratorContext;
type Output = CSharpModelGeneratorOutput;
type Builder = CSharpFileBuilder;

/** The members every `record` (and every `object`) declares itself, which a property must not shadow. */
const reservedMemberNames = new Set([
  'Equals',
  'GetHashCode',
  'ToString',
  'GetType',
  'MemberwiseClone',
  'Finalize',
  'ReferenceEquals',
  'EqualityContract',
  'PrintMembers',
  'Deconstruct',
]);

/**
 * An identifier made from the letters, digits and underscores of `raw` (C# allows Unicode letters), for names that
 * `toCasing` reduces to nothing. Falls back to `fallback` if `raw` has none.
 */
function toIdentifier(raw: string, fallback: string): string {
  const identifier = raw.replace(/[^\p{L}\p{Nd}_]/gu, '');
  if (identifier === '') return fallback;
  return /^\p{Nd}/u.test(identifier) ? `_${identifier}` : identifier;
}

/** String formats that map to `string` and so can be initialized with a string literal. */
const stringLiteralFormats = new Set(['password', 'email', 'hostname', 'ipv4', 'ipv6']);

export interface CSharpModelGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): MaybePromise<TOutput>;
}

export class DefaultCSharpModelGenerator extends CSharpFileGenerator<Context, Output> implements CSharpModelGenerator {
  private readonly typeNames = new WeakMap<object, { config: object; names: Map<string, string> }>();

  public generate(ctx: Context): MaybePromise<CSharpModelGeneratorOutput> {
    if (/\/(anyOf|allOf)(\/[0-9]+)?$/.test(ctx.schema.$src.path)) {
      // Do not generate types that are only used for anyOf and/or allOf
      return { type: cs.refs.systemTextJson.jsonElement({ nullable: true }) };
    }

    const schemaReference = getSchemaReference(ctx.schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
    if (schemaReference !== ctx.schema) {
      const typeName = this.getDeclarationTypeName(ctx, { schema: schemaReference });
      const namespace = this.getNamespace(ctx, { schema: schemaReference });
      return { type: cs.reference(typeName, namespace) };
    }

    if (this.shouldGenerateTypeDeclaration(ctx, { schema: ctx.schema })) {
      const typeName = this.getDeclarationTypeName(ctx, { schema: ctx.schema });
      const namespace = this.getNamespace(ctx, { schema: ctx.schema });
      const filePath = `${ctx.config.outputDir}/${ctx.config.modelsDir}/${typeName.replace(/^@/, '')}.cs`;

      console.log(
        `Generating model ${getSourceDisplayName(ctx.data, ctx.schema)} [${namespace}.${typeName}] to ${filePath}...`,
      );
      const builder = new CSharpFileBuilder(namespace, ctx.config);
      builder.append(this.getFileContent(ctx, {}));
      builder.writeToFile(filePath);

      return { type: cs.reference(typeName, namespace) };
    } else {
      return { type: this.getType(ctx, { schema: ctx.schema }) };
    }
  }

  protected getFileContent(ctx: Context, _args: Args.GetFileContent): AppendValueGroup<Builder> {
    const schema = this.normalizeSchema(ctx, { schema: ctx.schema });
    return appendValueGroup<Builder>(
      [
        // Referencing an `[Obsolete]` model is a warning (an error under `TreatWarningsAsErrors`), even when the
        // reference sits in generated code that merely mirrors the structure of the schema.
        schema.kind === 'object' && this.referencesDeprecatedType(ctx, { schema })
          ? '#pragma warning disable CS0612, CS0618'
          : null,
        this.getSchemaDeclaration(ctx, { schema }),
      ].filter(notNullish),
      '\n',
    );
  }

  protected getSchemaDeclaration(ctx: Context, args: Args.GetSchemaDeclaration): AppendValue<Builder> {
    const { schema } = args;

    if (schema.kind === 'object') {
      return this.getRecord(ctx, { schema });
    } else if (this.isDeclarableEnum(schema)) {
      return this.getEnum(ctx, { schema });
    }

    return '// The generator was not able to generate this schema.\n// This should not happend. If you see this comment, please open an Issue on Github.';
  }

  // #region Declarations
  protected getRecord(ctx: Context, args: Args.GetRecord): cs.Record<Builder> {
    const { schema } = args;
    const isBase = schema.discriminator !== undefined;
    const baseSchema = this.getBaseSchema(ctx, { schema });
    const properties = this.getRecordProperties(ctx, { schema });
    const names = this.getPropertyNames(ctx, { schema, properties });

    const hasOwnAdditionalProperties =
      schema.additionalProperties !== undefined &&
      schema.additionalProperties !== false &&
      !(baseSchema && this.inheritsAdditionalProperties(ctx, baseSchema));

    return cs.record(this.getDeclarationTypeName(ctx, { schema }), {
      doc: cs.doc(this.getSchemaDocDescription(ctx, { schema })),
      attributes: [
        schema.deprecated ? this.getObsoleteAttribute(ctx, { schema }) : null,
        isBase ? this.getJsonPolymorphicAttribute(ctx, { schema }) : null,
        ...(isBase ? this.getJsonDerivedTypeAttributes(ctx, { schema }) : []),
      ],
      accessModifier: 'public',
      abstract: isBase,
      sealed: !isBase,
      extends: baseSchema ? this.getType(ctx, { schema: baseSchema, nullable: false }) : null,
      members: [
        ...properties.map((property, i) => this.getRecordProperty(ctx, { schema, property, name: names[i] })),
        hasOwnAdditionalProperties
          ? this.getAdditionalPropertiesProperty(ctx, { schema, name: names[properties.length] })
          : null,
      ],
    });
  }

  protected getEnum(ctx: Context, args: Args.GetEnum): cs.Enum<Builder> {
    const { schema } = args;

    const name = this.getDeclarationTypeName(ctx, { schema });
    // One set of names for both the declaration and every reference to a member (see `getEnumMemberReference`).
    const values = this.getEnumValues(schema);
    const valueNames = this.toEnumValueNames(ctx, values);

    return cs.enum(name, {
      doc: cs.doc(this.getSchemaDocDescription(ctx, { schema })),
      attributes: [
        schema.deprecated ? this.getObsoleteAttribute(ctx, { schema }) : null,
        ...this.getJsonEnumAttributes(ctx, { schema }),
      ],
      accessModifier: 'public',
      underlyingType: schema.kind === 'string' ? null : this.getEnumUnderlyingType(ctx, { schema }),
      members: values.map((value, i) => this.getEnumMember(ctx, { schema, value, name: valueNames[i] })),
    });
  }

  protected getEnumMember(_ctx: Context, args: Args.GetEnumMember): cs.EnumMember<Builder> {
    const { schema, value, name } = args;

    return schema.kind === 'string'
      ? cs.enumMember(name, {
          attributes: [
            cs.attribute(cs.refs.systemTextJson.jsonStringEnumMemberName(), [cs.argument(cs.string(String(value)))]),
          ],
        })
      : cs.enumMember(name, { value: String(value) });
  }

  protected getEnumUnderlyingType(_ctx: Context, args: Args.GetEnumUnderlyingType): cs.Reference<SourceBuilder> | null {
    const { schema } = args;
    const needsLong =
      (schema as ApiSchema<'integer'>).format === 'int64' ||
      this.getEnumValues(schema).some((x) => Math.abs(Number(x)) > 2147483647);
    return needsLong ? cs.refs.system.long() : null;
  }

  protected getSchemaDocDescription(ctx: Context, args: Args.GetSchemaDocDescription): string {
    const docSegments = [args.schema.description?.trim()];

    if (ctx.config.includeSourceInDocs) {
      docSegments.push(getSourceDocLine(args.schema));
    }

    return docSegments.filter(notNullish).join('\n\n');
  }
  // #endregion

  // #region Types
  protected getType(ctx: Context, args: Args.GetType): cs.Reference<SourceBuilder> {
    let { schema, nullable } = args;

    if (schema.kind === 'oneOf' && schema.oneOf.length === 2 && schema.oneOf.some((x) => x.kind === 'null')) {
      const nonNullSchema = schema.oneOf.find((x) => x.kind !== 'null')!;
      if (nonNullSchema) {
        schema = nonNullSchema;
        nullable ??= true;
      }
    }

    const generatedType = this.getGeneratedType(ctx, { schema, nullable });
    if (generatedType) {
      return generatedType;
    }

    nullable ??= schema.nullable;
    switch (schema.kind) {
      case 'boolean':
        return cs.refs.system.bool({ nullable });
      case 'integer':
      case 'number':
        switch (schema.format) {
          case 'int32':
            return cs.refs.system.int({ nullable });
          case 'int64':
            return cs.refs.system.long({ nullable });
          case 'float':
            return cs.refs.system.float({ nullable });
          case 'double':
            return cs.refs.system.double({ nullable });
          case 'decimal':
            return cs.refs.system.decimal({ nullable });
          default:
            return schema.kind === 'integer' ? cs.refs.system.int({ nullable }) : cs.refs.system.double({ nullable });
        }
      case 'string':
        switch (schema.format) {
          case 'date-time':
            return cs.refs.system.dateTimeOffset({ nullable });
          case 'local-date-time':
            return cs.refs.system.dateTime({ nullable });
          case 'date':
            return cs.refs.system.dateOnly({ nullable });
          case 'time':
          case 'local-time':
            return cs.refs.system.timeOnly({ nullable });
          case 'uuid':
            return cs.refs.system.guid({ nullable });
          case 'uri':
            return cs.refs.system.uri({ nullable });
          case 'byte':
            return cs.reference.array(cs.refs.system.byte(), { nullable });
          case 'binary':
            return cs.refs.system.stream({ nullable });
          default:
            return cs.refs.system.string({ nullable });
        }
      case 'null':
        return cs.refs.system.object({ nullable: true });
      case 'array': {
        const itemType = schema.items
          ? this.getType(ctx, { schema: schema.items })
          : cs.refs.systemTextJson.jsonElement({ nullable: true });
        return ctx.config.immutableTypes
          ? cs.refs.system.iReadOnlyList([itemType], { nullable })
          : cs.refs.system.list([itemType], { nullable });
      }
      case 'object':
        if (schema.properties.size === 0 && schema.additionalProperties) {
          const valueType = this.getAdditionalPropertiesType(ctx, { schema });
          return ctx.config.immutableTypes
            ? cs.refs.system.iReadOnlyDictionary([cs.refs.system.string(), valueType], { nullable })
            : cs.refs.system.dictionary([cs.refs.system.string(), valueType], { nullable });
        }
        return cs.refs.systemTextJson.jsonElement({ nullable });
      default:
        return cs.refs.systemTextJson.jsonElement({ nullable });
    }
  }

  protected getGeneratedType(ctx: Context, args: Args.GetGeneratedType): cs.Reference<SourceBuilder> | null {
    const schema = getSchemaReference(args.schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
    if (this.shouldGenerateTypeDeclaration(ctx, { schema })) {
      return cs.reference(this.getDeclarationTypeName(ctx, { schema }), this.getNamespace(ctx, { schema }), {
        nullable: args.nullable ?? schema.nullable,
      });
    }
    return null;
  }

  protected getAdditionalPropertiesType(
    ctx: Context,
    args: Args.GetAdditionalPropertiesType,
  ): cs.Reference<SourceBuilder> {
    const { schema } = args;

    return typeof schema.additionalProperties === 'object'
      ? this.getType(ctx, { schema: schema.additionalProperties })
      : cs.refs.systemTextJson.jsonElement({ nullable: true });
  }

  /**
   * The C# initializer for the default of a schema, or `null` if the schema has no default or its default cannot be
   * written as a C# constant expression (an object, or a formatted string such as a `date-time`).
   */
  protected getDefaultValue(ctx: Context, args: Args.GetDefaultValue): cs.Value<Builder> | null {
    return this.toDefaultValue(ctx, args.schema, args.schema.default);
  }

  /** Writes `value` as a C# constant of the type the schema maps to. */
  private toDefaultValue(ctx: Context, schema: ApiSchema, value: unknown): cs.Value<Builder> | null {
    if (value === null || value === undefined) {
      return null;
    }

    switch (schema.kind) {
      case 'boolean':
        return Boolean(value) || String(value).toLowerCase() === 'true' ? 'true' : 'false';
      case 'integer':
      case 'number': {
        if (this.isDeclarableEnum(schema)) {
          return this.getEnumMemberReference(ctx, schema, value);
        }
        const number = Number(value);
        if (!Number.isFinite(number)) return null;
        switch (schema.format) {
          case 'float':
            return `${number}f`;
          case 'decimal':
            return `${number}m`;
          default:
            return String(number);
        }
      }
      case 'string':
        if (this.isDeclarableEnum(schema)) {
          return this.getEnumMemberReference(ctx, schema, value);
        }
        // Formatted strings map to other types (`Guid`, `DateTimeOffset`, ...) that a string literal cannot initialize.
        return schema.format === undefined || stringLiteralFormats.has(schema.format) ? cs.string(String(value)) : null;
      case 'array': {
        if (!Array.isArray(value) || !schema.items) return null;
        const items = schema.items;
        const values = value.map((x) => this.toDefaultValue(ctx, items, x));
        return values.every(notNullish) ? cs.collectionExpression(values) : null;
      }
      default:
        return null;
    }
  }

  private getEnumMemberReference(ctx: Context, schema: ApiSchema, value: unknown): cs.Call<Builder> {
    return cs.call([
      this.getType(ctx, { schema, nullable: false }),
      this.toEnumValueName(ctx, this.getEnumValues(schema), value),
    ]);
  }
  // #endregion

  // #region Members
  protected getRecordProperty(ctx: Context, args: Args.GetRecordProperty): cs.Property<Builder> {
    const { schema, property, name } = args;

    const isRequired = schema.required.has(property.name);
    const defaultValue = this.getDefaultValue(ctx, { schema: property.schema });
    // A default makes a property optional on the wire: omitting it leaves the default in place.
    const hasDefault = defaultValue !== null;

    return cs.property(name, {
      doc: cs.doc(this.getSchemaDocDescription(ctx, { schema: property.schema })),
      attributes: [
        this.getJsonPropertyNameAttribute(ctx, { schema, property }),
        isRequired || hasDefault ? null : this.getJsonIgnoreAttribute(ctx, { schema, property }),
        ...this.getDataAnnotationAttributes(ctx, { schema, property }),
        property.schema.deprecated ? this.getObsoleteAttribute(ctx, { schema: property.schema }) : null,
      ],
      accessModifier: 'public',
      type: this.getType(ctx, {
        schema: property.schema,
        nullable: isRequired || hasDefault ? undefined : true,
      }),
      accessors: ctx.config.immutableTypes ? ['get', 'init'] : ['get', 'set'],
      required: isRequired && !hasDefault,
      initializer: defaultValue,
    });
  }

  protected getAdditionalPropertiesProperty(
    ctx: Context,
    args: Args.GetAdditionalPropertiesProperty,
  ): cs.Property<Builder> {
    return cs.property(args.name, {
      attributes: [cs.attribute(cs.refs.systemTextJson.jsonExtensionData())],
      accessModifier: 'public',
      // `System.Text.Json` only supports `JsonElement` (or `object`/`JsonNode`) values for extension data, so a typed
      // `additionalProperties` schema cannot be expressed here. It stays an `IDictionary` for the same reason.
      type: cs.refs.system.iDictionary([cs.refs.system.string(), cs.refs.systemTextJson.jsonElement()], {
        nullable: true,
      }),
      accessors: ctx.config.immutableTypes ? ['get', 'init'] : ['get', 'set'],
    });
  }

  /**
   * The C# names of the given properties, index-aligned, followed by the name of the additional properties member,
   * which shares the namespace of the property names.
   */
  protected getPropertyNames(ctx: Context, args: Args.GetPropertyNames): string[] {
    const { schema, properties } = args;
    const typeName = this.getDeclarationTypeName(ctx, { schema }).replace(/^@/, '');
    const used = new Set<string>();
    const unique = (base: string): string => {
      let name = base;
      // A member cannot be named like its enclosing type (CS0542) or like a member the record declares itself.
      if (name.replace(/^@/, '') === typeName || reservedMemberNames.has(name)) name = `${name}Value`;
      for (let i = 2; used.has(name.replace(/^@/, '')); i++) name = `${base}_${i}`;
      used.add(name.replace(/^@/, ''));
      return name;
    };

    return [
      ...properties.map((property) => unique(this.getPropertyName(ctx, { schema, property }))),
      unique(toCSharpPropertyName(toCasing('additionalProperties', ctx.config.propertyNameCasing))),
    ];
  }

  /** The C# name of a property before it is made unique within its record. */
  protected getPropertyName(ctx: Context, args: Args.GetPropertyName): string {
    const name = this.toPropertyName(ctx, args.property.name);
    return name === '' ? toCSharpPropertyName(toIdentifier(args.property.name, 'Property')) : name;
  }
  // #endregion

  // #region Attributes
  protected getJsonPropertyNameAttribute(
    _ctx: Context,
    args: Args.GetJsonPropertyNameAttribute,
  ): cs.Attribute<Builder> {
    return cs.attribute(cs.refs.systemTextJson.jsonPropertyName(), [cs.argument(cs.string(args.property.name))]);
  }

  protected getJsonIgnoreAttribute(_ctx: Context, _args: Args.GetJsonIgnoreAttribute): cs.Attribute<Builder> {
    return cs.attribute(cs.refs.systemTextJson.jsonIgnore(), [], {
      properties: {
        Condition: cs.call([cs.refs.systemTextJson.jsonIgnoreCondition(), 'WhenWritingNull']),
      },
    });
  }

  protected getJsonPolymorphicAttribute(
    _ctx: Context,
    args: Args.GetJsonPolymorphicAttribute,
  ): cs.Attribute<Builder> | null {
    const { schema } = args;

    // The discriminator property is written and read by `System.Text.Json` itself, so none of the records declares it.
    return schema.discriminator
      ? cs.attribute(cs.refs.systemTextJson.jsonPolymorphic(), [], {
          properties: { TypeDiscriminatorPropertyName: cs.string(schema.discriminator.propertyName) },
        })
      : null;
  }

  protected getJsonDerivedTypeAttributes(
    ctx: Context,
    args: Args.GetJsonDerivedTypeAttributes,
  ): cs.Attribute<Builder>[] {
    const { schema } = args;
    if (!schema.discriminator) return [];

    // `System.Text.Json` allows one discriminator value per derived type and only types that are declared.
    const seen = new Set<string>();
    const attributes: cs.Attribute<Builder>[] = [];
    for (const [value, mapped] of Object.entries(schema.discriminator.mapping)) {
      const type = this.getGeneratedType(ctx, { schema: mapped, nullable: false });
      if (!type) continue;
      const key = `${type.namespace}.${type.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      attributes.push(
        cs.attribute(cs.refs.systemTextJson.jsonDerivedType(), [cs.call('typeof', [type]), cs.string(value)]),
      );
    }
    return attributes;
  }

  protected getJsonEnumAttributes(ctx: Context, args: Args.GetJsonEnumAttributes): cs.Attribute<Builder>[] {
    const { schema } = args;
    // An integer enum is written as a number, which is what `System.Text.Json` does without a converter.
    if (schema.kind !== 'string') return [];

    return [
      cs.attribute(cs.refs.systemTextJson.jsonConverter(), [
        cs.call('typeof', [
          cs.refs.systemTextJson.jsonStringEnumConverter([
            cs.reference(this.getDeclarationTypeName(ctx, { schema }), this.getNamespace(ctx, { schema })),
          ]),
        ]),
      ]),
    ];
  }

  protected getObsoleteAttribute(_ctx: Context, _args: Args.GetObsoleteAttribute): cs.Attribute<Builder> {
    return cs.attribute(cs.refs.system.obsolete());
  }

  protected getDataAnnotationAttributes(ctx: Context, args: Args.GetDataAnnotationAttributes): cs.Attribute<Builder>[] {
    const { property } = args;
    const attributes: cs.Attribute<Builder>[] = [];
    if (!ctx.config.addDataAnnotations) {
      return attributes;
    }

    const schema = getSchemaReference(property.schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
    if (this.shouldGenerateTypeDeclaration(ctx, { schema })) {
      // Enums and records have no constraints of their own to validate.
      return attributes;
    }

    if (schema.kind === 'string') {
      const { pattern, minLength, maxLength } = schema;
      if (schema.format === 'email') {
        attributes.push(cs.attribute(cs.refs.dataAnnotations.emailAddress()));
      }
      if (pattern) {
        attributes.push(cs.attribute(cs.refs.dataAnnotations.regularExpression(), [cs.argument(cs.string(pattern))]));
      }
      if (minLength !== undefined && maxLength !== undefined) {
        attributes.push(
          cs.attribute(cs.refs.dataAnnotations.stringLength(), [cs.argument(String(maxLength))], {
            properties: { MinimumLength: String(minLength) },
          }),
        );
      } else if (minLength !== undefined) {
        attributes.push(cs.attribute(cs.refs.dataAnnotations.minLength(), [cs.argument(String(minLength))]));
      } else if (maxLength !== undefined) {
        attributes.push(cs.attribute(cs.refs.dataAnnotations.maxLength(), [cs.argument(String(maxLength))]));
      }
    } else if (schema.kind === 'number' || schema.kind === 'integer') {
      const { minimum, maximum } = schema;
      if (minimum !== undefined || maximum !== undefined) {
        const isInt =
          schema.kind === 'integer' &&
          schema.format !== 'int64' &&
          [minimum, maximum].every((x) => x === undefined || (Number.isInteger(x) && Math.abs(x) <= 2147483647));
        const type = isInt ? 'int' : 'double';
        attributes.push(
          cs.attribute(cs.refs.dataAnnotations.range(), [
            minimum !== undefined ? this.formatRangeBound(minimum, isInt) : `${type}.MinValue`,
            maximum !== undefined ? this.formatRangeBound(maximum, isInt) : `${type}.MaxValue`,
          ]),
        );
      }
    } else if (schema.kind === 'array') {
      if (schema.minItems !== undefined) {
        attributes.push(cs.attribute(cs.refs.dataAnnotations.minLength(), [cs.argument(String(schema.minItems))]));
      }
      if (schema.maxItems !== undefined) {
        attributes.push(cs.attribute(cs.refs.dataAnnotations.maxLength(), [cs.argument(String(schema.maxItems))]));
      }
    }

    return attributes;
  }

  /** A `double` bound is always written with a fraction, so the `Range(double, double)` overload is chosen. */
  private formatRangeBound(value: number, isInt: boolean): string {
    return isInt || !Number.isInteger(value) ? String(value) : `${value}.0`;
  }
  // #endregion

  protected getNamespace(ctx: Context, args: Args.GetNamespace): string {
    const { schema } = args;

    const suffix =
      typeof ctx.config.namespaceSuffix === 'string' ? ctx.config.namespaceSuffix : ctx.config.namespaceSuffix(schema);
    return ctx.config.rootNamespace + suffix;
  }

  /** Whether the schema is an enum that C# can express as an `enum` type. */
  protected isDeclarableEnum(schema: ApiSchema): boolean {
    const values = this.getEnumValues(schema);
    if (values.length === 0) return false;
    if (schema.kind === 'string') return true;
    return schema.kind === 'integer' && values.every((x) => typeof x === 'number' && Number.isSafeInteger(x));
  }

  /** The values of an enum, without the `null` an OpenAPI 3.0 enum uses to mark the schema as nullable. */
  protected getEnumValues(schema: ApiSchema): unknown[] {
    return (schema.enum ?? []).filter((x) => x !== null && x !== undefined);
  }

  protected shouldGenerateTypeDeclaration(ctx: Context, args: Args.ShouldGenerateTypeDeclaration): boolean {
    let { schema } = args;

    // All enum types that C# can express should have its own type declaration
    if (this.isDeclarableEnum(schema)) {
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

    // Too complex types cannot be represented in C#, so they fallback to JsonElement
    if (schema.kind === 'multi-type') {
      return false;
    }
    schema = this.normalizeSchema(ctx, { schema });
    if (schema.kind === 'combined' || schema.kind === 'oneOf') {
      return false;
    }

    // A discriminated schema is the base record its subtypes derive from and the carrier of the
    // `[JsonPolymorphic]`/`[JsonDerivedType]` attributes, so it always needs a declaration of its own. The two rules
    // below simplify a schema that nothing refers to as a type; degrading a polymorphic base to a `JsonElement` or to a
    // dictionary instead drops the base from every subtype and the polymorphism with it. This matters for a base
    // whose `discriminator.propertyName` is declared on the mapping targets rather than on the base, which is
    // legal and leaves the base with no properties of its own.
    const isDiscriminatedBase = schema.kind === 'object' && schema.discriminator !== undefined;

    // Schemas representable by a simple dictionary type do not need its own type declaration
    if (
      !isDiscriminatedBase &&
      schema.kind === 'object' &&
      schema.properties.size === 0 &&
      schema.additionalProperties
    ) {
      return false;
    }

    if (
      !isDiscriminatedBase &&
      schema.kind === 'object' &&
      ctx.config.emptyObjectTypeBehavior === 'use-any' &&
      schema.properties.size === 0
    ) {
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

  /**
   * The name of the type declared for a schema. Names are unique across all declared schemas (ignoring case, as the
   * files are named after them): schemas whose names collapse onto each other once cased (`my_thing`, `my-thing`)
   * get a numeric suffix in declaration order.
   */
  protected getDeclarationTypeName(ctx: Context, args: Args.GetDeclarationTypeName): string {
    return this.getTypeNames(ctx).get(args.schema.id) ?? this.getBaseTypeName(ctx, args.schema);
  }

  /** The name of the type declared for a schema before it is made unique among all declared types. */
  protected getBaseTypeName(ctx: Context, schema: ApiSchema): string {
    return toCSharpPropertyName(
      toCasing(schema.name, ctx.config.typeNameCasing) || toIdentifier(schema.name, 'Schema'),
    );
  }

  private getTypeNames(ctx: Context): Map<string, string> {
    const cached = this.typeNames.get(ctx.data);
    if (cached && cached.config === ctx.config) return cached.names;

    const names = new Map<string, string>();
    const used = new Set<string>();
    // The check below normalizes schemas, which must not leak into the context of the schema being generated.
    const probe = { ...ctx };
    for (const schema of ctx.data.schemas) {
      if (names.has(schema.id) || !this.shouldGenerateTypeDeclaration(probe, { schema })) continue;
      const base = this.getBaseTypeName(ctx, schema);
      let name = base;
      for (let i = 2; used.has(name.replace(/^@/, '').toLowerCase()); i++) name = `${base}_${i}`;
      used.add(name.replace(/^@/, '').toLowerCase());
      names.set(schema.id, name);
    }
    this.typeNames.set(ctx.data, { config: ctx.config, names });
    return names;
  }

  protected getInheritedSchemas(
    ctx: Context,
    args: Args.GetInheritedSchemas,
  ): (ApiSchema & { discriminator: NonNullable<ApiSchema['discriminator']> })[] {
    return args.schema.inheritedSchemas
      .filter((schema) => this.shouldGenerateTypeDeclaration(ctx, { schema }) && !schema.isNameGenerated)
      .filter((item, index, self) => self.indexOf(item) === index);
  }

  /**
   * The schema whose record the record of `schema` derives from. A record has a single base, so a schema that
   * is mapped by several discriminators derives from the first and declares the properties of the others itself.
   */
  protected getBaseSchema(ctx: Context, args: Args.GetBaseSchema): ApiSchema | undefined {
    return this.getInheritedSchemas(ctx, { schema: args.schema })[0];
  }

  protected getRecordProperties(ctx: Context, args: Args.GetRecordProperties): ApiSchemaProperty[] {
    const { schema } = args;

    const baseSchema = this.getBaseSchema(ctx, { schema });
    const discriminatorNames = new Set<string>();
    if (schema.discriminator) discriminatorNames.add(schema.discriminator.propertyName);
    collectDiscriminatorNames(schema.inheritedSchemas, discriminatorNames, new Set());

    const properties = [...schema.properties.values()].filter(
      (property) =>
        // `System.Text.Json` writes the discriminator property itself and fails on a record that declares it too.
        !discriminatorNames.has(property.name) &&
        // A property of the base record is inherited, not declared again.
        !(baseSchema && this.hasProperty(ctx, { schema: baseSchema, propertyName: property.name })),
    );

    return this.sortProperties(ctx, { schema, properties });

    function collectDiscriminatorNames(schemas: ApiSchema[], names: Set<string>, visited: Set<ApiSchema>) {
      for (const inherited of schemas) {
        if (visited.has(inherited)) continue;
        visited.add(inherited);
        if (inherited.discriminator) names.add(inherited.discriminator.propertyName);
        collectDiscriminatorNames(inherited.inheritedSchemas, names, visited);
      }
    }
  }

  protected sortProperties(_ctx: Context, args: Args.SortProperties): ApiSchemaProperty[] {
    return [...args.properties].sort((a, b) => classify(a) - classify(b));

    function classify(p: ApiSchemaProperty) {
      if (p.schema.default !== undefined) return 1;
      if (args.schema.required.has(p.name)) return 0;
      return 2;
    }
  }

  /** Whether the base record already declares a member for additional properties. */
  protected inheritsAdditionalProperties(ctx: Context, baseSchema: ApiSchema): boolean {
    const normalized = this.normalizeSchema(ctx, { schema: baseSchema });
    return (
      normalized.kind === 'object' &&
      normalized.additionalProperties !== undefined &&
      normalized.additionalProperties !== false
    );
  }

  /** Whether a model declared for the schema refers to a model that is marked `[Obsolete]`. */
  protected referencesDeprecatedType(ctx: Context, args: Args.ReferencesDeprecatedType): boolean {
    const { schema } = args;

    const isDeprecatedDeclaration = (candidate: ApiSchema | undefined, visited: Set<ApiSchema>): boolean => {
      if (!candidate || visited.has(candidate)) return false;
      visited.add(candidate);

      const reference = getSchemaReference(candidate, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
      if (this.shouldGenerateTypeDeclaration(ctx, { schema: reference })) return reference.deprecated;
      if (reference.kind === 'array') return isDeprecatedDeclaration(reference.items, visited);
      if (reference.kind === 'object' && typeof reference.additionalProperties === 'object') {
        return isDeprecatedDeclaration(reference.additionalProperties, visited);
      }
      return false;
    };

    return (
      isDeprecatedDeclaration(this.getBaseSchema(ctx, { schema }), new Set()) ||
      [...schema.properties.values()].some((property) => isDeprecatedDeclaration(property.schema, new Set())) ||
      Object.values(schema.discriminator?.mapping ?? {}).some((mapped) => isDeprecatedDeclaration(mapped, new Set()))
    );
  }

  protected normalizeSchema(ctx: Context, args: Args.NormalizeSchema): ApiSchema {
    let { schema } = args;

    schema = this.normalizeDiscriminatedBases(ctx, { schema });
    if (schema.kind === 'oneOf') {
      schema =
        ctx.config.oneOfBehavior === 'treat-as-any-of'
          ? { ...(schema as any), kind: 'combined', anyOf: schema.oneOf, allOf: [], oneOf: undefined }
          : { ...(schema as any), kind: 'combined', allOf: schema.oneOf, anyOf: [], oneOf: undefined };
    }
    if (schema.kind === 'object' || schema.kind === 'combined') {
      const mergedSchema = resolveAnyOfAndAllOf(schema, true);
      if (mergedSchema) {
        schema = mergedSchema;
      }
    }

    return schema;
  }

  /**
   * Rewrites every discriminated `oneOf` base reachable from the schema through a composition into the
   * `object` it describes, so that the merge in `normalizeSchema` treats it as one.
   *
   * A schema that declares a `oneOf` is of kind `oneOf` even when it also declares `type: object` and
   * properties of its own — `determineSchemaKind` looks at `oneOf` first. For a *discriminated* `oneOf` that
   * loses the very information the C# declarations need, because the branches of such a `oneOf` are the
   * schema's subtypes rather than parts of it (the same distinction `resolveAnyOfAndAllOf` draws for a `oneOf`
   * nested inside a composition):
   *
   * - the base is an object in its own right, described by its own `properties`, `required` and any
   *   `allOf`/`anyOf` it composes — so its record must declare those and nothing else, not the union of
   *   what its subtypes declare;
   * - a subtype's `allOf: [Base]` is a composition with that object — so the subtype must inherit the base's
   *   own properties, including the discriminator, while inheriting nothing from its siblings.
   *
   * Both follow from turning the base into an `object` before the merge runs: the merge already collects the
   * properties of an `object` branch and already declines to collect the branches of a discriminated `oneOf`.
   */
  protected normalizeDiscriminatedBases(_ctx: Context, args: Args.NormalizeDiscriminatedBases): ApiSchema {
    // `normalizeSchema` runs once per property type via `shouldGenerateTypeDeclaration`, and almost no schema
    // has a discriminated base anywhere below it. Answering that first costs one traversal and one set, and
    // lets the overwhelmingly common case return the schema itself rather than a copy per composing schema.
    //
    // The question is asked once for the whole call rather than again per branch: a per-branch answer would
    // have to be memoised to stay linear, and memoising it is unsound, because a walk truncated by the cycle
    // guard can record `false` for a branch that reaches a base only by going back through an ancestor.
    if (!containsDiscriminatedBase(args.schema, new Set())) return args.schema;

    const rewritten = new Map<ApiSchema, ApiSchema>();
    return rewrite(args.schema);

    function rewrite(schema: ApiSchema): ApiSchema {
      const existing = rewritten.get(schema);
      if (existing) return existing;

      const isBase = isDiscriminatedBase(schema);
      const allOf = branches(schema, 'allOf');
      const anyOf = branches(schema, 'anyOf');
      // The branches of a discriminated `oneOf` are dropped rather than descended into: they are the schema's
      // subtypes, and a subtype is generated from its own file where it is the root of this walk.
      const oneOf = isBase ? [] : branches(schema, 'oneOf');
      if (!isBase && allOf.length === 0 && anyOf.length === 0 && oneOf.length === 0) {
        return schema;
      }

      // Registered before descending, so a branch composing back to one of its own ancestors terminates.
      const copy: any = { ...schema };
      rewritten.set(schema, copy);
      if (isBase) {
        copy.kind = 'object';
        copy.type = 'object';
      }
      copy.allOf = allOf.map(rewrite);
      copy.anyOf = anyOf.map(rewrite);
      copy.oneOf = oneOf.map(rewrite);
      return copy as ApiSchema;
    }

    /** Whether the schema or anything it composes is a base this walk would rewrite. */
    function containsDiscriminatedBase(schema: ApiSchema, visited: Set<ApiSchema>): boolean {
      if (visited.has(schema)) return false;
      visited.add(schema);
      if (isDiscriminatedBase(schema)) return true;

      const contains = (x: ApiSchema) => containsDiscriminatedBase(x, visited);
      return (
        branches(schema, 'allOf').some(contains) ||
        branches(schema, 'anyOf').some(contains) ||
        branches(schema, 'oneOf').some(contains)
      );
    }

    function isDiscriminatedBase(schema: ApiSchema): boolean {
      return schema.kind === 'oneOf' && schema.discriminator !== undefined;
    }

    /**
     * The branches a schema composes under one keyword. `normalizeSchema` leaves an explicit
     * `oneOf: undefined` behind when it rewrites a `oneOf` holder, so a keyword can be present with no value.
     */
    function branches(schema: ApiSchema, keyword: 'allOf' | 'anyOf' | 'oneOf'): ApiSchema[] {
      const values = schema as unknown as Record<string, ApiSchema[] | undefined>;
      return values[keyword] ?? [];
    }
  }

  protected hasProperty(ctx: Context, args: Args.HasProperty): boolean {
    // A composition branch may compose back to one of its own ancestors (see test/specs/v3/anyof-cycle.yml).
    // Without this guard such a cycle recurses until the stack overflows. Re-visiting a schema can never
    // change the answer, so returning `false` for one is safe: another path either already found the
    // property or does not contain it at all.
    const { schema, propertyName, visited = new Set<ApiSchema>() } = args;
    if (visited.has(schema)) return false;
    visited.add(schema);

    return (
      ('properties' in schema && schema.properties.has(propertyName)) ||
      ('anyOf' in schema && schema.anyOf.some((schema) => this.hasProperty(ctx, { schema, propertyName, visited }))) ||
      ('allOf' in schema && schema.allOf.some((schema) => this.hasProperty(ctx, { schema, propertyName, visited }))) ||
      // Only an undiscriminated `oneOf` composes into the schema that references it, matching which `oneOf`
      // branches `resolveAnyOfAndAllOf` merges. A discriminated one lists subtypes, whose properties are not
      // the referencing schema's, so an inherited property never comes from there.
      ('oneOf' in schema &&
        !schema.discriminator &&
        schema.oneOf.some((schema) => this.hasProperty(ctx, { schema, propertyName, visited })))
    );
  }
}
