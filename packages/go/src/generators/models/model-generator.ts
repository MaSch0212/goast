import {
  type ApiSchema,
  type ApiSchemaProperty,
  type AppendValue,
  type AppendValueGroup,
  appendValueGroup,
  builderTemplate as s,
  DEFAULT_IGNORED_SCHEMA_PROPERTIES,
  getSchemaReference,
  getSourceDisplayName,
  type MaybePromise,
  notNullish,
  resolveAnyOfAndAllOf,
  type SourceBuilder,
} from '@goast/core';

import { go } from '../../ast/index.ts';
import { isGoNilableType } from '../../ast/utils/is-nilable.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import { getSourceDocLine, toGoFileName, toGoStringLiteral } from '../../utils.ts';
import { GoFileGenerator, type GoPackageInfo } from '../file-generator.ts';
import type { DefaultGoModelGeneratorArgs as Args } from './index.ts';
import type { GoModelGeneratorContext, GoModelGeneratorOutput } from './models.ts';

type Context = GoModelGeneratorContext;
type Output = GoModelGeneratorOutput;
type Builder = GoFileBuilder;

/** The name of the field that holds the properties a struct does not declare. */
const additionalPropertiesFieldName = 'AdditionalProperties';

export interface GoModelGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): MaybePromise<TOutput>;
}

