import { dirname, resolve } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import {
  ApiSchema,
  ApiSchemaProperty,
  ArrayLikeApiSchema,
  CombinedLikeApiSchema,
  ObjectLikeApiSchema,
  getSchemaReference,
  resolveAnyOfAndAllOf,
  toCasing,
} from '@goast/core';

import { TypeScriptModelGeneratorContext, TypeScriptModelGeneratorOutput } from './models';
import { TypeScriptFileBuilder } from '../../file-builder';
import { toTypeScriptPropertyName } from '../../utils';
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

      return { name, filePath, additionalImports: [] };
    } else {
      const builder = new TypeScriptFileBuilder(undefined, ctx.config);
      this.generateType(ctx, builder, ctx.schema);
      const additionalImports = builder.imports.imports;
      builder.imports.clear();
      return { name: builder.toString(false), filePath: undefined, additionalImports };
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
      .append((builder) => this.generateTypeDocumentation(ctx, builder))
      .ensureCurrentLineEmpty()
      .append((builder) => this.generateEnumSignature(ctx, builder))
      .parenthesize('{}', (builder) => this.generateEnumValues(ctx, builder), { multiline: true })
      .ensureCurrentLineEmpty();
  }

  protected generateEnumSignature(ctx: Context, builder: Builder): void {
    builder.append('export enum ').append(this.getDeclarationTypeName(ctx, ctx.schema));
  }

  protected generateEnumValues(ctx: Context, builder: Builder): void {
    builder.forEach(
      ctx.schema.enum?.map((x) => String(x)) ?? [],
      (builder, enumValue) =>
        builder.append(`${this.toEnumValueName(ctx, enumValue)} = ${this.toStringLiteral(ctx, enumValue)}`),
      { separator: ',\n' }
    );
  }

  protected generateInterface(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    builder
      .append((builder) => this.generateTypeDocumentation(ctx, builder))
      .ensureCurrentLineEmpty()
      .append((builder) => this.generateInterfaceSignature(ctx, builder))
      .parenthesize(
        '{}',
        (builder) => builder.append((builder) => this.generateInterfaceContent(ctx, builder, schema)),
        { multiline: true }
      )
      .ensureCurrentLineEmpty();
  }

  protected generateInterfaceSignature(ctx: Context, builder: Builder): void {
    builder.append('export interface ').append(this.getDeclarationTypeName(ctx, ctx.schema));
  }

  protected generateInterfaceContent(ctx: Context, builder: Builder, schema: ApiSchema<'object'>): void {
    this.generateObjectTypeProperties(ctx, builder, schema);
    if (schema.additionalProperties) {
      builder.append('[key: string]: ');
      if (schema.additionalProperties === true) {
        builder.append(this.getAnyType(ctx));
      } else {
        this.generateTypeUsage(ctx, builder, schema.additionalProperties);
      }
      builder.appendLine(';');
    }
  }

  protected generateTypeAlias(ctx: Context, builder: Builder): void {
    builder
      .append((builder) => this.generateTypeDocumentation(ctx, builder))
      .ensureCurrentLineEmpty()
      .append((builder) => this.generateTypeAliasSignature(ctx, builder))
      .append(' = ')
      .append((builder) => this.generateType(ctx, builder, ctx.schema))
      .appendLine(';');
  }

  protected generateTypeAliasSignature(ctx: Context, builder: Builder): void {
    builder.append('export type ').append(this.getDeclarationTypeName(ctx, ctx.schema));
  }

  protected generateTypeUsage(ctx: Context, builder: Builder, schema: ApiSchema): void {
    schema = getSchemaReference(schema, ['description']);
    if (this.shouldGenerateTypeDeclaration(ctx, schema)) {
      const name = this.getDeclarationTypeName(ctx, schema);
      const filePath = this.getFilePath(ctx, schema);
      if (filePath) {
        builder.addFileImport(name, filePath);
      }
      builder.append(name);
    } else {
      this.generateType(ctx, builder, schema);
    }
  }

  protected generateType(ctx: Context, builder: Builder, schema: ApiSchema): void {
    if (schema.enum !== undefined && schema.enum.length > 0) {
      this.generateEnumType(ctx, builder, schema as ApiSchema<'string'>);
      return;
    }

    switch (schema.kind) {
      case 'boolean':
        builder.append('boolean');
        break;
      case 'integer':
      case 'number':
        builder.append('number');
        break;
      case 'string':
        builder.append('string');
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
      .appendIf(ctx.config.immutableTypes, 'readonly ')
      .parenthesize('()', (builder) =>
        schema.items ? this.generateTypeUsage(ctx, builder, schema.items) : builder.append(this.getAnyType(ctx))
      )
      .append('[]');
  }

  protected generateCombinedType(ctx: Context, builder: Builder, schema: CombinedLikeApiSchema): void {
    if (schema.allOf.length === 0 && schema.anyOf.length === 0) {
      builder.append(this.getAnyType(ctx));
      return;
    }

    builder
      .forEach(schema.allOf, (builder, schema) => this.generateTypeUsage(ctx, builder, schema), { separator: ' & ' })
      .appendIf(schema.anyOf.length > 0, (builder) =>
        builder
          .appendIf(schema.allOf.length > 0, ' & ')
          .forEach(
            schema.anyOf,
            (builder, schema) =>
              builder
                .append('Partial')
                .parenthesize('<>', (builder) => this.generateTypeUsage(ctx, builder, schema), { indent: false }),
            { separator: ' & ' }
          )
      );
  }

  protected generateOneOfType(ctx: Context, builder: Builder, schema: ApiSchema<'oneOf'>): void {
    if (schema.oneOf.length === 0) {
      builder.append(this.getAnyType(ctx));
      return;
    }

    builder.parenthesizeIf(schema.oneOf.length > 1, '()', (builder) =>
      builder.forEach(schema.oneOf, (builder, schema) => this.generateTypeUsage(ctx, builder, schema), {
        separator: ' | ',
      })
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
        .appendIf(parenthesize, (builder) => builder.appendLine().append('| '))
        .forEach(
          schema.type,
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
          },
          { separator: (builder) => builder.appendLine().append('| ') }
        )
    );
  }

  protected generateObjectType(ctx: Context, builder: Builder, schema: ObjectLikeApiSchema): void {
    if (
      schema.properties.size === 0 &&
      !schema.additionalProperties &&
      schema.allOf.length === 0 &&
      schema.anyOf.length === 0 &&
      schema.discriminator === undefined
    ) {
      builder.append('{}');
      return;
    }

    // properties
    if (schema.properties.size > 0) {
      builder
        .parenthesize('{}', (builder) =>
          builder.appendLine().append((builder) => this.generateObjectTypeProperties(ctx, builder, schema))
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
        .append(toTypeScriptPropertyName(property.name, ctx.config.useSingleQuotes))
        .appendIf(!schema.required.has(property.name), '?')
        .append(': ')
        .append((builder) => this.generateTypeUsage(ctx, builder, property.schema))
        .appendIf(property.schema.nullable === true, ' | null')
        .appendLine(';');
    });
  }

  protected generateObjectTypeAdditionalProperties(ctx: Context, builder: Builder, schema: ObjectLikeApiSchema): void {
    if (!schema.additionalProperties) return;
    builder
      .appendIf(ctx.config.immutableTypes, 'readonly ')
      .append('Record')
      .appendGenericTypeParameters(
        'string',
        schema.additionalProperties === true
          ? this.getAnyType(ctx)
          : (builder) => this.generateTypeUsage(ctx, builder, schema.additionalProperties as ApiSchema)
      );
  }

  protected generateEnumType(ctx: Context, builder: Builder, schema: ApiSchema): void {
    builder.indent((builder) => {
      builder.forEach(schema.enum ?? [], (builder, item) => builder.append(this.toStringLiteral(ctx, String(item))), {
        separator: ' | ',
      });
    });
  }

  protected generateTypeDocumentation(ctx: Context, builder: Builder): void {
    this.generateDocumentation(ctx, builder, ctx.schema);
  }

  protected generatePropertyDocumentation(ctx: Context, builder: Builder, property: ApiSchemaProperty): void {
    this.generateDocumentation(ctx, builder, property.schema);
  }

  protected generateDocumentation(ctx: Context, builder: Builder, schema: ApiSchema): void {
    builder.appendComment('/***/', schema.description);
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
      `${toCasing(schema.name, ctx.config.fileNameCasing)}.ts`
    );
  }
}
