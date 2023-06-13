import { dirname, resolve } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import {
  ApiSchema,
  ApiSchemaProperty,
  ArrayLikeApiSchema,
  CombinedLikeApiSchema,
  ObjectLikeApiSchema,
  resolveAnyOfAndAllOf,
  toCasing,
} from '@goast/core';

import { TypeScriptModelGeneratorContext, TypeScriptModelGeneratorOutput } from './models';
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
    if (this.shouldGenerateTypeDeclaration(ctx)) {
      const name = this.getDeclarationTypeName(ctx);
      const filePath = this.getFilePath(ctx);
      console.log(`Generating model ${name} to ${filePath}...`);
      ensureDirSync(dirname(filePath));

      const builder = new TypeScriptFileBuilder(filePath, ctx.config);
      this.generateFileContent(ctx, builder);

      writeFileSync(filePath, builder.toString());

      return { name, filePath };
    } else {
      const builder = new TypeScriptFileBuilder(undefined, ctx.config);
      this.generateType(ctx, builder, ctx.schema);
      return { name: builder.toString(false), filePath: undefined };
    }
  }

  protected generateFileContent(ctx: Context, builder: Builder): void {
    const interfaceSchema = this.resolveInterfaceSchema(ctx);
    if (interfaceSchema) {
      this.generateInterface(ctx, builder, interfaceSchema);
    } else if (
      ctx.config.enumGeneration !== 'union' &&
      ctx.schema.kind === 'string' &&
      ctx.schema.enum !== undefined &&
      ctx.schema.enum.length > 0
    ) {
      this.generateEnum(ctx, builder);
    } else {
      this.generateTypeAlias(ctx, builder);
    }
  }

  protected generateEnum(ctx: Context, builder: Builder): void {
    builder
      .apply((builder) => this.generateTypeDocumentation(ctx, builder))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateEnumSignature(ctx, builder))
      .parenthesize('{}', (builder) => {
        builder.ensureCurrentLineEmpty();
        this.generateEnumValues(ctx, builder);
      })
      .appendLine();
  }

  protected generateEnumSignature(ctx: Context, builder: Builder): void {
    builder.append('export enum ').append(this.getDeclarationTypeName(ctx));
  }

  protected generateEnumValues(ctx: Context, builder: Builder): void {
    const enumValues = ctx.schema.enum ?? [];
    for (let i = 0; i < enumValues.length; i++) {
      const enumValue = String(enumValues[i]);
      builder.appendLine(`${this.toEnumValueName(ctx, enumValue)} = ${this.toStringLiteral(ctx, enumValue)},`);
    }
  }

  protected generateInterface(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    builder
      .apply((builder) => this.generateTypeDocumentation(ctx, builder))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateInterfaceSignature(ctx, builder))
      .parenthesize('{}', (builder) =>
        builder.appendLine().apply((builder) => this.generateInterfaceContent(ctx, builder, schema))
      )
      .appendLine();
  }

  protected generateInterfaceSignature(ctx: Context, builder: Builder): void {
    builder.append('export interface ').append(this.getDeclarationTypeName(ctx));
  }

  protected generateInterfaceContent(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    this.generateObjectTypeProperties(ctx, builder, schema);
    if (schema.additionalProperties) {
      const valueType =
        schema.additionalProperties === true
          ? this.getAnyType(ctx)
          : this.getTypeName(ctx, builder, schema.additionalProperties);
      builder.appendLine(`[key: string]: ${valueType};`);
    }
  }

  protected generateTypeAlias(ctx: Context, builder: Builder): void {
    builder
      .apply((builder) => this.generateTypeDocumentation(ctx, builder))
      .ensureCurrentLineEmpty()
      .apply((builder) => this.generateTypeAliasSignature(ctx, builder))
      .append(' = ')
      .apply((builder) => this.generateType(ctx, builder, ctx.schema))
      .appendLine(';');
  }

  protected generateTypeAliasSignature(ctx: Context, builder: Builder): void {
    builder.append('export type ').append(this.getDeclarationTypeName(ctx));
  }

  protected generateType(ctx: Context, builder: Builder, schema: ApiSchema): void {
    switch (schema.kind) {
      case 'boolean':
        builder.append('boolean');
        break;
      case 'integer':
      case 'number':
        builder.append('number');
        break;
      case 'string':
        if (schema.enum !== undefined && schema.enum.length > 0) {
          this.generateEnumType(ctx, builder, schema as ApiSchema<'string'>);
        } else {
          builder.append('string');
        }
        break;
      case 'null':
        builder.append('null');
        break;
      case 'unknown':
        builder.append(this.getAnyType(ctx));
        break;
      case 'array':
        this.generateArrayType(ctx, builder, schema);
        break;
      case 'object':
        this.generateObjectType(ctx, builder, schema);
        break;
      case 'combined':
        this.generateCombinedType(ctx, builder, schema);
        break;
      case 'multi-type':
        this.generateMultiType(ctx, builder, schema);
        break;
      case 'oneOf':
        this.generateOneOfType(ctx, builder, schema);
        break;
      default:
        builder.append(this.getAnyType(ctx));
        break;
    }
  }

  protected generateArrayType(ctx: Context, builder: Builder, schema: ArrayLikeApiSchema): void {
    builder
      .append(ctx.config.immutableTypes ? 'ReadonlyArray' : 'Array')
      .parenthesize('<>', (builder) =>
        builder.append(schema.items ? this.getTypeName(ctx, builder, schema.items) : this.getAnyType(ctx))
      );
  }

  protected generateCombinedType(ctx: Context, builder: Builder, schema: CombinedLikeApiSchema): void {
    if (schema.allOf.length === 0 && schema.anyOf.length === 0) {
      builder.append(this.getAnyType(ctx));
      return;
    }

    builder
      .forEachSeparated(schema.allOf, ' & ', (builder, schema) =>
        builder.append(this.getTypeName(ctx, builder, schema))
      )
      .applyIf(schema.anyOf.length > 0, (builder) =>
        builder
          .appendIf(schema.allOf.length > 0, ' & ')
          .forEachSeparated(schema.anyOf, ' & ', (builder, schema) =>
            builder.append(`Partial<${this.getTypeName(ctx, builder, schema)}>`)
          )
      );
  }

  protected generateOneOfType(ctx: Context, builder: Builder, schema: ApiSchema<'oneOf'>): void {
    if (schema.oneOf.length === 0) {
      builder.append(this.getAnyType(ctx));
      return;
    }

    builder.parenthesizeIf(schema.oneOf.length > 1, '()', (builder) =>
      builder.forEachSeparated(schema.oneOf, ' | ', (builder, schema) =>
        builder.append(this.getTypeName(ctx, builder, schema))
      )
    );
  }

  protected generateMultiType(ctx: Context, builder: Builder, schema: ApiSchema<'multi-type'>): void {
    if (schema.type.length === 0) {
      builder.append(this.getAnyType(ctx));
      return;
    }

    const parenthesize = schema.type.length > 1;
    builder.parenthesizeIf(parenthesize, '()', (builder) =>
      builder
        .applyIf(parenthesize, (builder) => builder.appendLine().append('| '))
        .forEachSeparated(
          schema.type,
          (builder) => builder.appendLine().append('| '),
          (builder, type) => {
            switch (type) {
              case 'string':
                builder.append('string');
                break;
              case 'number':
              case 'integer':
                builder.append('number');
                break;
              case 'boolean':
                builder.append('boolean');
                break;
              case 'null':
                builder.append('null');
                break;
              case 'array':
                this.generateArrayType(ctx, builder, schema);
                break;
              case 'object':
                this.generateObjectType(ctx, builder, schema);
                break;
              default:
                builder.append('never');
                break;
            }
          }
        )
    );
  }

  protected generateObjectType(ctx: Context, builder: Builder, schema: ObjectLikeApiSchema): void {
    if (
      schema.properties.size === 0 &&
      !schema.additionalProperties &&
      schema.allOf.length === 0 &&
      schema.anyOf.length === 0
    ) {
      builder.append('{}');
      return;
    }

    // properties
    if (schema.properties.size > 0) {
      builder
        .parenthesize('{}', (builder) =>
          builder.appendLine().apply((builder) => this.generateObjectTypeProperties(ctx, builder, schema))
        )
        .appendIf(!!schema.additionalProperties || schema.allOf.length > 0 || schema.anyOf.length > 0, ' & ');
    }

    // additional properties
    if (schema.additionalProperties) {
      this.generateObjectTypeAdditionalProperties(ctx, builder, schema);
      if (schema.allOf.length > 0 || schema.anyOf.length > 0) {
        builder.append(' & ');
      }
    }

    // allOf & anyOf
    if (schema.allOf.length > 0 || schema.anyOf.length > 0) {
      this.generateCombinedType(ctx, builder, schema);
    }
  }

  protected generateObjectTypeProperties(ctx: Context, builder: Builder, schema: ObjectLikeApiSchema): void {
    builder.forEach(schema.properties.values(), (builder, property) => {
      this.generatePropertyDocumentation(ctx, builder, property);
      builder
        .appendIf(ctx.config.immutableTypes, 'readonly ')
        .append(this.toPropertyName(ctx, property.name))
        .appendIf(!schema.required.has(property.name), '?')
        .append(': ')
        .append(this.getTypeName(ctx, builder, property.schema))
        .appendIf(property.schema.nullable === true, ' | null')
        .appendLine(';');
    });
  }

  protected generateObjectTypeAdditionalProperties(ctx: Context, builder: Builder, schema: ObjectLikeApiSchema): void {
    if (!schema.additionalProperties) return;
    builder
      .appendIf(ctx.config.immutableTypes, 'Readonly<')
      .append('Record<string, ')
      .append(
        schema.additionalProperties === true ? 'unknown' : this.getTypeName(ctx, builder, schema.additionalProperties)
      )
      .append('>')
      .appendIf(ctx.config.immutableTypes, '>');
  }

  protected generateEnumType(ctx: Context, builder: Builder, schema: ApiSchema<'string'>): void {
    builder.indent((builder) => {
      builder.forEachSeparated(schema.enum ?? [], ' | ', (builder, item) =>
        builder.append(this.toStringLiteral(ctx, String(item)))
      );
    });
  }

  protected generateTypeDocumentation(ctx: Context, builder: Builder): void {
    this.generateDocumentation(ctx, builder, ctx.schema);
  }

  protected generatePropertyDocumentation(ctx: Context, builder: Builder, property: ApiSchemaProperty): void {
    this.generateDocumentation(ctx, builder, property.schema);
  }

  protected generateDocumentation(ctx: Context, builder: Builder, schema: ApiSchema): void {
    if (schema.description) {
      builder.appendLine('/**').appendLineWithLinePrefix(' * ', schema.description.trim()).appendLine(' */');
    }
  }

  protected shouldGenerateTypeDeclaration(ctx: Context): boolean {
    // All named schemas should have its own type declaration
    if (!ctx.schema.isNameGenerated) {
      return true;
    }

    // All enum types should have its own type declaration
    if (ctx.schema.kind === 'string' && ctx.schema.enum !== undefined && ctx.schema.enum.length > 0) {
      return true;
    }

    // All primitive types already exist and do not need its own type declaration
    if (
      ctx.schema.kind !== 'array' &&
      ctx.schema.kind !== 'combined' &&
      ctx.schema.kind !== 'multi-type' &&
      ctx.schema.kind !== 'object' &&
      ctx.schema.kind !== 'oneOf'
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

  protected getTypeName(ctx: Context, builder: Builder, schema: ApiSchema): string {
    const modelResult = ctx.getSchemaResult(schema);
    if (modelResult.filePath) {
      builder.addImport(modelResult.name, modelResult.filePath);
    }
    return modelResult.name;
  }

  protected getDeclarationTypeName(ctx: Context): string {
    return toCasing(ctx.schema.name, ctx.config.typeNameCasing);
  }

  protected getFilePath(ctx: Context): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.modelsDirPath,
      `${toCasing(ctx.schema.name, ctx.config.fileNameCasing)}.ts`
    );
  }
}
