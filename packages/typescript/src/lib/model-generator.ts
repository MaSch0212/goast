import { dirname, join, relative, resolve } from 'path';

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
  mergeSchemaProperties,
  toCasing,
  toPascalCase,
} from '@goast/core/utils';

import { ImportCollection } from './import-collection.js';

export type TypeScriptModelsGeneratorResult = {
  models: {
    [schemaId: string]: {
      typeName: string;
      filePath: string | undefined;
    };
  };
};
export type TypeScriptModelsGeneratorConfig = Readonly<{
  preferUnknown: boolean;
  enumGeneration: 'union' | 'number-enum' | 'string-enum';
  modelsPath: string;
  fileNameCasing: StringCasing | StringCasingWithOptions;
  typeNameCasing: StringCasing | StringCasingWithOptions;
  typeDeclaration: 'type' | 'prefer-interface';
  immutableTypes: boolean;
  importModuleTransformer: 'omit-extension' | 'js-extension' | ((module: string) => string);
}>;

const defaultConfig: TypeScriptModelsGeneratorConfig = {
  preferUnknown: true,
  enumGeneration: 'union',
  modelsPath: 'models',
  fileNameCasing: { casing: 'kebab', suffix: '.model' },
  typeNameCasing: 'pascal',
  typeDeclaration: 'type',
  immutableTypes: false,
  importModuleTransformer: 'omit-extension',
};

export type TypeScriptModelGeneratorContext = CodeGeneratorContext<
  Record<string, unknown>,
  TypeScriptModelsGeneratorConfig
> & {
  currentImports: ImportCollection;
  currentFilePath?: string;
};

