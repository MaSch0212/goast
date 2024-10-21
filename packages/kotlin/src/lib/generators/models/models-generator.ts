import {
  type ApiSchema,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiSchemasGenerationProviderBase,
} from '@goast/core';

import { DefaultKotlinModelGenerator, type KotlinModelGenerator } from './model-generator.ts';
import {
  defaultKotlinModelsGeneratorConfig,
  type KotlinModelGeneratorOutput,
  type KotlinModelsGeneratorConfig,
  type KotlinModelsGeneratorContext,
  type KotlinModelsGeneratorInput,
  type KotlinModelsGeneratorOutput,
} from './models.ts';

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
      kotlin: {
        models: {},
      },
    };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<KotlinModelsGeneratorInput>,
    config?: Partial<Config> | undefined,
  ): Context {
    return this.getProviderContext(context, config, defaultKotlinModelsGeneratorConfig);
  }

  protected override generateSchema(ctx: Context, schema: ApiSchema): MaybePromise<SchemaOutput> {
    const modelGenerator = this._modelGeneratorFactory.create();
    return modelGenerator.generate({
      ...ctx,
      schema,
    });
  }

  protected override addSchemaResult(ctx: Context, schema: ApiSchema, result: SchemaOutput): void {
    ctx.output.kotlin.models[schema.id] = result;
  }
}
