import { resolve } from 'node:path';

import {
  type ApiSchema,
  type AppendValue,
  type AppendValueGroup,
  appendValueGroup,
  type ArrayLikeApiSchema,
  type BasicAppendValue,
  type CombinedLikeApiSchema,
  DEFAULT_IGNORED_SCHEMA_PROPERTIES,
  getSchemaReference,
  getSourceDisplayName,
  type MaybePromise,
  notNullish,
  type Nullable,
  type ObjectLikeApiSchema,
  resolveAnyOfAndAllOf,
  type StringLikeApiSchema,
  toCasing,
} from '@goast/core';

import { ts } from '../../ast/index.ts';
import type { TypeScriptComponentOutputKind } from '../../common-results.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { getSourceDocLine } from '../../utils.ts';
import { TypeScriptFileGenerator } from '../file-generator.ts';
import type { TypeScriptModelGeneratorContext, TypeScriptModelGeneratorOutput } from './models.ts';

type Context = TypeScriptModelGeneratorContext;
type Output = TypeScriptModelGeneratorOutput;
type Builder = TypeScriptFileBuilder;

export interface TypeScriptModelGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): MaybePromise<TOutput>;
}

export class DefaultTypeScriptModelGenerator extends TypeScriptFileGenerator<Context, Output>
  implements TypeScriptModelGenerator {
  public generate(ctx: Context): MaybePromise<Output> {
    if (this.shouldGenerateTypeDeclaration(ctx, ctx.schema)) {
      const name = this.getDeclarationTypeName(ctx, ctx.schema);
      const filePath = this.getFilePath(ctx, ctx.schema);

      const fileContent = this.getFileContent(ctx);
      TypeScriptFileBuilder.generate({
        logName: `model ${getSourceDisplayName(ctx.data, ctx.schema)} [${name}]`,
        filePath,
        options: ctx.config,
        generator: (b) => b.append(fileContent),
      });

      const exports = fileContent.values.filter(
        (x): x is AppendValue<Builder> & { name: string; export: true } =>
          typeof x === 'object' && x !== null && 'export' in x && x.export === true && 'name' in x,
      );
      const node = exports.find((x) => x.name === name);
      return {
        component: name,
        filePath,
        imports: [
          {
            kind: 'file',
            name,
            modulePath: filePath,
            type: node instanceof ts.Interface || node instanceof ts.TypeAlias ? 'type-import' : 'import',
          },
        ],
        additionalExports: exports
          .filter((x) => x.name !== name)
          .map(
            (x) => ({
              name: x.name,
              type: x instanceof ts.TypeAlias || x instanceof ts.Interface ? 'type-export' : 'export',
            } as const),
          ),
        kind: this.getNodeKind(node),
      };
    } else {
      const builder = new TypeScriptFileBuilder(undefined, ctx.config);
      builder.append(this.getType(ctx, ctx.schema));
      const imports = builder.imports.imports;
      builder.imports.clear();
      return { component: builder.toString(false), imports };
    }
  }

  protected getNodeKind(node: unknown): TypeScriptComponentOutputKind | undefined {
    if (node instanceof ts.Interface) return 'interface';
    if (node instanceof ts.TypeAlias) return 'type';
    if (node instanceof ts.Enum) return 'enum';
    if (node instanceof ts.Class) return 'class';
    return undefined;
  }

  protected getFileContent(ctx: Context): AppendValueGroup<Builder> {
    const content = appendValueGroup<Builder>([], '\n');
    const interfaceSchema = this.resolveInterfaceSchema(ctx);
    if (interfaceSchema) {
      content.values.push(this.getInterface(ctx, interfaceSchema));
    } else if (
      ctx.config.enumGeneration !== 'union' &&
      ctx.schema.kind === 'string' &&
      ctx.schema.enum !== undefined &&
      ctx.schema.enum.length > 0
    ) {
      content.values.push(this.getEnum(ctx));
    } else if (ctx.schema.discriminator && Object.keys(ctx.schema.discriminator.mapping).length > 0) {
      content.values.push(
        ts.typeAlias(
          this.getDiscriminatorTypeName(ctx, ctx.schema),
          ts.unionType(Object.keys(ctx.schema.discriminator.mapping).map((x) => ts.string(x))),
        ),
        ts.typeAlias(
          this.getBaseTypeName(ctx, ctx.schema),
          this.getType(ctx, ctx.schema, { skipSchemas: true }) ?? this.getAnyType(ctx),
          { export: true },
        ),
        this.getTypeAlias(ctx, ctx.schema),
      );
    } else {
      content.values.push(this.getTypeAlias(ctx, ctx.schema));
      if (ctx.schema.enum) {
        content.values.push(this.getEnumValuesVariable(ctx, ctx.schema));
      }
    }
    return content;
  }

  protected getEnum(ctx: Context): ts.Enum<Builder> {
    return ts.enum(this.getDeclarationTypeName(ctx, ctx.schema), {
      doc: ts.doc({
        description: this.getSchemaDocDescription(ctx, ctx.schema),
        tags: [ctx.schema.deprecated ? ts.docTag('deprecated') : null],
      }),
      export: true,
      members: (ctx.schema.enum?.map((x) => String(x)) ?? []).map((x) =>
        ts.enumValue(toCasing(x, ctx.config.enumValueNameCasing), { value: ts.string(x) })
      ),
    });
  }

  protected getInterface(ctx: Context, schema: ObjectLikeApiSchema): ts.Interface<Builder> {
    return ts.interface(this.getDeclarationTypeName(ctx, ctx.schema), {
      export: true,
      doc: ts.doc({
        description: this.getSchemaDocDescription(ctx, schema as ApiSchema),
        tags: [ctx.schema.deprecated ? ts.docTag('deprecated') : null],
      }),
      members: [...this.getProperties(ctx, schema), this.getIndexer(ctx, schema)],
    });
  }

  protected getTypeAlias(ctx: Context, schema: ApiSchema): ts.TypeAlias<Builder> {
    const hasDiscriminator = schema.discriminator && Object.keys(schema.discriminator.mapping).length > 0;
    const result = ts.typeAlias<Builder>(
      this.getDeclarationTypeName(ctx, schema),
      (hasDiscriminator ? this.getDiscriminatorType(ctx, schema) : this.getType(ctx, schema, { skipSchemas: true })) ??
        this.getAnyType(ctx),
      {
        export: true,
        doc: ts.doc({
          description: this.getSchemaDocDescription(ctx, schema),
          tags: [ctx.schema.deprecated ? ts.docTag('deprecated') : null],
        }),
      },
    );

    if (hasDiscriminator) {
      const propertyValue = this.getDiscriminatorTypeName(ctx, ctx.schema);
      result.generics.push(
        ts.genericParameter(this.getDiscriminatorGenericParamName(ctx, schema), {
          constraint: propertyValue,
          default: propertyValue,
        }),
      );
    }

    const inheritedSchemas = this.getInheritedSchemas(ctx, schema);
    if (inheritedSchemas.length > 0) {
      const fixedProperties = inheritedSchemas.reduce((p, c) => {
        const mappingValues = Object.entries(c.discriminator.mapping)
          .filter(([_, value]) => value.id === schema.id)
          .map(([key]) => ts.string(key));
        if (c.discriminator.propertyName in p) {
          p[c.discriminator.propertyName].types.push(...mappingValues);
        } else {
          p[c.discriminator.propertyName] = ts.unionType(mappingValues);
        }
        return p;
      }, {} as Record<string, ts.UnionType<Builder>>);
      result.type = ts.intersectionType([
        ts.refs.omit([result.type, ts.unionType(Object.keys(fixedProperties).map((x) => ts.string(x)))]),
        ts.objectType({
          members: Object.entries(fixedProperties).map(([key, value]) =>
            ts.property(key, { type: value, readonly: ctx.config.immutableTypes })
          ),
        }),
      ]);
    }

    return result;
  }

  protected getEnumValuesVariable(ctx: Context, schema: ApiSchema): ts.Variable<Builder> {
    const enumTypeName = this.getDeclarationTypeName(ctx, schema);
    const values = schema.enum?.map((x) => ts.toNode(x)) ?? [];
    return ts.variable(toCasing(`${enumTypeName}-Values`, ctx.config.constantNameCasing), {
      doc: ts.doc({
        description: `All possible values of the enum \`${enumTypeName}\`.`,
      }),
      export: true,
      readonly: true,
      value: ts.tuple(values, { asConst: true }),
    });
  }

  protected getIndexer(ctx: Context, schema: ObjectLikeApiSchema): ts.Indexer<Builder> | null {
    return schema.additionalProperties
      ? ts.indexer(
        ts.refs.string(),
        (schema.additionalProperties === true ? null : this.getMemberType(ctx, schema.additionalProperties)) ??
          this.getAnyType(ctx),
        { readonly: ctx.config.immutableTypes },
      )
      : null;
  }

  protected getProperties(ctx: Context, schema: ObjectLikeApiSchema): ts.Property<Builder>[] {
    return Array.from(schema.properties.values()).map((property) => {
      return ts.property(property.name, {
        doc: ts.doc({
          description: this.getSchemaDocDescription(ctx, property.schema),
          tags: [property.schema.deprecated ? ts.docTag('deprecated') : null],
        }),
        readonly: ctx.config.immutableTypes,
        optional: !schema.required.has(property.name),
        type: ts.unionType([this.getType(ctx, property.schema), property.schema.nullable ? 'null' : null]),
      });
    });
  }

  /**
   * The type of a schema used as a *member* of an enclosing type - a composition branch, an array element, an
   * `additionalProperties` value - with the schema's own nullability applied.
   *
   * `getType` renders a schema's type without its `null` on purpose: the two contexts that render a schema's type
   * as a whole declare nullability themselves. A property has it added by `getProperties`, and a top-level type
   * alias deliberately does not hoist it, because that would change what every declared type means for consumers.
   * A member position has neither - nothing downstream can add the `null` back - so unless it is admitted here the
   * emitted type cannot represent a value the spec explicitly permits.
   */
  protected getMemberType(
    ctx: Context,
    schema: Nullable<ApiSchema>,
    options?: { skipSchemas?: boolean; useBaseType?: boolean },
  ): ts.Type<Builder> | null {
    const type = this.getType(ctx, schema, options);
    return type !== null && schema && this.isNullableMember(schema) ? ts.unionType([type, 'null']) : type;
  }

  /**
   * Whether a schema needs a `null` added to the type `getType` renders for it. A schema that only ever renders as
   * `null` (the null type itself) already admits it, and adding a second one would emit `(null) | (null)`.
   *
   * Nullability is read through the reference chain the same way `getType` reads the type, so a `$ref` to a
   * declared nullable schema - whose own declaration does not hoist the `null` - still admits null where it is used.
   */
  protected isNullableMember(schema: ApiSchema): boolean {
    const resolved = getSchemaReference(schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
    if (resolved.kind === 'null') return false;
    return schema.nullable === true || resolved.nullable === true;
  }

  protected getType(
    ctx: Context,
    schema: Nullable<ApiSchema>,
    options?: { skipSchemas?: boolean; useBaseType?: boolean },
  ): ts.Type<Builder> | null {
    if (!schema) return this.getAnyType(ctx);

    schema = getSchemaReference(schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES);

    if (options?.useBaseType && ctx.schema.inheritedSchemas.some((x) => x.id === schema.id)) {
      return ts.reference(this.getBaseTypeName(ctx, schema), this.getFilePath(ctx, schema), {
        importType: 'type-import',
      });
    }

    if (!options?.skipSchemas && this.shouldGenerateTypeDeclaration(ctx, schema)) {
      if (schema.id === ctx.schema.id) {
        return null;
      }
      return ts.reference(this.getDeclarationTypeName(ctx, schema), this.getFilePath(ctx, schema), {
        importType: 'type-import',
      });
    }

    if (schema.enum) {
      return ts.unionType(schema.enum.map((x) => ts.toNode(x)));
    }

    switch (schema.kind) {
      case 'boolean':
        return 'boolean';
      case 'integer':
      case 'number':
        return 'number';
      case 'string':
        return this.getStringType(ctx, schema);
      case 'null':
        return 'null';
      case 'unknown':
        return this.getAnyType(ctx);
      case 'array':
        return this.getArrayType(ctx, schema);
      case 'object':
        return this.getObjectType(ctx, schema);
      case 'combined':
        return this.getCombinedType(ctx, schema);
      case 'multi-type':
        return this.getMultiType(ctx, schema);
      case 'oneOf':
        return this.getOneOfType(ctx, schema);
      default:
        return this.getAnyType(ctx);
    }
  }

  protected getStringType(ctx: Context, schema: StringLikeApiSchema): ts.Type<Builder> {
    if (schema.format === 'binary') {
      return ctx.config.binarySchemaType();
    }
    return 'string';
  }

  protected getArrayType(ctx: Context, schema: ArrayLikeApiSchema): ts.Type<Builder> {
    return ts.arrayType(this.getMemberType(ctx, schema.items) ?? this.getAnyType(ctx), {
      readonly: ctx.config.immutableTypes,
    });
  }

  protected getObjectType(ctx: Context, schema: ObjectLikeApiSchema): ts.Type<Builder> {
    const parts = [
      schema.properties.size > 0 ? ts.objectType({ members: this.getProperties(ctx, schema) }) : null,
      schema.additionalProperties ? ts.objectType({ members: [this.getIndexer(ctx, schema)] }) : null,
      schema.allOf.length > 0 || schema.anyOf.length > 0 ? this.getCombinedType(ctx, schema) : null,
    ].filter(notNullish);
    if (parts.length === 0) {
      parts.push(
        ts.objectType({
          members: [ts.indexer(ts.refs.string(), ts.refs.never(), { readonly: ctx.config.immutableTypes })],
        }),
      );
    }
    return ts.intersectionType(parts);
  }

  protected getDiscriminatorType(ctx: Context, schema: ApiSchema): ts.Type<Builder> {
    if (schema.discriminator && Object.keys(schema.discriminator.mapping).length > 0) {
      const discriminator = schema.discriminator;
      return ts.intersectionType([
        this.getBaseTypeName(ctx, schema as ApiSchema),
        ts.lookupType(
          ts.objectType({
            members: Object.entries(discriminator.mapping).map(([key, value]) =>
              ts.property(key, {
                type: ts.intersectionType([
                  ts.objectType({
                    members: [
                      ts.property(discriminator.propertyName, {
                        type: ts.string(key),
                        readonly: ctx.config.immutableTypes,
                      }),
                    ],
                  }),
                  this.getType(ctx, value),
                ]),
              })
            ),
          }),
          this.getDiscriminatorGenericParamName(ctx, schema as ApiSchema),
        ),
      ]);
    } else {
      return ts.refs.unknown();
    }
  }

  protected getCombinedType(ctx: Context, schema: CombinedLikeApiSchema): ts.Type<Builder> {
    if (schema.allOf.length === 0 && schema.anyOf.length === 0) {
      return this.getAnyType(ctx);
    }
    const useBaseType = schema.id === ctx.schema.id;
    // allOf branches must all hold at once, i.e. an intersection. anyOf branches only require at least one to hold,
    // i.e. a union - TypeScript unions already admit values matching several branches, so no Partial<> wrapper is
    // needed to express that overlap. A schema with both intersects the allOf branches with the anyOf union.
    return ts.intersectionType([
      ...schema.allOf.map((x) => this.getMemberType(ctx, x, { useBaseType })),
      schema.anyOf.length > 0
        ? ts.unionType(schema.anyOf.map((x) => this.getMemberType(ctx, x, { useBaseType })))
        : null,
    ]);
  }

  protected getOneOfType(ctx: Context, schema: ApiSchema<'oneOf'>): ts.Type<Builder> {
    if (schema.oneOf.length === 0) {
      return this.getAnyType(ctx);
    }
    return ts.unionType(schema.oneOf.map((x) => this.getMemberType(ctx, x)));
  }

  protected getMultiType(ctx: Context, schema: ApiSchema<'multi-type'>): ts.Type<Builder> {
    if (schema.type.length === 0) {
      return this.getAnyType(ctx);
    }
    return ts.unionType(
      schema.type.map((x) => {
        switch (x) {
          case 'string':
            return this.getStringType(ctx, schema);
          case 'number':
          case 'integer':
            return 'number';
          case 'boolean':
            return 'boolean';
          case 'null':
            return 'null';
          case 'array':
            return this.getArrayType(ctx, schema);
          case 'object':
            return this.getObjectType(ctx, schema);
          default:
            return 'never';
        }
      }),
    );
  }

  protected getSchemaDocDescription(ctx: Context, schema: ApiSchema): BasicAppendValue<Builder> {
    const docSegments = [schema.description?.trim()];

    if (ctx.config.includeSourceInDocs) {
      docSegments.push(getSourceDocLine(schema));
    }

    return docSegments.filter(notNullish).join('\n\n');
  }

  protected shouldGenerateTypeDeclaration(ctx: Context, schema: ApiSchema): boolean {
    // All named schemas should have its own type declaration
    if (!schema.isNameGenerated) {
      return true;
    }

    // All enum types should have its own type declaration
    if (schema.enum !== undefined && schema.enum.length > 0) {
      return true;
    }

    // All primitive types already exist and do not need its own type declaration
    if (
      schema.kind !== 'array' &&
      schema.kind !== 'combined' &&
      schema.kind !== 'multi-type' &&
      schema.kind !== 'object' &&
      schema.kind !== 'oneOf'
    ) {
      return false;
    }

    // Nullable by oneOf schemas do not need their own type declaration
    if (schema.kind === 'oneOf' && schema.oneOf?.length === 2 && schema.oneOf.some((x) => x.kind === 'null')) {
      return false;
    }

    // Dynamically generated schemas do not have its own type declaration
    if (!ctx.data.schemas.some((x) => x.id === schema.id)) {
      return false;
    }

    // Check if "real" schema
    if (getSchemaReference(ctx.schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES) !== ctx.schema) {
      return false;
    }

    // For all other types, check if the user has enabled inline unnamed schemas
    return !ctx.config.inlineUnnamedSchemas;
  }

  protected resolveInterfaceSchema(ctx: Context): ApiSchema<'object'> | undefined {
    if (
      ctx.config.typeDeclaration === 'prefer-interface' &&
      (ctx.schema.kind === 'object' || ctx.schema.kind === 'combined')
    ) {
      return resolveAnyOfAndAllOf(ctx.schema, true);
    }
    return undefined;
  }

  protected getDeclarationTypeName(ctx: Context, schema: ApiSchema): string {
    return toCasing(schema.name, ctx.config.typeNameCasing);
  }

  protected getDiscriminatorGenericParamName(ctx: Context, schema: ApiSchema): string {
    return toCasing(schema.discriminator?.propertyName, ctx.config.genericParamNameCasing);
  }

  protected getDiscriminatorTypeName(ctx: Context, schema: ApiSchema): string {
    return toCasing(schema.name + '_Discriminator', ctx.config.typeNameCasing);
  }

  protected getBaseTypeName(ctx: Context, schema: ApiSchema): string {
    return toCasing(schema.name, ctx.config.discriminatorBaseTypeCasing);
  }

  protected getInheritedSchemas(ctx: Context, schema: ApiSchema): ApiSchema['inheritedSchemas'] {
    return schema.inheritedSchemas
      .filter((schema) => this.shouldGenerateTypeDeclaration(ctx, schema) && !schema.isNameGenerated)
      .filter((item, index, self) => self.indexOf(item) === index);
  }

  protected getFilePath(ctx: Context, schema: ApiSchema): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.modelsDir,
      `${toCasing(schema.name, ctx.config.modelFileNameCasing ?? ctx.config.fileNameCasing)}.ts`,
    );
  }
}