export class TypeScriptModelsGenerator
  implements
    CodeGenerator<
      Record<string, unknown>,
      TypeScriptModelsGeneratorResult,
      TypeScriptModelsGeneratorConfig
    >
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
    const result: TypeScriptModelsGeneratorResult = { models: {} };
    const ctx: TypeScriptModelGeneratorContext = {
      ...context,
      currentImports: new ImportCollection(),
    };

    for (const schema of ctx.data.schemas) {
      ctx.currentImports.clear();
      ctx.currentFilePath = undefined;
      ctx.state.clear();

      if (this.isExistingType(ctx, schema)) {
        const typeName = this.build(ctx, (builder) => this.generateModel(ctx, schema, builder));
        if (typeName) {
          result.models[schema.id] = { typeName, filePath: undefined };
        }
      } else {
        const typeName = this.getDeclarationTypeName(ctx, schema);
        const filePath = this.getFilePath(ctx, schema);
        console.log(`Generating model ${typeName} to ${filePath}...`);
        await fs.ensureDir(dirname(filePath));

        ctx.currentFilePath = filePath;

        await fs.writeFile(filePath, this.generateFileContent(ctx, schema));

        result.models[schema.id] = { typeName, filePath };
      }
    }

    return result;
  }

  protected build(
    ctx: TypeScriptModelGeneratorContext,
    action: (builder: SourceBuilder) => void
  ): string {
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

  protected isExistingType(_: TypeScriptModelGeneratorContext, schema: ApiSchema): boolean {
    return (
      schema.kind !== 'array' &&
      schema.kind !== 'combined' &&
      schema.kind !== 'multi-type' &&
      schema.kind !== 'object' &&
      schema.kind !== 'oneOf' &&
      !(schema.kind === 'string' && schema.enum !== undefined && schema.enum.length > 0) &&
      schema.isNameGenerated
    );
  }

  protected getTypeName(ctx: TypeScriptModelGeneratorContext, schema: ApiSchema): string {
    if (this.isExistingType(ctx, schema)) {
      return this.build(ctx, (builder) => this.generateModel(ctx, schema, builder));
    }

    const typeName = this.getDeclarationTypeName(ctx, schema);
    let relativePath = ctx.currentFilePath
      ? relative(dirname(ctx.currentFilePath), this.getFilePath(ctx, schema)).replace('\\', '/')
      : '';
    if (!relativePath.startsWith('.')) {
      relativePath = `./${relativePath}`;
    }

    if (ctx.config.importModuleTransformer === 'omit-extension') {
      relativePath = relativePath.replace(/\.[^/.]+$/, '');
    } else if (ctx.config.importModuleTransformer === 'js-extension') {
      relativePath = relativePath.replace(/\.[^/.]+$/, '.js');
    } else if (typeof ctx.config.importModuleTransformer === 'function') {
      relativePath = ctx.config.importModuleTransformer(relativePath);
    }

    ctx.currentImports.addImport(typeName, relativePath);
    return typeName;
  }

  protected getDeclarationTypeName(_: TypeScriptModelGeneratorContext, schema: ApiSchema): string {
    return toCasing(schema.name, this.config.typeNameCasing);
  }

  protected getFilePath(ctx: TypeScriptModelGeneratorContext, schema: ApiSchema): string {
    return resolve(
      join(
        ctx.config.outputDir,
        this.config.modelsPath,
        `${toCasing(schema.name, this.config.fileNameCasing)}.ts`
      )
    );
  }

  protected getAnyType(ctx: TypeScriptModelGeneratorContext): string {
    return ctx.config.preferUnknown ? 'unknown' : 'any';
  }

  protected generateFileContent(ctx: TypeScriptModelGeneratorContext, schema: ApiSchema): string {
    const builder = this.createSourceBuilder(ctx);
    this.generateTypePrefix(ctx, schema, builder);
    this.generateModel(
      ctx,
      (ctx.state.get('mergedSchema') as ApiSchema<'object'>) ?? schema,
      builder
    );
    this.generateTypeSuffix(ctx, schema, builder);

    if (ctx.currentImports.hasImports) {
      return (
        ctx.currentImports.toString(ctx.config.newLine) + ctx.config.newLine + builder.toString()
      );
    }
    return builder.toString();
  }

  protected generateTypePrefix(
    ctx: TypeScriptModelGeneratorContext,
    schema: ApiSchema,
    builder: SourceBuilder
  ) {
    let generateInterface = false;
    if (
      ctx.config.typeDeclaration === 'prefer-interface' &&
      (schema.kind === 'object' || schema.kind === 'combined')
    ) {
      const mergedSchema = mergeSchemaProperties(schema, true);
      if (mergedSchema) {
        mergedSchema.additionalProperties = undefined;
        ctx.state.set('mergedSchema', mergedSchema);
        generateInterface = true;
      }
    }

    if (generateInterface) {
      builder
        .append('export interface ')
        .append(this.getDeclarationTypeName(ctx, schema))
        .append(' ');
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

  protected generateTypeSuffix(
    ctx: TypeScriptModelGeneratorContext,
    schema: ApiSchema,
    builder: SourceBuilder
  ) {
    if (!ctx.state.has('mergedSchema')) {
      builder.append(';');
    }
  }

  protected generateModel(
    ctx: TypeScriptModelGeneratorContext,
    schema: ApiSchema,
    builder: SourceBuilder
  ): void {
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
    builder.append(ctx.config.immutableTypes ? 'ReadonlyArray' : 'Array').append('<');

    if (schema.items) {
      builder.append(this.getTypeName(ctx, schema.items));
    } else {
      builder.append(this.getAnyType(ctx));
    }

    builder.append('>');
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

    builder.indent((builder) => {
      this.generateConcatenatedModel(ctx, schema.allOf, builder, '&', false);

      if (schema.anyOf.length > 0) {
        if (schema.allOf.length > 0) {
          builder.appendLine().append('& ');
        }
        this.generateConcatenatedModel(
          ctx,
          schema.anyOf,
          builder,
          '&',
          false,
          (typeName) => `Partial<${typeName}>`
        );
      }
    });
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

    builder.indent((builder) => {
      this.generateConcatenatedModel(ctx, schema.oneOf, builder, '|', true);
    });
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

    this.generateInParentheses(
      builder,
      (builder) => {
        for (const [index, type] of schema.type.entries()) {
          if (index > 0) {
            builder.appendLine().append('| ');
          }

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
      },
      schema.type.length > 1,
      '| '
    );
  }

  protected generateObjectModel(
    ctx: TypeScriptModelGeneratorContext,
    schema: ObjectLikeApiSchema,
    builder: SourceBuilder
  ): void {
    if (
      schema.properties.length === 0 &&
      !schema.additionalProperties &&
      schema.allOf.length === 0 &&
      schema.anyOf.length === 0
    ) {
      builder.append('{ }');
      return;
    }

    // properties
    if (schema.properties.length > 0) {
      builder
        .indent((builder) => {
          builder.appendLine('{');
          for (const property of schema.properties) {
            if (ctx.config.immutableTypes) {
              builder.append('readonly ');
            }
            builder.append(property.name);
            if (property.required) {
              builder.append('?');
            }
            builder.append(': ').append(this.getTypeName(ctx, property.schema)).appendLine(';');
          }
        })
        .append('}');

      if (schema.additionalProperties || schema.allOf.length > 0 || schema.anyOf.length > 0) {
        builder.append(' & ');
      }
    }

    // additional properties
    if (schema.additionalProperties) {
      if (schema.additionalProperties === true) {
        builder.append(
          ctx.config.immutableTypes
            ? 'Readonly<Record<string, unknown>>'
            : 'Record<string, unknown>'
        );
      } else {
        builder.append(this.getTypeName(ctx, schema.additionalProperties));
      }

      if (schema.allOf.length > 0 || schema.anyOf.length > 0) {
        builder.appendLine().append('& ');
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
    this.generateInParentheses(
      builder,
      (builder) => {
        for (const [index, schema] of schemas.entries()) {
          if (index > 0) {
            builder.appendLine().append(separator).append(' ');
          }
          const typeName = this.getTypeName(ctx, schema);
          builder.append(typeTemplate ? typeTemplate(typeName) : typeName);
        }
      },
      putInParentheses && schemas.length > 1,
      '| '
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
        for (const [index, item] of stringEnum.entries()) {
          if (index > 0) {
            builder.appendLine().append('| ');
          }
          builder.append(`'${item}'`);
        }
      });
    } else if (ctx.config.enumGeneration === 'number-enum') {
      builder.appendLine('{');
      builder.indent((builder) => {
        for (const [index, item] of stringEnum.entries()) {
          builder.appendLine(`${item} = ${index},`);
        }
      });
      builder.append('}');
    } else {
      builder.appendLine('{');
      builder.indent((builder) => {
        for (const item of stringEnum) {
          builder.appendLine(`${toPascalCase(item)} = '${item}',`);
        }
      });
      builder.append('}');
    }
  }

  private generateInParentheses(
    builder: SourceBuilder,
    action: (builder: SourceBuilder) => void,
    putInParentheses: boolean,
    firstLinebreakContent: string
  ): void {
    if (putInParentheses) {
      builder.currentIndentLevel++;
      builder.appendLine('(').append(firstLinebreakContent);
    }
    action(builder);
    if (putInParentheses) {
      builder.currentIndentLevel--;
      builder.appendLine().append(')');
    }
  }
}
