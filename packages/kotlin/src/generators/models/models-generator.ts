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

/**
 * Generates a Kotlin model for each schema of the document and publishes the results under `kotlin.models`.
 *
 * Each schema is passed to the `KotlinModelGenerator` created by the model generator factory. A schema that gets its
 * own declaration is written to `{outputDir}/{packagePath}/{TypeName}.kt`, where `packagePath` is the model package
 * (`packageName` followed by `packageSuffix`) with the dots replaced by slashes. Other schemas get no file.
 * The result of every schema is stored under `kotlin.models`, keyed by the schema ID. No index file is generated.
 * @see KotlinModelsGeneratorConfig
 * @see DefaultKotlinModelGenerator
 */
export class KotlinModelsGenerator extends OpenApiSchemasGenerationProviderBase<
  Input,
  Output,
  Config,
  SchemaOutput,
  Context
> {
  private readonly _modelGeneratorFactory: Factory<KotlinModelGenerator, []>;

  /**
   * Initializes a new instance of the KotlinModelsGenerator class.
   * @param modelGeneratorFactory Creates the generator used for each schema. Defaults to a
   * `DefaultKotlinModelGenerator`.
   */
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
