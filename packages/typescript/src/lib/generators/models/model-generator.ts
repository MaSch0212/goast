import { dirname, resolve } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import { ApiSchema, ArrayLikeApiSchema, CombinedLikeApiSchema, ObjectLikeApiSchema, ApiData } from '@goast/core';
import {
  Nullable,
  SourceBuilder,
  getInitializedValue,
  resolveAnyOfAndAllOf,
  toCasing,
  toPascalCase,
} from '@goast/core/utils';

import { TypeScriptModelGeneratorConfig } from './config';
import { ImportExportCollection } from '../../import-collection';
import { getModulePathRelativeToFile, toTypeScriptPropertyName, toTypeScriptStringLiteral } from '../../utils';

export type TypeScriptModelGeneratorResult = {
  typeName: string;
  typeFilePath: Nullable<string>;
};

export interface TypeScriptModelGeneratorType extends Function {
  new (): TypeScriptModelGenerator;
}

export type TypeScriptModelGeneratorContext = {
  readonly config: TypeScriptModelGeneratorConfig;
  readonly data: ApiData;
  readonly schema: ApiSchema;
  getSchemaResult(schema: ApiSchema): TypeScriptModelGeneratorResult;
};

export interface TypeScriptModelGenerator<
  TOutput extends TypeScriptModelGeneratorResult = TypeScriptModelGeneratorResult
> {
  init(context: TypeScriptModelGeneratorContext): void;
  generate(): TOutput;
}

export class DefaultTypeScriptModelGenerator implements TypeScriptModelGenerator {
  private _context?: TypeScriptModelGeneratorContext | undefined;
  private _builder?: SourceBuilder;

  protected filePath?: string;
  protected imports = new ImportExportCollection();
  protected interfaceSchema?: ApiSchema<'object'>;

  protected get context(): TypeScriptModelGeneratorContext {
    return getInitializedValue(this._context);
  }

  protected get builder(): SourceBuilder {
    return getInitializedValue(this._builder);
  }

  public init(context: TypeScriptModelGeneratorContext): void {
    this._context = context;
    this._builder = new SourceBuilder(context.config);

    this.filePath = undefined;
    this.imports.clear();
    this.interfaceSchema = this.resolveInterfaceSchema();
  }

  public generate(): TypeScriptModelGeneratorResult {
    if (this.shouldGenerateTypeDeclaration(this.context.schema)) {
      const typeName = this.getDeclarationTypeName(this.context.schema);
      const typeFilePath = this.getFilePath(this.context.schema);
      console.log(`Generating model ${typeName} to ${typeFilePath}...`);
      ensureDirSync(dirname(typeFilePath));

      this.filePath = typeFilePath;
      this.generateFileContent();

      writeFileSync(typeFilePath, this.builder.toString());

      return { typeName, typeFilePath };
    } else {
      this.generateModel(this.context.schema, this.builder);
      return { typeName: this.builder.toString(), typeFilePath: undefined };
    }
  }

  protected resolveInterfaceSchema(): ApiSchema<'object'> | undefined {
    if (
      this.context.config.typeDeclaration === 'prefer-interface' &&
      (this.context.schema.kind === 'object' || this.context.schema.kind === 'combined')
    ) {
      const resolvedSchema = resolveAnyOfAndAllOf(this.context.schema, true);
      if (resolvedSchema) {
        resolvedSchema.additionalProperties = undefined;
        return resolvedSchema;
      }
    }
    return undefined;
  }

  protected shouldGenerateTypeDeclaration(schema: ApiSchema): boolean {
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
    return !this.context.config.inlineUnnamedSchemas;
  }

  protected getTypeName(schema: ApiSchema): string {
    const modelResult = this.context.getSchemaResult(schema);
    if (modelResult.typeFilePath && this.filePath) {
      this.imports.addImport(
        modelResult.typeName,
        getModulePathRelativeToFile(
          this.filePath,
          modelResult.typeFilePath,
          this.context.config.importModuleTransformer
        )
      );
    }
    return modelResult.typeName;
  }

  protected getDeclarationTypeName(schema: ApiSchema): string {
    return toCasing(schema.name, this.context.config.typeNameCasing);
  }

  protected getFilePath(schema: ApiSchema): string {
    return resolve(
      this.context.config.outputDir,
      this.context.config.modelsDirPath,
      `${toCasing(schema.name, this.context.config.fileNameCasing)}.ts`
    );
  }

  protected getAnyType(): string {
    return this.context.config.preferUnknown ? 'unknown' : 'any';
  }

  protected generateFileContent(): void {
    this.generateModelTypePrefix();
    this.generateModel(this.interfaceSchema ?? this.context.schema, this.builder);
    this.generateModelTypeSuffix();

    if (this.imports.hasImports) {
      this.builder.prependLine((builder) => this.imports.writeTo(builder));
    }

    this.builder.ensureCurrentLineEmpty();
  }

  protected generateModelTypePrefix() {
    this.generateDocumentation(this.context.schema, this.builder);
    if (this.interfaceSchema) {
      this.builder.append('export interface ').append(this.getDeclarationTypeName(this.context.schema)).append(' ');
    } else if (
      this.context.config.enumGeneration !== 'union' &&
      this.context.schema.kind === 'string' &&
      this.context.schema.enum !== undefined &&
      this.context.schema.enum.length > 0
    ) {
      this.builder.append('export enum ').append(this.getDeclarationTypeName(this.context.schema)).append(' ');
    } else {
      this.builder.append('export type ').append(this.getDeclarationTypeName(this.context.schema)).append(' = ');
    }
  }

  protected generateModelTypeSuffix() {
    if (!this.interfaceSchema) {
      this.builder.append(';');
    }
  }

