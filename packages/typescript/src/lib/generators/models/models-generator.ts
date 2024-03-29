import { dirname, resolve } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import { ApiSchema, OpenApiGeneratorContext, OpenApiSchemasGenerationProviderBase, Factory } from '@goast/core';

import { DefaultTypeScriptModelGenerator, TypeScriptModelGenerator } from './model-generator';
import {
  TypeScriptModelGeneratorOutput,
  TypeScriptModelsGeneratorConfig,
  TypeScriptModelsGeneratorContext,
  TypeScriptModelsGeneratorInput,
  TypeScriptModelsGeneratorOutput,
  defaultTypeScriptModelsGeneratorConfig,
} from './models';
import { TypeScriptFileBuilder } from '../../file-builder';
import { ImportExportCollection } from '../../import-collection';

type Input = TypeScriptModelsGeneratorInput;
type Output = TypeScriptModelsGeneratorOutput;
type Config = TypeScriptModelsGeneratorConfig;
type SchemaOutput = TypeScriptModelGeneratorOutput;
type Context = TypeScriptModelsGeneratorContext;

export class TypeScriptModelsGenerator extends OpenApiSchemasGenerationProviderBase<
  Input,
  Output,
  Config,
  SchemaOutput,
  Context
> {
  private readonly _modelGeneratorFactory: Factory<TypeScriptModelGenerator, []>;

  constructor(modelGeneratorFactory?: Factory<TypeScriptModelGenerator, []>) {
    super();
    this._modelGeneratorFactory = modelGeneratorFactory ?? Factory.fromValue(new DefaultTypeScriptModelGenerator());
  }

  protected override initResult(): Output {
    return {
      models: {},
      modelIndexFilePath: undefined,
    };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<TypeScriptModelsGeneratorInput>,
    config?: Partial<Config> | undefined
  ): Context {
    return this.getProviderContext(context, config, defaultTypeScriptModelsGeneratorConfig);
  }

  public override onGenerate(ctx: Context): Output {
    const output = super.onGenerate(ctx);
    output.modelIndexFilePath = this.generateIndexFile(ctx);
    return output;
  }

  protected override generateSchema(ctx: Context, schema: ApiSchema): SchemaOutput {
    const modelGenerator = this._modelGeneratorFactory.create();
    return modelGenerator.generate({
      ...ctx,
      schema,
    });
  }

  protected override addSchemaResult(ctx: Context, schema: ApiSchema, result: SchemaOutput): void {
    ctx.output.models[schema.id] = result;
  }

  protected generateIndexFile(ctx: Context): string | undefined {
    if (!this.shouldGenerateIndexFile(ctx)) {
      return undefined;
    }

    const filePath = this.getIndexFilePath(ctx);
    console.log(`Generating model index file to ${filePath}...`);
    ensureDirSync(dirname(filePath));

    const builder = new TypeScriptFileBuilder(filePath, ctx.config);
    this.generateIndexFileContent(ctx, builder);
    writeFileSync(filePath, builder.toString());

    return filePath;
  }

  protected getIndexFilePath(ctx: Context): string {
    return resolve(ctx.config.outputDir, ctx.config.indexFilePath ?? 'models.ts');
  }

  protected shouldGenerateIndexFile(ctx: Context): boolean {
    return ctx.config.indexFilePath !== null;
  }

  protected generateIndexFileContent(ctx: Context, builder: TypeScriptFileBuilder) {
    const exports = new ImportExportCollection();

    for (const modelId in ctx.output.models) {
      const model = ctx.output.models[modelId];
      if (model.filePath) {
        exports.addExport(model.component, model.filePath);
      }
    }

    exports.writeTo(builder);
  }
}
