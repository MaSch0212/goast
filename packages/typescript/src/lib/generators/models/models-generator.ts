import { resolve } from 'path';

import {
  ApiSchema,
  OpenApiGeneratorContext,
  OpenApiSchemasGenerationProviderBase,
  Factory,
  AppendValueGroup,
  appendValueGroup,
} from '@goast/core';

import { DefaultTypeScriptModelGenerator, TypeScriptModelGenerator } from './model-generator';
import {
  TypeScriptModelGeneratorOutput,
  TypeScriptModelsGeneratorConfig,
  TypeScriptModelsGeneratorContext,
  TypeScriptModelsGeneratorInput,
  TypeScriptModelsGeneratorOutput,
  defaultTypeScriptModelsGeneratorConfig,
} from './models';
import { ts } from '../../ast';
import { TypeScriptFileBuilder } from '../../file-builder';

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
      typescript: {
        models: {},
        indexFiles: { models: undefined },
      },
    };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<TypeScriptModelsGeneratorInput>,
    config?: Partial<Config> | undefined,
  ): Context {
    return this.getProviderContext(context, config, defaultTypeScriptModelsGeneratorConfig);
  }

  public override onGenerate(ctx: Context): Output {
    const output = super.onGenerate(ctx);
    output.typescript.indexFiles.models = this.generateIndexFile(ctx);
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
    ctx.output.typescript.models[schema.id] = result;
  }

  protected generateIndexFile(ctx: Context): string | null {
    const filePath = this.getIndexFilePath(ctx);
    TypeScriptFileBuilder.tryGenerate({
      logName: 'model index file',
      filePath,
      options: ctx.config,
      generator: (b) => b.append(this.getIndexFileContent(ctx)),
    });
    return filePath;
  }

  protected getIndexFilePath(ctx: Context): string | null {
    return ctx.config.modelsIndexFile ? resolve(ctx.config.outputDir, ctx.config.modelsIndexFile) : null;
  }

  protected getIndexFileContent(ctx: Context): AppendValueGroup<TypeScriptFileBuilder> {
    return appendValueGroup(
      Object.values(ctx.output.typescript.models).flatMap((x) => {
        const { filePath } = x;
        if (!filePath) return [];
        return [
          ts.export(x.component, filePath, {
            kind: x.kind === 'type' || x.kind === 'interface' ? 'type-export' : 'export',
          }),
          ...(x.additionalExports?.map((e) =>
            typeof e === 'string' ? ts.export(e, filePath) : ts.export(e.name, filePath, { kind: e.type }),
          ) ?? []),
        ];
      }),
    );
  }
}