export class DefaultGoModelGenerator extends GoFileGenerator<Context, Output> implements GoModelGenerator {
  public generate(ctx: Context): MaybePromise<Output> {
    if (/\/(anyOf|allOf)(\/[0-9]+)?$/.test(ctx.schema.$src.path)) {
      // Do not generate types that are only used for anyOf and/or allOf
      return { type: go.refs.any() };
    }

    const schemaReference = getSchemaReference(ctx.schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
    if (schemaReference !== ctx.schema) {
      return { type: this.getType(ctx, { schema: schemaReference }) };
    }

    if (!this.shouldGenerateTypeDeclaration(ctx, { schema: ctx.schema })) {
      return { type: this.getType(ctx, { schema: ctx.schema }) };
    }

    const pkg = this.getModelsPackage(ctx);
    const typeName = this.getDeclarationTypeName(ctx, { schema: ctx.schema });
    const filePath = `${pkg.dir}/${this.getFileName(ctx, { schema: ctx.schema, typeName })}`;

    console.log(`Generating model ${getSourceDisplayName(ctx.data, ctx.schema)} [${typeName}] to ${filePath}...`);
    const builder = new GoFileBuilder(pkg.name, pkg.importPath, ctx.config);
    builder.append(this.getFileContent(ctx, {}));
    builder.writeToFile(filePath);

    const normalized = this.normalizeSchema(ctx, { schema: ctx.schema });
    const isStruct = normalized.kind === 'object' && !normalized.enum?.length && normalized.properties.size > 0;
    return {
      type: go.reference(typeName, pkg.importPath, { packageName: pkg.name }),
      fields: isStruct
        ? Object.fromEntries(
            this.getStructFields(ctx, { schema: normalized }).map((x) => [
              x.property.name,
              { name: x.fieldName, type: x.type },
            ]),
          )
        : undefined,
    };
  }

  protected getFileContent(ctx: Context, _args: Args.GetFileContent): AppendValueGroup<Builder> {
    const schema = this.normalizeSchema(ctx, { schema: ctx.schema });
    return appendValueGroup<Builder>(this.getSchemaDeclarations(ctx, { schema }), '\n');
  }

  protected getSchemaDeclarations(ctx: Context, args: Args.GetSchemaDeclarations): AppendValue<Builder>[] {
    const { schema } = args;

    if (schema.enum !== undefined && schema.enum.length > 0) {
      return this.getEnum(ctx, { schema });
    } else if (
      schema.kind === 'array' ||
      (schema.kind === 'object' && schema.properties.size === 0 && schema.additionalProperties)
    ) {
      // A collection containing itself, see `isRecursiveCollection`.
      return [
        go.typeDeclaration(
          this.getDeclarationTypeName(ctx, { schema }),
          this.getType(ctx, { schema, declaration: true }),
          { doc: this.getSchemaDoc(ctx, { schema }) },
        ),
      ];
    } else if (schema.kind === 'object') {
      return this.getStruct(ctx, { schema });
    }

    return [
      '// The generator was not able to generate this schema.\n// This should not happen. If you see this comment, please open an Issue on GitHub.\n',
    ];
  }

  // #region Structs
  protected getStruct(ctx: Context, args: Args.GetStruct): AppendValue<Builder>[] {
    const { schema } = args;
    const typeName = this.getDeclarationTypeName(ctx, { schema });
    const fields = this.getStructFields(ctx, { schema });
    const fieldNames = fields.map((x) => x.fieldName);
    const hasAdditionalProperties = this.hasAdditionalProperties(ctx, { schema });

    const declarations: AppendValue<Builder>[] = [
      go.typeDeclaration(
        typeName,
        go.struct([
          ...fields.map(({ property, fieldName }) => this.getStructField(ctx, { schema, property, fieldName })),
          hasAdditionalProperties ? this.getAdditionalPropertiesField(ctx, { schema }) : null,
        ]),
        { doc: this.getSchemaDoc(ctx, { schema }) },
      ),
    ];

    if (hasAdditionalProperties) {
      const pkg = this.getModelsPackage(ctx);
      ctx.packagesWithAdditionalProperties.set(pkg.importPath, pkg);
      declarations.push(...this.getAdditionalPropertiesMethods(ctx, { schema, typeName, fieldNames }));
    }

    return declarations;
  }

  /** The properties of a struct with the names and types of their fields. */
  protected getStructFields(
    ctx: Context,
    args: Args.GetStructFields,
  ): { property: ApiSchemaProperty; fieldName: string; type: go.Type<SourceBuilder> }[] {
    const { schema } = args;
    const properties = [...schema.properties.values()];
    const fieldNames = this.toUniqueNames(
      ctx,
      properties.map((property) => this.toExportedName(ctx, property.name, 'Field')),
      this.hasAdditionalProperties(ctx, { schema }) ? [additionalPropertiesFieldName] : [],
    );
    return properties.map((property, i) => ({
      property,
      fieldName: fieldNames[i],
      type: this.getFieldType(ctx, { schema, property }),
    }));
  }

  /** Whether a struct needs a field for the properties it does not declare. */
  protected hasAdditionalProperties(_ctx: Context, args: Args.HasAdditionalProperties): boolean {
    const { schema } = args;
    return (
      schema.properties.size > 0 && schema.additionalProperties !== undefined && schema.additionalProperties !== false
    );
  }

  protected getStructField(ctx: Context, args: Args.GetStructField): go.Field<Builder> {
    const { property, fieldName } = args;

    return go.field(fieldName, this.getFieldType(ctx, args), {
      doc: go.doc(this.getSchemaDocText(ctx, property.schema, false), { deprecated: property.schema.deprecated }),
      tag: [['json', this.getJsonTag(ctx, args)]],
    });
  }

  /**
   * The type of a field. Fields that may be absent or `null` are pointers, unless their type can be `nil` already
   * (slices, maps, `any`). So is a field whose struct contains the struct declaring the field, which would otherwise
   * be a struct containing itself.
   */
  protected getFieldType(ctx: Context, args: Args.GetFieldType): go.Type<SourceBuilder> {
    const { schema, property } = args;

    const type = this.getType(ctx, { schema: property.schema });
    if (isGoNilableType(type)) return type;

    const optional = !schema.required.has(property.name) || this.isNullable(ctx, { schema: property.schema });
    return optional || this.isRecursiveReference(ctx, { schema: property.schema, target: ctx.schema })
      ? go.pointer(type)
      : type;
  }

  protected getJsonTag(_ctx: Context, args: Args.GetJsonTag): string {
    const { schema, property } = args;
    return schema.required.has(property.name) ? property.name : `${property.name},omitempty`;
  }

  protected getAdditionalPropertiesField(ctx: Context, args: Args.GetAdditionalPropertiesField): go.Field<Builder> {
    return go.field(
      additionalPropertiesFieldName,
      go.map(go.refs.string(), this.getAdditionalPropertiesType(ctx, args)),
      {
        doc: go.doc('AdditionalProperties holds the properties that are not declared by the schema.'),
        tag: [['json', '-']],
      },
    );
  }

  /** `MarshalJSON` and `UnmarshalJSON`, which (de)serialize the additional properties next to the declared ones. */
  protected getAdditionalPropertiesMethods(
    ctx: Context,
    args: Args.GetAdditionalPropertiesMethods,
  ): AppendValue<Builder>[] {
    const { schema, typeName } = args;
    const valueType = this.getAdditionalPropertiesType(ctx, { schema });
    const declared = [...schema.properties.keys()].map((x) => toGoStringLiteral(x)).join(', ');

    return [
      go.function('MarshalJSON', {
        doc: go.doc('MarshalJSON writes the additional properties next to the declared ones.'),
        receiver: go.parameter('v', typeName),
        results: [go.parameter(null, '[]byte'), go.parameter(null, go.refs.error())],
        body: s<Builder>`type plain ${typeName}
          return marshalWithAdditionalProperties(plain(v), v.${additionalPropertiesFieldName})`,
      }),
      go.function('UnmarshalJSON', {
        doc: go.doc('UnmarshalJSON reads the properties that are not declared into AdditionalProperties.'),
        receiver: go.parameter('v', go.pointer(typeName)),
        parameters: [go.parameter('data', '[]byte')],
        results: [go.parameter(null, go.refs.error())],
        body: s<Builder>`type plain ${typeName}
          if err := ${go.reference('Unmarshal', 'encoding/json')}(data, (*plain)(v)); err != nil {
          \treturn err
          }
          additional, err := unmarshalAdditionalProperties[${valueType}](data, ${declared})
          if err != nil {
          \treturn err
          }
          v.${additionalPropertiesFieldName} = additional
          return nil`,
      }),
    ];
  }
  // #endregion

  // #region Enums
  protected getEnum(ctx: Context, args: Args.GetEnum): AppendValue<Builder>[] {
    const { schema } = args;
    const typeName = this.getDeclarationTypeName(ctx, { schema });
    const doc = this.getSchemaDoc(ctx, { schema });
    const underlyingType = this.getEnumUnderlyingType(ctx, { schema });
    if (underlyingType === null) {
      // The values have different types, which no Go type besides `any` can hold.
      return [go.typeDeclaration(typeName, go.refs.any(), { doc, alias: true })];
    }

    const literals = new Set<string>();
    const values = (schema.enum ?? []).filter((value) => {
      if (value === null) return false;
      // Two values with the same literal (e.g. `1` and `'1'` of a string enum) would be the same constant.
      const literal = this.getEnumValueLiteral(ctx, { schema, value });
      if (literals.has(literal)) return false;
      literals.add(literal);
      return true;
    });
    const valueNames = this.getEnumValueNames(ctx, { schema, typeName, values });

    return [
      go.typeDeclaration(typeName, underlyingType, { doc }),
      values.length > 0
        ? go.const(
            values.map((value, i) =>
              go.constSpec(valueNames[i], this.getEnumValueLiteral(ctx, { schema, value }), {
                type: typeName,
              }),
            ),
          )
        : null,
      ctx.config.addEnumValidation ? this.getEnumValidationMethod(ctx, { schema, typeName, valueNames }) : null,
    ].filter(notNullish);
  }

  /** The Go type underlying an enum type, or `null` if no Go type besides `any` can hold all values. */
  protected getEnumUnderlyingType(_ctx: Context, args: Args.GetEnumUnderlyingType): go.Type<Builder> | null {
    const { schema } = args;
    const values = (schema.enum ?? []).filter((x) => x !== null);

    let kind: string = schema.kind;
    if (kind !== 'string' && kind !== 'integer' && kind !== 'number' && kind !== 'boolean') {
      if (values.every((x) => typeof x === 'string')) kind = 'string';
      else if (values.every((x) => typeof x === 'number' && Number.isInteger(x))) kind = 'integer';
      else if (values.every((x) => typeof x === 'number')) kind = 'number';
      else if (values.every((x) => typeof x === 'boolean')) kind = 'boolean';
      else return null;
    }

    switch (kind) {
      case 'string':
        return go.refs.string();
      case 'integer':
        return values.every((x) => typeof x === 'number' && Number.isInteger(x)) ? go.refs.int() : null;
      case 'number':
        return values.every((x) => typeof x === 'number' && Number.isFinite(x)) ? go.refs.float64() : null;
      default:
        return values.every((x) => typeof x === 'boolean') ? go.refs.bool() : null;
    }
  }

  protected getEnumValueLiteral(ctx: Context, args: Args.GetEnumValueLiteral): string {
    const { schema, value } = args;
    const underlyingType = this.getEnumUnderlyingType(ctx, { schema });
    return go.refs.string.matches(underlyingType) ? toGoStringLiteral(String(value)) : String(value);
  }

  /**
   * The names of the enum constants: the type name followed by the value (`StatusActive`). Values that do not start
   * with a letter keep their digits (`Code200`), and every name is unique within the package.
   */
  protected getEnumValueNames(ctx: Context, args: Args.GetEnumValueNames): string[] {
    const { typeName, values } = args;
    const registry = this.getIdentifierRegistry(ctx, this.getModelsPackage(ctx));

    return values.map((value) => {
      const raw = String(value);
      const sanitized = raw.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      let suffix: string;
      if (/^[A-Za-z]/.test(sanitized)) {
        suffix = this.toExportedName(ctx, raw);
      } else if (sanitized.length > 0) {
        suffix = (/^\s*-/.test(raw) ? 'Minus' : '') + sanitized;
      } else {
        suffix = raw.length === 0 ? 'Empty' : 'Value';
      }
      return registry.reserve(`${typeName}${suffix}`);
    });
  }

  protected getEnumValidationMethod(_ctx: Context, args: Args.GetEnumValidationMethod): go.Function<Builder> {
    const { typeName, valueNames } = args;

    return go.function('IsValid', {
      doc: go.doc(`IsValid reports whether the value is one of the values of ${typeName}.`),
      receiver: go.parameter('v', typeName),
      results: [go.parameter(null, go.refs.bool())],
      body:
        valueNames.length === 0
          ? 'return false'
          : s<Builder>`switch v {
              case ${valueNames.join(', ')}:
              \treturn true
              default:
              \treturn false
              }`,
    });
  }
  // #endregion

  // #region Types
  protected getType(ctx: Context, args: Args.GetType): go.Type<SourceBuilder> {
    let { schema } = args;

    if (schema.kind === 'oneOf' && schema.oneOf.length === 2 && schema.oneOf.some((x) => x.kind === 'null')) {
      schema = schema.oneOf.find((x) => x.kind !== 'null') ?? schema;
    }

    const generatedType = args.declaration ? null : this.getGeneratedType(ctx, { schema });
    if (generatedType) {
      return generatedType;
    }

    switch (schema.kind) {
      case 'boolean':
        return go.refs.bool();
      case 'integer':
      case 'number':
        switch (schema.format) {
          case 'int32':
            return go.refs.int32();
          case 'int64':
            return go.refs.int64();
          case 'float':
            return go.refs.float32();
          case 'double':
            return go.refs.float64();
          default:
            return schema.kind === 'integer' ? go.refs.int() : go.refs.float64();
        }
      case 'string':
        switch (schema.format) {
          case 'date-time':
            return go.refs.time.time();
          case 'byte':
          case 'binary':
            return go.slice(go.refs.byte());
          default:
            return go.refs.string();
        }
      case 'array':
        return go.slice(schema.items ? this.getType(ctx, { schema: schema.items }) : go.refs.any());
      case 'object':
        return schema.properties.size === 0 && schema.additionalProperties
          ? go.map(go.refs.string(), this.getAdditionalPropertiesType(ctx, { schema }))
          : go.refs.any();
      default:
        return go.refs.any();
    }
  }

  protected getGeneratedType(ctx: Context, args: Args.GetGeneratedType): go.Reference<SourceBuilder> | null {
    const schema = getSchemaReference(args.schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
    if (this.shouldGenerateTypeDeclaration(ctx, { schema })) {
      const pkg = this.getModelsPackage(ctx);
      return go.reference(this.getDeclarationTypeName(ctx, { schema }), pkg.importPath, { packageName: pkg.name });
    }
    return null;
  }

  protected getAdditionalPropertiesType(ctx: Context, args: Args.GetAdditionalPropertiesType): go.Type<SourceBuilder> {
    const { schema } = args;
    return typeof schema.additionalProperties === 'object'
      ? this.getType(ctx, { schema: schema.additionalProperties })
      : go.refs.any();
  }
  // #endregion

  protected getSchemaDoc(ctx: Context, args: Args.GetSchemaDoc): go.Doc<Builder> {
    const { schema } = args;
    return go.doc(this.getSchemaDocText(ctx, schema, ctx.config.includeSourceInDocs), {
      deprecated: schema.deprecated,
    });
  }

  private getSchemaDocText(_ctx: Context, schema: ApiSchema, includeSource: boolean): string {
    return [schema.description?.trim(), includeSource ? getSourceDocLine(schema) : null]
      .filter((x): x is string => !!x)
      .join('\n\n');
  }

  protected getModelsPackage(ctx: Context): GoPackageInfo {
    return this.getPackageInfo(ctx, ctx.config.packagePath, ctx.config.packageName);
  }

  protected getDeclarationTypeName(ctx: Context, args: Args.GetDeclarationTypeName): string {
    const { schema } = args;
    return this.getIdentifierRegistry(ctx, this.getModelsPackage(ctx)).reserve(
      this.toExportedName(ctx, schema.name, 'Model'),
      `schema:${schema.id}`,
    );
  }

  protected getFileName(ctx: Context, args: Args.GetFileName): string {
    const pkg = this.getModelsPackage(ctx);
    const files = this.getIdentifierRegistry(ctx, { ...pkg, importPath: `${pkg.importPath}\u0000files` });
    const stem = toGoFileName(args.typeName).replace(/\.go$/, '');
    return `${files.reserve(stem, `schema:${args.schema.id}`)}.go`;
  }

  protected isNullable(_ctx: Context, args: Args.IsNullable): boolean {
    const { schema } = args;
    return (
      schema.nullable ||
      (schema.kind === 'oneOf' && schema.oneOf.some((x) => x.kind === 'null')) ||
      (schema.kind === 'multi-type' && schema.type.includes('null'))
    );
  }

  /**
   * Whether a value of `schema` can contain a value of `target` without a pointer or slice in between: through its
   * properties, or the schemas it composes. Such a field has to be a pointer, because a struct cannot contain itself.
   * This errs on the side of a pointer: it does not ask whether the properties on the way are pointers themselves.
   */
  protected isRecursiveReference(_ctx: Context, args: Args.IsRecursiveReference): boolean {
    const visited = new Set<string>();
    const reaches = (schema: ApiSchema): boolean => {
      schema = getSchemaReference(schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
      if (schema.id === args.target.id) return true;
      if (visited.has(schema.id)) return false;
      visited.add(schema.id);

      const branches = [
        ...('properties' in schema && schema.properties ? [...schema.properties.values()].map((x) => x.schema) : []),
        ...('allOf' in schema ? (schema.allOf ?? []) : []),
        ...('anyOf' in schema ? (schema.anyOf ?? []) : []),
        ...('oneOf' in schema ? (schema.oneOf ?? []) : []),
      ];
      return branches.some(reaches);
    };
    return reaches(args.schema);
  }

  /**
   * Whether the schema is an array or map that contains itself through its items or values, without a declared type
   * in between (e.g. `type Tree map[string]Tree`). Such a schema needs a declaration of its own, which other
   * collections do not.
   *
   * Walking stops at every schema that is declared anyway (objects with properties, enums and compositions), so this
   * never asks `shouldGenerateTypeDeclaration`, which asks this.
   */
  protected isRecursiveCollection(_ctx: Context, args: Args.IsRecursiveCollection): boolean {
    const start = getSchemaReference(args.schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
    const visited = new Set<string>();
    const next = (schema: ApiSchema): ApiSchema | undefined => {
      if (schema.enum !== undefined && schema.enum.length > 0) return undefined;
      if (schema.kind === 'array') return schema.items;
      if (schema.kind === 'object' && schema.properties.size === 0 && typeof schema.additionalProperties === 'object') {
        return schema.additionalProperties;
      }
      return undefined;
    };

    let current = next(start);
    while (current) {
      current = getSchemaReference(current, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
      if (current.id === start.id) return true;
      if (visited.has(current.id)) return false;
      visited.add(current.id);
      current = next(current);
    }
    return false;
  }

  protected shouldGenerateTypeDeclaration(ctx: Context, args: Args.ShouldGenerateTypeDeclaration): boolean {
    let { schema } = args;

    // All enum types should have their own type declaration
    if (schema.enum !== undefined && schema.enum.length > 0) {
      return true;
    }

    // A collection containing itself needs a name to refer to itself by
    if (this.isRecursiveCollection(ctx, { schema })) {
      return ctx.data.schemas.some((x) => x.id === schema.id);
    }

    // Primitive types already exist and do not need their own type declaration
    if (schema.kind !== 'combined' && schema.kind !== 'object' && schema.kind !== 'oneOf') {
      return false;
    }

    schema = this.normalizeSchema(ctx, { schema });
    if (schema.kind !== 'object') {
      return false;
    }

    // Schemas representable by a map do not need their own type declaration
    if (schema.properties.size === 0 && schema.additionalProperties) {
      return false;
    }

    if (ctx.config.emptyObjectTypeBehavior === 'use-any' && schema.properties.size === 0) {
      return false;
    }

    // Dynamically generated schemas do not have their own type declaration
    if (!ctx.data.schemas.some((x) => x.id === schema.id)) {
      return false;
    }

    // The servers generator declares a type of its own for a multipart body
    if (schema.$src.path.endsWith('/requestBody/content/multipart/form-data/schema')) {
      return false;
    }

    return true;
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
   * Rewrites every discriminated `oneOf` base reachable from the schema through a composition into the `object` it
   * describes. The branches of such a `oneOf` are the subtypes of the base, not parts of it: the base's struct holds
   * its own properties, and a subtype that composes the base (`allOf: [Base]`) gets those, but none of its siblings'.
   * See `DefaultKotlinModelGenerator.normalizeDiscriminatedBases` for the full reasoning.
   */
  protected normalizeDiscriminatedBases(_ctx: Context, args: Args.NormalizeDiscriminatedBases): ApiSchema {
    if (!containsDiscriminatedBase(args.schema, new Set())) return args.schema;

    const rewritten = new Map<ApiSchema, ApiSchema>();
    return rewrite(args.schema);

    function rewrite(schema: ApiSchema): ApiSchema {
      const existing = rewritten.get(schema);
      if (existing) return existing;

      const isBase = isDiscriminatedBase(schema);
      const allOf = branches(schema, 'allOf');
      const anyOf = branches(schema, 'anyOf');
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
        copy.properties ??= new Map<string, ApiSchemaProperty>();
      }
      copy.allOf = allOf.map(rewrite);
      copy.anyOf = anyOf.map(rewrite);
      copy.oneOf = oneOf.map(rewrite);
      return copy as ApiSchema;
    }

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

    function branches(schema: ApiSchema, keyword: 'allOf' | 'anyOf' | 'oneOf'): ApiSchema[] {
      const values = schema as unknown as Record<string, ApiSchema[] | undefined>;
      return values[keyword] ?? [];
    }
  }
}
