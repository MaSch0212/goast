import { dirname, resolve } from 'path';

import fs from 'fs-extra';

import {
  ApiSchema,
  ArrayLikeApiSchema,
  CodeGenerator,
  CodeGeneratorContext,
  CombinedLikeApiSchema,
  ObjectLikeApiSchema,
} from '@goast/core';
import {
  SourceBuilder,
  StringCasing,
  StringCasingWithOptions,
  resolveAnyOfAndAllOf,
  toCasing,
  toPascalCase,
} from '@goast/core/utils';

import { ImportExportCollection } from './import-collection.js';
import {
  ImportModuleTransformer,
  getModulePathRelativeToFile,
  toTypeScriptPropertyName,
  toTypeScriptStringLiteral,
} from './utils.js';

export type TypeScriptModelsGeneratorResult = {
  models: {
    [schemaId: string]: {
      typeName: string;
      filePath: string | undefined;
    };
  };
  modelIndexFilePath: string | undefined;
};
export type TypeScriptModelsGeneratorConfig = Readonly<{
  enumGeneration: 'union' | 'number-enum' | 'string-enum';
  fileNameCasing: StringCasing | StringCasingWithOptions;
  immutableTypes: boolean;
  importModuleTransformer: ImportModuleTransformer;
  indexFilePath: string | null;
  inlineUnnamedSchemas: boolean;
  modelsDirPath: string;
  preferUnknown: boolean;
  typeDeclaration: 'type' | 'prefer-interface';
  typeNameCasing: StringCasing | StringCasingWithOptions;
  useSingleQuotes: boolean;
}>;

const defaultConfig: TypeScriptModelsGeneratorConfig = {
  enumGeneration: 'union',
  fileNameCasing: { casing: 'kebab', suffix: '.model' },
  immutableTypes: false,
  importModuleTransformer: 'omit-extension',
  indexFilePath: 'models.ts',
  inlineUnnamedSchemas: true,
  modelsDirPath: 'models',
  preferUnknown: true,
  typeDeclaration: 'type',
  typeNameCasing: 'pascal',
  useSingleQuotes: true,
};

export type TypeScriptModelGeneratorContext = CodeGeneratorContext<
  Record<string, unknown>,
  TypeScriptModelsGeneratorConfig
> & {
  currentImports: ImportExportCollection;
  currentFilePath?: string;
  currentResult: TypeScriptModelsGeneratorResult;
};