  protected generateModel(schema: ApiSchema, builder: SourceBuilder): void {
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
          this.generateEnumModel(schema as ApiSchema<'string'>, builder);
        } else {
          builder.append('string');
        }
        break;
      case 'null':
        builder.append('null');
        break;
      case 'unknown':
        builder.append(this.getAnyType());
        break;
      case 'array':
        this.generateArrayModel(schema, builder);
        break;
      case 'object':
        this.generateObjectModel(schema, builder);
        break;
      case 'combined':
        this.generateCombinedModel(schema, builder);
        break;
      case 'multi-type':
        this.generateMultiTypeModel(schema, builder);
        break;
      case 'oneOf':
        this.generateOneOfModel(schema, builder);
        break;
      default:
        builder.append(this.getAnyType());
        break;
    }
  }

  protected generateArrayModel(schema: ArrayLikeApiSchema, builder: SourceBuilder): void {
    builder
      .append(this.context.config.immutableTypes ? 'ReadonlyArray' : 'Array')
      .parenthesize('<>', (builder) =>
        builder.append(schema.items ? this.getTypeName(schema.items) : this.getAnyType())
      );
  }

  protected generateCombinedModel(schema: CombinedLikeApiSchema, builder: SourceBuilder): void {
    if (schema.allOf.length === 0 && schema.anyOf.length === 0) {
      builder.append(this.getAnyType());
      return;
    }

    this.generateConcatenatedModel(schema.allOf, builder, '&', false);

    if (schema.anyOf.length > 0) {
      if (schema.allOf.length > 0) {
        builder.append(' & ');
      }
      this.generateConcatenatedModel(schema.anyOf, builder, '&', false, (typeName) => `Partial<${typeName}>`);
    }
  }

  protected generateOneOfModel(schema: ApiSchema<'oneOf'>, builder: SourceBuilder): void {
    if (schema.oneOf.length === 0) {
      builder.append(this.getAnyType());
      return;
    }

    this.generateConcatenatedModel(schema.oneOf, builder, '|', true);
  }

  protected generateMultiTypeModel(schema: ApiSchema<'multi-type'>, builder: SourceBuilder): void {
    if (schema.type.length === 0) {
      builder.append(this.getAnyType());
      return;
    }

    const parenthesize = schema.type.length > 1;
    builder.parenthesizeIf(parenthesize, '()', (builder) =>
      builder
        .if(parenthesize, (builder) => builder.appendLine().append('| '))
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
                this.generateArrayModel(schema, builder);
                break;
              case 'object':
                this.generateObjectModel(schema, builder);
                break;
              default:
                builder.append('never');
                break;
            }
          }
        )
    );
  }

  protected generateObjectModel(schema: ObjectLikeApiSchema, builder: SourceBuilder): void {
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
          builder.appendLine().forEach(schema.properties.values(), (builder, property) => {
            this.generateDocumentation(property.schema, builder);
            builder
              .appendIf(this.context.config.immutableTypes, 'readonly ')
              .append(toTypeScriptPropertyName(property.name, this.context.config.useSingleQuotes))
              .appendIf(!schema.required.has(property.name), '?')
              .append(': ')
              .append(this.getTypeName(property.schema))
              .appendIf(property.schema.nullable === true, ' | null')
              .appendLine(';');
          })
        )
        .appendIf(!!schema.additionalProperties || schema.allOf.length > 0 || schema.anyOf.length > 0, ' & ');
    }

    // additional properties
    if (schema.additionalProperties) {
      builder
        .appendIf(this.context.config.immutableTypes, 'Readonly<')
        .append('Record<string, ')
        .append(schema.additionalProperties === true ? 'unknown' : this.getTypeName(schema.additionalProperties))
        .append('>')
        .appendIf(this.context.config.immutableTypes, '>');

      if (schema.allOf.length > 0 || schema.anyOf.length > 0) {
        builder.append(' & ');
      }
    }

    // allOf & anyOf
    if (schema.allOf.length > 0 || schema.anyOf.length > 0) {
      this.generateCombinedModel(schema, builder);
    }
  }

  protected generateConcatenatedModel(
    schemas: ApiSchema[],
    builder: SourceBuilder,
    separator: string,
    putInParentheses: boolean,
    typeTemplate?: (typeName: string) => string
  ): void {
    putInParentheses &&= schemas.length > 1;
    builder.parenthesizeIf(putInParentheses, '()', (builder) =>
      builder.forEachSeparated(schemas, ` ${separator} `, (builder, schema) => {
        const typeName = this.getTypeName(schema);
        builder.append(typeTemplate ? typeTemplate(typeName) : typeName);
      })
    );
  }

  protected generateEnumModel(schema: ApiSchema<'string'>, builder: SourceBuilder): void {
    const stringEnum = (schema.enum?.filter((item) => typeof item === 'string') ?? []) as string[];
    if (this.context.config.enumGeneration === 'union') {
      builder.indent((builder) => {
        builder.forEachSeparated(stringEnum, ' | ', (builder, item) =>
          builder.append(toTypeScriptStringLiteral(item, this.context.config.useSingleQuotes))
        );
      });
    } else {
      builder.parenthesize('{}', (builder) =>
        builder
          .appendLine()
          .forEach(stringEnum, (builder, item) =>
            builder.appendLine(
              `${toPascalCase(item)} = ${toTypeScriptStringLiteral(item, this.context.config.useSingleQuotes)},`
            )
          )
      );
    }
  }

  protected generateDocumentation(schema: ApiSchema, builder: SourceBuilder): void {
    if (schema.description) {
      builder.appendLine('/**').appendLineWithLinePrefix(' * ', schema.description.trim()).appendLine(' */');
    }
  }
}
