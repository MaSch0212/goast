import { ApiSchema, Factory, OpenApiGeneratorContext, OpenApiSchemasGenerationProviderBase } from '@goast/core';

import { DefaultKotlinModelGenerator, KotlinModelGenerator } from './model-generator';
import {
  KotlinModelsGeneratorInput,
  KotlinModelsGeneratorOutput,
  KotlinModelsGeneratorConfig,
  KotlinModelGeneratorOutput,
  KotlinModelsGeneratorContext,
  defaultKotlinModelsGeneratorConfig,
} from './models';

type Input = KotlinModelsGeneratorInput;
type Output = KotlinModelsGeneratorOutput;
type Config = KotlinModelsGeneratorConfig;
type SchemaOutput = KotlinModelGeneratorOutput;
type Context = KotlinModelsGeneratorContext;

export class KotlinModelsGenerator extends OpenApiSchemasGenerationProviderBase<
  Input,
  Output,
  Config,
  SchemaOutput,
  Context
> {
  private readonly _modelGeneratorFactory: Factory<KotlinModelGenerator, []>;

  constructor(modelGeneratorFactory?: Factory<KotlinModelGenerator, []>) {
    super();
    this._modelGeneratorFactory = modelGeneratorFactory ?? Factory.fromValue(new DefaultKotlinModelGenerator());
  }

  protected override initResult(): Output {
    return {
      models: {},
    };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<KotlinModelsGeneratorInput>,
    config?: Partial<Config> | undefined
  ): Context {
    return this.getProviderContext(context, config, defaultKotlinModelsGeneratorConfig);
  }

  protected override generateSchema(ctx: Context, schema: ApiSchema): SchemaOutput {
    const modelGenerator = this._modelGeneratorFactory.create();
    return modelGenerator.generate({
      ...ctx,
      schema,
      getSchemaResult: (schema) => this.getSchemaResult(ctx, schema),
    });
  }

  protected override addSchemaResult(ctx: Context, schema: ApiSchema, result: SchemaOutput): void {
    ctx.output.models[schema.id] = result;
  }
}
