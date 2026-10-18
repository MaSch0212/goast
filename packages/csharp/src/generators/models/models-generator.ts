import {
  type ApiSchema,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiSchemasGenerationProviderBase,
} from '@goast/core';

import { type CSharpModelGenerator, DefaultCSharpModelGenerator } from './model-generator.ts';
import {
  defaultCSharpModelsGeneratorConfig,
  type CSharpModelGeneratorOutput,
  type CSharpModelsGeneratorConfig,
  type CSharpModelsGeneratorContext,
  type CSharpModelsGeneratorInput,
  type CSharpModelsGeneratorOutput,
} from './models.ts';

type Input = CSharpModelsGeneratorInput;
type Output = CSharpModelsGeneratorOutput;
type Config = CSharpModelsGeneratorConfig;
type SchemaOutput = CSharpModelGeneratorOutput;
type Context = CSharpModelsGeneratorContext;

export class CSharpModelsGenerator extends OpenApiSchemasGenerationProviderBase<
  Input,
  Output,
  Config,
  SchemaOutput,
  Context
> {
  private readonly _modelGeneratorFactory: Factory<CSharpModelGenerator, []>;

  constructor(modelGeneratorFactory?: Factory<CSharpModelGenerator, []>) {
    super();
    this._modelGeneratorFactory = modelGeneratorFactory ?? Factory.fromValue(new DefaultCSharpModelGenerator());
  }

  protected override initResult(): Output {
    return {
      csharp: {
        models: {},
      },
    };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<CSharpModelsGeneratorInput>,
    config?: Partial<Config> | undefined,
  ): Context {
    return this.getProviderContext(context, config, defaultCSharpModelsGeneratorConfig);
  }

  protected override generateSchema(ctx: Context, schema: ApiSchema): MaybePromise<SchemaOutput> {
    const modelGenerator = this._modelGeneratorFactory.create();
    return modelGenerator.generate({
      ...ctx,
      schema,
    });
  }

  protected override addSchemaResult(ctx: Context, schema: ApiSchema, result: SchemaOutput): void {
    ctx.output.csharp.models[schema.id] = result;
  }
}