export class TypeScriptModelsGenerator
  implements CodeGenerator<Record<string, unknown>, TypeScriptModelsGeneratorResult, TypeScriptModelsGeneratorConfig>
{
  private _config: TypeScriptModelsGeneratorConfig;

  constructor(config?: Partial<TypeScriptModelsGeneratorConfig>) {
    this._config = { ...defaultConfig, ...config };
  }

  public get config(): TypeScriptModelsGeneratorConfig {
    return this._config;
  }

  public async generate(
    context: CodeGeneratorContext<Record<string, unknown>, TypeScriptModelsGeneratorConfig>
  ): Promise<TypeScriptModelsGeneratorResult> {
    const ctx: TypeScriptModelGeneratorContext = {
      ...context,
      currentImports: new ImportExportCollection(),
      currentResult: { models: {}, modelIndexFilePath: undefined },
    };

    for (const schema of ctx.data.schemas) {
      ctx.currentImports.clear();
      ctx.currentFilePath = undefined;
      ctx.state.clear();

      await this.handleSchema(ctx, schema);
    }

    await this.handleIndexFile(ctx);

    return ctx.currentResult;
  }

  protected async handleSchema(ctx: TypeScriptModelGeneratorContext, schema: ApiSchema): Promise<void> {
    if (this.shouldGenerateTypeDeclaration(ctx, schema)) {
      const typeName = this.getDeclarationTypeName(ctx, schema);
      const filePath = this.getModelFilePath(ctx, schema);
      console.log(`Generating model ${typeName} to ${filePath}...`);
      await fs.ensureDir(dirname(filePath));

      ctx.currentFilePath = filePath;

      await fs.writeFile(filePath, this.generateModelFileContent(ctx, schema));

      ctx.currentResult.models[schema.id] = {
        typeName,
        filePath: filePath,
      };
    } else {
      const typeName = this.buildSource(ctx, (builder) => this.generateModel(ctx, schema, builder));
      if (typeName) {
        ctx.currentResult.models[schema.id] = { typeName, filePath: undefined };
      }
    }
  }

  protected async handleIndexFile(ctx: TypeScriptModelGeneratorContext): Promise<void> {
    if (this.shouldGenerateIndexFile(ctx)) {
      const filePath = this.getIndexFilePath(ctx);
      console.log(`Generating index file to ${filePath}...`);
      await fs.ensureDir(dirname(filePath));

      await fs.writeFile(filePath, this.generateIndexFileContent(ctx));

      ctx.currentResult.modelIndexFilePath = filePath;
    }
  }

  protected buildSource(ctx: TypeScriptModelGeneratorContext, action: (builder: SourceBuilder) => void): string {
    const builder = this.createSourceBuilder(ctx);
    action(builder);
    return builder.toString();
  }

  protected createSourceBuilder(ctx: TypeScriptModelGeneratorContext): SourceBuilder {
    return new SourceBuilder({
      charsTreatedAsEmptyLine: ['{'],
      indent: ctx.config.indent,
      newLine: ctx.config.newLine,
    });
  }

  protected shouldGenerateTypeDeclaration(ctx: TypeScriptModelGeneratorContext, schema: ApiSchema): boolean {
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

  protected getTypeName(ctx: TypeScriptModelGeneratorContext, schema: ApiSchema): string {
    if (!this.shouldGenerateTypeDeclaration(ctx, schema)) {
      return this.buildSource(ctx, (builder) => this.generateModel(ctx, schema, builder));
    }

    const typeName = this.getDeclarationTypeName(ctx, schema);
    const modulePath = ctx.currentFilePath
      ? getModulePathRelativeToFile(
          ctx.currentFilePath,
          this.getModelFilePath(ctx, schema),
          ctx.config.importModuleTransformer
        )
      : '';

    ctx.currentImports.addImport(typeName, modulePath);
    return typeName;
  }

  protected getDeclarationTypeName(_: TypeScriptModelGeneratorContext, schema: ApiSchema): string {
    return toCasing(schema.name, this.config.typeNameCasing);
  }

  protected getModelFilePath(ctx: TypeScriptModelGeneratorContext, schema: ApiSchema): string {
    return resolve(
      ctx.config.outputDir,
      this.config.modelsDirPath,
      `${toCasing(schema.name, this.config.fileNameCasing)}.ts`
    );
  }

  protected getIndexFilePath(ctx: TypeScriptModelGeneratorContext): string {
    return resolve(ctx.config.outputDir, this.config.indexFilePath ?? 'models.ts');
  }

  protected getAnyType(ctx: TypeScriptModelGeneratorContext): string {
    return ctx.config.preferUnknown ? 'unknown' : 'any';
  }

  protected generateModelFileContent(ctx: TypeScriptModelGeneratorContext, schema: ApiSchema): string {
    const builder = this.createSourceBuilder(ctx);
    this.generateModelTypePrefix(ctx, schema, builder);
    this.generateModel(ctx, (ctx.state.get('resolvedSchema') as ApiSchema<'object'>) ?? schema, builder);
    this.generateModelTypeSuffix(ctx, schema, builder);

    if (ctx.currentImports.hasImports) {
      return ctx.currentImports.toString(ctx.config.newLine) + ctx.config.newLine + builder.toString();
    }

    builder.ensureCurrentLineEmpty();
    return builder.toString();
  }

  protected generateModelTypePrefix(ctx: TypeScriptModelGeneratorContext, schema: ApiSchema, builder: SourceBuilder) {
    let generateInterface = false;
    if (ctx.config.typeDeclaration === 'prefer-interface' && (schema.kind === 'object' || schema.kind === 'combined')) {
      const resolvedSchema = resolveAnyOfAndAllOf(schema, true);
      if (resolvedSchema) {
        resolvedSchema.additionalProperties = undefined;
        ctx.state.set('resolvedSchema', resolvedSchema);
        generateInterface = true;
      }
    }

    if (generateInterface) {
      builder.append('export interface ').append(this.getDeclarationTypeName(ctx, schema)).append(' ');
    } else if (
      ctx.config.enumGeneration !== 'union' &&
      schema.kind === 'string' &&
      schema.enum !== undefined &&
      schema.enum.length > 0
    ) {
      builder.append('export enum ').append(this.getDeclarationTypeName(ctx, schema)).append(' ');
    } else {
      builder.append('export type ').append(this.getDeclarationTypeName(ctx, schema)).append(' = ');
    }
  }

  protected generateModelTypeSuffix(ctx: TypeScriptModelGeneratorContext, _: ApiSchema, builder: SourceBuilder) {
    if (!ctx.state.has('resolvedSchema')) {
      builder.append(';');
    }
  }

  protected generateModel(ctx: TypeScriptModelGeneratorContext, schema: ApiSchema, builder: SourceBuilder): void {
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
          this.generateEnumModel(ctx, schema as ApiSchema<'string'>, builder);
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
        this.generateArrayModel(ctx, schema as ApiSchema<'array'>, builder);
        break;
      case 'object':
        this.generateObjectModel(ctx, schema as ApiSchema<'object'>, builder);
        break;
      case 'combined':
        this.generateCombinedModel(ctx, schema as ApiSchema<'combined'>, builder);
        break;
      case 'multi-type':
        this.generateMultiTypeModel(ctx, schema as ApiSchema<'multi-type'>, builder);
        break;
      case 'oneOf':
        this.generateOneOfModel(ctx, schema as ApiSchema<'oneOf'>, builder);
        break;
      default:
        builder.append(this.getAnyType(ctx));
        break;
    }
  }

  protected generateArrayModel(
    ctx: TypeScriptModelGeneratorContext,
    schema: ArrayLikeApiSchema,
    builder: SourceBuilder
  ): void {
    builder
      .append(ctx.config.immutableTypes ? 'ReadonlyArray' : 'Array')
      .parenthesize('<>', (builder) =>
        builder.append(schema.items ? this.getTypeName(ctx, schema.items) : this.getAnyType(ctx))
      );
  }

  protected generateCombinedModel(
    ctx: TypeScriptModelGeneratorContext,
    schema: CombinedLikeApiSchema,
    builder: SourceBuilder
  ): void {
    if (schema.allOf.length === 0 && schema.anyOf.length === 0) {
      builder.append(this.getAnyType(ctx));
      return;
    }

    this.generateConcatenatedModel(ctx, schema.allOf, builder, '&', false);

    if (schema.anyOf.length > 0) {
      if (schema.allOf.length > 0) {
        builder.append(' & ');
      }
      this.generateConcatenatedModel(ctx, schema.anyOf, builder, '&', false, (typeName) => `Partial<${typeName}>`);
    }
  }

  protected generateOneOfModel(
    ctx: TypeScriptModelGeneratorContext,
    schema: ApiSchema<'oneOf'>,
    builder: SourceBuilder
  ): void {
    if (schema.oneOf.length === 0) {
      builder.append(this.getAnyType(ctx));
      return;
    }

    this.generateConcatenatedModel(ctx, schema.oneOf, builder, '|', true);
  }

  protected generateMultiTypeModel(
    ctx: TypeScriptModelGeneratorContext,
    schema: ApiSchema<'multi-type'>,
    builder: SourceBuilder
  ): void {
    if (schema.type.length === 0) {
      builder.append(this.getAnyType(ctx));
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
                this.generateArrayModel(ctx, schema, builder);
                break;
              case 'object':
                this.generateObjectModel(ctx, schema, builder);
                break;
              default:
                builder.append('never');
                break;
            }
          }
        )
    );
  }

  protected generateObjectModel(
    ctx: TypeScriptModelGeneratorContext,
    schema: ObjectLikeApiSchema,
    builder: SourceBuilder
  ): void {
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
          builder.appendLine().forEach(schema.properties.values(), (builder, property) =>
            builder
              .appendIf(ctx.config.immutableTypes, 'readonly ')
              .append(toTypeScriptPropertyName(property.name, ctx.config.useSingleQuotes))
              .appendIf(!schema.required.has(property.name), '?')
              .append(': ')
              .append(this.getTypeName(ctx, property.schema))
              .appendIf(property.schema.nullable === true, ' | null')
              .appendLine(';')
          )
        )
        .appendIf(!!schema.additionalProperties || schema.allOf.length > 0 || schema.anyOf.length > 0, ' & ');
    }

    // additional properties
    if (schema.additionalProperties) {
      builder
        .appendIf(ctx.config.immutableTypes, 'Readonly<')
        .append('Record<string, ')
        .append(schema.additionalProperties === true ? 'unknown' : this.getTypeName(ctx, schema.additionalProperties))
        .append('>')
        .appendIf(ctx.config.immutableTypes, '>');

      if (schema.allOf.length > 0 || schema.anyOf.length > 0) {
        builder.append(' & ');
      }
    }

    // allOf & anyOf
    if (schema.allOf.length > 0 || schema.anyOf.length > 0) {
      this.generateCombinedModel(ctx, schema, builder);
    }
  }

  protected generateConcatenatedModel(
    ctx: TypeScriptModelGeneratorContext,
    schemas: ApiSchema[],
    builder: SourceBuilder,
    separator: string,
    putInParentheses: boolean,
    typeTemplate?: (typeName: string) => string
  ): void {
    putInParentheses &&= schemas.length > 1;
    builder.parenthesizeIf(putInParentheses, '()', (builder) =>
      builder.forEachSeparated(schemas, ` ${separator} `, (builder, schema) => {
        const typeName = this.getTypeName(ctx, schema);
        builder.append(typeTemplate ? typeTemplate(typeName) : typeName);
      })
    );
  }

  protected generateEnumModel(
    ctx: TypeScriptModelGeneratorContext,
    schema: ApiSchema<'string'>,
    builder: SourceBuilder
  ): void {
    const stringEnum = (schema.enum?.filter((item) => typeof item === 'string') ?? []) as string[];
    if (ctx.config.enumGeneration === 'union') {
      builder.indent((builder) => {
        builder.forEachSeparated(stringEnum, ' | ', (builder, item) =>
          builder.append(toTypeScriptStringLiteral(item, ctx.config.useSingleQuotes))
        );
      });
    } else if (ctx.config.enumGeneration === 'number-enum') {
      builder.parenthesize('{}', (builder) =>
        builder
          .appendLine()
          .forEach(stringEnum, (builder, item, index) => builder.appendLine(`${toPascalCase(item)} = ${index},`))
      );
    } else {
      builder.parenthesize('{}', (builder) =>
        builder
          .appendLine()
          .forEach(stringEnum, (builder, item) =>
            builder.appendLine(
              `${toPascalCase(item)} = ${toTypeScriptStringLiteral(item, ctx.config.useSingleQuotes)},`
            )
          )
      );
    }
  }

  protected shouldGenerateIndexFile(ctx: TypeScriptModelGeneratorContext): boolean {
    return ctx.config.indexFilePath !== null;
  }

  protected generateIndexFileContent(ctx: TypeScriptModelGeneratorContext): string {
    const exports = new ImportExportCollection();
    const absoluteIndexFilePath = this.getIndexFilePath(ctx);

    for (const modelId in ctx.currentResult.models) {
      const model = ctx.currentResult.models[modelId];
      if (!model.filePath) continue;
      exports.addExport(
        model.typeName,
        getModulePathRelativeToFile(absoluteIndexFilePath, model.filePath, ctx.config.importModuleTransformer)
      );
    }

    return exports.toString(ctx.config.newLine);
  }
}
