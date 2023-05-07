import {
  ApiSchema,
  ArrayLikeApiSchema,
  CodeGenerator,
  CodeGeneratorContext,
  CombinedLikeApiSchema,
  ObjectLikeApiSchema,
} from '@goast/core';
import { SourceBuilder, StringCasing, StringCasingWithOptions, toCasing } from '@goast/core/utils';
import fs from 'fs-extra';
import { dirname, join, relative, resolve } from 'path';
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
  useModernModuleResolution: boolean;
}>;

const defaultConfig: TypeScriptModelsGeneratorConfig = {
  preferUnknown: true,
  enumGeneration: 'union',
  modelsPath: 'models',
  fileNameCasing: { casing: 'kebab', suffix: '.model' },
  typeNameCasing: 'pascal',
  typeDeclaration: 'type',
  immutableTypes: false,
  useModernModuleResolution: true,
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
        const builder = this.createSourceBuilder(ctx);
        builder.append('export type ').append(typeName).append(' = ');
        this.generateModel(ctx, schema, builder);
        builder.appendLine(';');

        let modelCode = builder.toString();
        if (ctx.currentImports.hasImports) {
          modelCode =
            ctx.currentImports.toString(ctx.config.newLine) + ctx.config.newLine + modelCode;
        }
        await fs.writeFile(filePath, modelCode);

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
      !schema.isNameGenerated
    );
  }

  protected getTypeName(ctx: TypeScriptModelGeneratorContext, schema: ApiSchema): string {
    if (this.isExistingType(ctx, schema)) {
      return this.build(ctx, (builder) => this.generateModel(ctx, schema, builder));
    }

    const typeName = this.getDeclarationTypeName(ctx, schema);
    let relativePath = relative(
      dirname(ctx.currentFilePath!),
      this.getFilePath(ctx, schema)
    ).replace('\\', '/');
    relativePath = relativePath.replace(/\.ts$/, ctx.config.useModernModuleResolution ? '.js' : '');
    if (!relativePath.startsWith('.')) {
      relativePath = `./${relativePath}`;
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
        builder.append('string');
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

    if (schema.allOf.length + schema.anyOf.length > 1) {
      builder.currentIndentLevel++;
      builder.appendLine().append('| ');
    }

    this.generateConcatenatedModel(ctx, schema.allOf, builder, '&', false);

    if (schema.anyOf.length > 0) {
      if (schema.allOf.length > 0) {
        builder.appendLine().append('& ');
      }
      this.generateConcatenatedModel(ctx, schema.anyOf, builder, '|', true);
    }

    if (schema.allOf.length + schema.anyOf.length > 1) {
      builder.currentIndentLevel--;
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

    if (schema.oneOf.length > 1) {
      builder.currentIndentLevel++;
      builder.appendLine().append('| ');
    }

    this.generateConcatenatedModel(ctx, schema.oneOf, builder, '|', true);

    if (schema.oneOf.length > 1) {
      builder.currentIndentLevel--;
    }
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
      builder.append(
        ctx.config.immutableTypes ? 'Readonly<Record<string, unknown>>' : 'Record<string, unknown>'
      );
      return;
    }

    const isCombinedType =
      (schema.properties.length > 0 ? 1 : 0) +
        (schema.additionalProperties ? 1 : 0) +
        schema.allOf.length +
        schema.anyOf.length >
      1;
    if (isCombinedType) {
      builder.currentIndentLevel++;
      builder.appendLine().append('| ');
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
        builder.appendLine().append('& ');
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

    if (isCombinedType) {
      builder.currentIndentLevel--;
    }
  }

  protected generateConcatenatedModel(
    ctx: TypeScriptModelGeneratorContext,
    schemas: ApiSchema[],
    builder: SourceBuilder,
    separator: string,
    putInParentheses: boolean
  ): void {
    this.generateInParentheses(
      builder,
      (builder) => {
        for (const [index, schema] of schemas.entries()) {
          if (index > 0) {
            builder.appendLine().append(separator).append(' ');
          }
          builder.append(this.getTypeName(ctx, schema));
        }
      },
      putInParentheses && schemas.length > 1,
      '| '
    );
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
