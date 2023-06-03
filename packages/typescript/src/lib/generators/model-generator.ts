import { dirname, resolve } from 'path';

import fs from 'fs-extra';

import { ApiSchema, ArrayLikeApiSchema, CombinedLikeApiSchema, ObjectLikeApiSchema, ApiData } from '@goast/core';
import {
  SourceBuilder,
  getInitializedValue,
  resolveAnyOfAndAllOf,
  selectFirstReferenceWithImpactfulChanges,
  toCasing,
  toPascalCase,
} from '@goast/core/utils';

import { TypeScriptModelGeneratorConfig } from './config';
import { ImportExportCollection } from '../import-collection';
import { getModulePathRelativeToFile, toTypeScriptPropertyName, toTypeScriptStringLiteral } from '../utils';

export type TypeScriptModelGeneratorResult = {
  typeName: string;
  filePath: string | undefined;
};

export interface TypeScriptModelGeneratorType extends Function {
  new (): TypeScriptModelGenerator;
}

export interface TypeScriptModelGenerator<
  TOutput extends TypeScriptModelGeneratorResult = TypeScriptModelGeneratorResult
> {
  init(config: TypeScriptModelGeneratorConfig, data: ApiData, schema: ApiSchema): PromiseLike<void> | void;
  generate(): PromiseLike<TOutput> | TOutput;
}

export class DefaultTypeScriptModelGenerator implements TypeScriptModelGenerator {
  private _usesReferencedSchema: boolean = false;
  private _config?: TypeScriptModelGeneratorConfig;
  private _data?: ApiData;
  private _schema?: ApiSchema;
  private _builder?: SourceBuilder;

  protected filePath?: string;
  protected imports = new ImportExportCollection();
  protected interfaceSchema?: ApiSchema<'object'>;

  protected get config(): TypeScriptModelGeneratorConfig {
    return getInitializedValue(this._config);
  }

  protected get data(): ApiData {
    return getInitializedValue(this._data);
  }

  protected get schema(): ApiSchema {
    return getInitializedValue(this._schema);
  }

  protected get builder(): SourceBuilder {
    return getInitializedValue(this._builder);
  }

  public init(config: TypeScriptModelGeneratorConfig, data: ApiData, schema: ApiSchema): void {
    const actualSchema = selectFirstReferenceWithImpactfulChanges(schema);
    this._usesReferencedSchema = actualSchema !== schema;
    this._config = config;
    this._data = data;
    this._schema = actualSchema;
    this._builder = new SourceBuilder(config);

    this.filePath = undefined;
    this.imports.clear();
    this.interfaceSchema = this.resolveInterfaceSchema();
  }

  public async generate(): Promise<TypeScriptModelGeneratorResult> {
    if (this.shouldGenerateTypeDeclaration(this.schema)) {
      const typeName = this.getDeclarationTypeName(this.schema);
      const filePath = this.getFilePath(this.schema);
      console.log(`Generating model ${typeName} to ${filePath}...`);
      await fs.ensureDir(dirname(filePath));

      this.filePath = filePath;
      this.generateFileContent();

      await fs.writeFile(filePath, this.builder.toString());

      return {
        typeName,
        filePath: filePath,
      };
    } else {
      this.generateModel(this.schema, this.builder);
      return { typeName: this.builder.toString(), filePath: undefined };
    }
  }

  protected resolveInterfaceSchema(): ApiSchema<'object'> | undefined {
    if (
      this.config.typeDeclaration === 'prefer-interface' &&
      (this.schema.kind === 'object' || this.schema.kind === 'combined')
    ) {
      const resolvedSchema = resolveAnyOfAndAllOf(this.schema, true);
      if (resolvedSchema) {
        resolvedSchema.additionalProperties = undefined;
        return resolvedSchema;
      }
    }
    return undefined;
  }

  protected shouldGenerateTypeDeclaration(schema: ApiSchema): boolean {
    if (this._usesReferencedSchema) {
      return false;
    }

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
    return !this.config.inlineUnnamedSchemas;
  }

  protected getTypeName(schema: ApiSchema): string {
    if (!this.shouldGenerateTypeDeclaration(schema)) {
      return SourceBuilder.build((builder) => this.generateModel(schema, builder), this.config);
    }

    const typeName = this.getDeclarationTypeName(schema);
    const modulePath = this.filePath
      ? getModulePathRelativeToFile(this.filePath, this.getFilePath(schema), this.config.importModuleTransformer)
      : '';

    this.imports.addImport(typeName, modulePath);
    return typeName;
  }

  protected getDeclarationTypeName(schema: ApiSchema): string {
    return toCasing(schema.name, this.config.typeNameCasing);
  }

  protected getFilePath(schema: ApiSchema): string {
    return resolve(
      this.config.outputDir,
      this.config.modelsDirPath,
      `${toCasing(schema.name, this.config.fileNameCasing)}.ts`
    );
  }

  protected getAnyType(): string {
    return this.config.preferUnknown ? 'unknown' : 'any';
  }

  protected generateFileContent(): void {
    this.generateModelTypePrefix();
    this.generateModel(this.interfaceSchema ?? this.schema, this.builder);
    this.generateModelTypeSuffix();

    if (this.imports.hasImports) {
      this.builder.prependLine((builder) => this.imports.writeTo(builder));
    }

    this.builder.ensureCurrentLineEmpty();
  }

  protected generateModelTypePrefix() {
    this.generateDocumentation(this.schema, this.builder);
    if (this.interfaceSchema) {
      this.builder.append('export interface ').append(this.getDeclarationTypeName(this.schema)).append(' ');
    } else if (
      this.config.enumGeneration !== 'union' &&
      this.schema.kind === 'string' &&
      this.schema.enum !== undefined &&
      this.schema.enum.length > 0
    ) {
      this.builder.append('export enum ').append(this.getDeclarationTypeName(this.schema)).append(' ');
    } else {
      this.builder.append('export type ').append(this.getDeclarationTypeName(this.schema)).append(' = ');
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
      .append(this.config.immutableTypes ? 'ReadonlyArray' : 'Array')
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
              .appendIf(this.config.immutableTypes, 'readonly ')
              .append(toTypeScriptPropertyName(property.name, this.config.useSingleQuotes))
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
        .appendIf(this.config.immutableTypes, 'Readonly<')
        .append('Record<string, ')
        .append(schema.additionalProperties === true ? 'unknown' : this.getTypeName(schema.additionalProperties))
        .append('>')
        .appendIf(this.config.immutableTypes, '>');

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
    if (this.config.enumGeneration === 'union') {
      builder.indent((builder) => {
        builder.forEachSeparated(stringEnum, ' | ', (builder, item) =>
          builder.append(toTypeScriptStringLiteral(item, this.config.useSingleQuotes))
        );
      });
    } else {
      builder.parenthesize('{}', (builder) =>
        builder
          .appendLine()
          .forEach(stringEnum, (builder, item) =>
            builder.appendLine(
              `${toPascalCase(item)} = ${toTypeScriptStringLiteral(item, this.config.useSingleQuotes)},`
            )
          )
      );
    }
  }

  protected generateDocumentation(schema: ApiSchema, builder: SourceBuilder): void {
    if (schema.description) {
      builder
        .appendLine('/**')
        .appendLine(` * ${schema.description.trim().replace('\r', '').split('\n').join('\n * ')}`)
        .appendLine(' */');
    }
  }
}
