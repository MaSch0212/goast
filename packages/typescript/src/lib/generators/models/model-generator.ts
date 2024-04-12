import { dirname, resolve } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import {
  ApiSchema,
  ArrayLikeApiSchema,
  CombinedLikeApiSchema,
  Nullable,
  ObjectLikeApiSchema,
  getSchemaReference,
  notNullish,
  resolveAnyOfAndAllOf,
  toCasing,
} from '@goast/core';

import { TypeScriptModelGeneratorContext, TypeScriptModelGeneratorOutput } from './models';
import { ts } from '../../ast';
import { TypeScriptFileBuilder } from '../../file-builder';
import { TypeScriptFileGenerator } from '../file-generator';

type Context = TypeScriptModelGeneratorContext;
type Output = TypeScriptModelGeneratorOutput;
type Builder = TypeScriptFileBuilder;

export interface TypeScriptModelGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): TOutput;
}

export class DefaultTypeScriptModelGenerator
  extends TypeScriptFileGenerator<Context, Output>
  implements TypeScriptModelGenerator
{
  public generate(ctx: Context): Output {
    if (this.shouldGenerateTypeDeclaration(ctx, ctx.schema)) {
      const name = this.getDeclarationTypeName(ctx, ctx.schema);
      const filePath = this.getFilePath(ctx, ctx.schema);
      console.log(`Generating model ${name} to ${filePath}...`);
      ensureDirSync(dirname(filePath));

      const builder = new TypeScriptFileBuilder(filePath, ctx.config);
      this.generateFileContent(ctx, builder);

      writeFileSync(filePath, builder.toString());

      return { component: name, filePath, imports: [{ kind: 'file', name, modulePath: filePath }] };
    } else {
      const builder = new TypeScriptFileBuilder(undefined, ctx.config);
      builder.append(this.getType(ctx, ctx.schema));
      const imports = builder.imports.imports;
      builder.imports.clear();
      return { component: builder.toString(false), imports };
    }
  }

  protected generateFileContent(ctx: Context, builder: Builder): void {
    const interfaceSchema = this.resolveInterfaceSchema(ctx);
    if (interfaceSchema) {
      builder.append(this.getInterface(ctx, interfaceSchema));
    } else if (
      ctx.config.enumGeneration !== 'union' &&
      ctx.schema.kind === 'string' &&
      ctx.schema.enum !== undefined &&
      ctx.schema.enum.length > 0
    ) {
      builder.append(this.getEnum(ctx));
    } else {
      builder.append(this.getTypeAlias(ctx, ctx.schema));
    }
  }

  protected getEnum(ctx: Context) {
    return ts.enum(this.getDeclarationTypeName(ctx, ctx.schema), {
      export: true,
      members: (ctx.schema.enum?.map((x) => String(x)) ?? []).map((x) =>
        ts.enumValue(this.toEnumValueName(ctx, x), { value: this.toStringLiteral(ctx, x) }),
      ),
    });
  }

  protected getInterface(ctx: Context, schema: ObjectLikeApiSchema) {
    return ts.interface(this.getDeclarationTypeName(ctx, ctx.schema), {
      export: true,
      doc: ts.doc({ description: schema.description }),
      members: [...this.getProperties(ctx, schema), this.getIndexer(ctx, schema)],
    });
  }

  protected getTypeAlias(ctx: Context, schema: ApiSchema) {
    return ts.typeAlias(this.getDeclarationTypeName(ctx, schema), this.getType(ctx, schema, true), {
      export: true,
      doc: ts.doc({ description: schema.description }),
    });
  }

  protected getIndexer(ctx: Context, schema: ObjectLikeApiSchema) {
    return schema.additionalProperties
      ? ts.indexer(
          'string',
          schema.additionalProperties === true ? this.getAnyType(ctx) : this.getType(ctx, schema.additionalProperties),
          { readonly: ctx.config.immutableTypes },
        )
      : null;
  }

  protected getProperties(ctx: Context, schema: ObjectLikeApiSchema) {
    return Array.from(schema.properties.values()).map((property) => {
      return ts.property(property.name, {
        doc: ts.doc({ description: property.schema.description }),
        readonly: ctx.config.immutableTypes,
        optional: !schema.required.has(property.name),
        type: ts.unionType([this.getType(ctx, property.schema), property.schema.nullable ? 'null' : null]),
      });
    });
  }

  protected getType(ctx: Context, schema: Nullable<ApiSchema>, skipSchemas = false): ts.Type<Builder> {
    if (!schema) return this.getAnyType(ctx);

    schema = getSchemaReference(schema, ['description']);
    if (!skipSchemas && this.shouldGenerateTypeDeclaration(ctx, schema)) {
      return ts.reference(this.getDeclarationTypeName(ctx, schema), this.getFilePath(ctx, schema));
    }

    switch (schema.kind) {
      case 'boolean':
        return 'boolean';
      case 'integer':
      case 'number':
        return 'number';
      case 'string':
        return 'string';
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

  protected getArrayType(ctx: Context, schema: ArrayLikeApiSchema): ts.Type<Builder> {
    return ts.arrayType(this.getType(ctx, schema.items), { readonly: ctx.config.immutableTypes });
  }

  protected getObjectType(ctx: Context, schema: ObjectLikeApiSchema): ts.Type<Builder> {
    const parts = [
      schema.properties.size > 0 ? ts.objectType({ members: this.getProperties(ctx, schema) }) : null,
      schema.additionalProperties ? ts.objectType({ members: [this.getIndexer(ctx, schema)] }) : null,
      schema.allOf.length > 0 || schema.anyOf.length > 0 ? this.getCombinedType(ctx, schema) : null,
    ].filter(notNullish);
    if (parts.length === 0) {
      parts.push(ts.objectType());
    }
    return ts.intersectionType(parts);
  }

  protected getCombinedType(ctx: Context, schema: CombinedLikeApiSchema): ts.Type<Builder> {
    if (schema.allOf.length === 0 && schema.anyOf.length === 0) {
      return this.getAnyType(ctx);
    }
    return ts.intersectionType([
      ...schema.allOf.map((x) => this.getType(ctx, x)),
      ...schema.anyOf.map((x) => ts.reference('Partial', null, { generics: [this.getType(ctx, x)] })),
    ]);
  }

  protected getOneOfType(ctx: Context, schema: ApiSchema<'oneOf'>): ts.Type<Builder> {
    if (schema.oneOf.length === 0) {
      return this.getAnyType(ctx);
    }
    return ts.unionType(schema.oneOf.map((x) => this.getType(ctx, x)));
  }

  protected getMultiType(ctx: Context, schema: ApiSchema<'multi-type'>): ts.Type<Builder> {
    if (schema.type.length === 0) {
      return this.getAnyType(ctx);
    }
    return ts.unionType(
      schema.type.map((x) => {
        switch (x) {
          case 'string':
            return 'string';
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

  protected shouldGenerateTypeDeclaration(ctx: Context, schema: ApiSchema): boolean {
    // All named schemas should have its own type declaration
    if (!schema.isNameGenerated) {
      return true;
    }

    // All enum types should have its own type declaration
    if (schema.kind === 'string' && schema.enum !== undefined && schema.enum.length > 0) {
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

  protected getFilePath(ctx: Context, schema: ApiSchema): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.modelsDirPath,
      `${toCasing(schema.name, ctx.config.fileNameCasing)}.ts`,
    );
  }
}
