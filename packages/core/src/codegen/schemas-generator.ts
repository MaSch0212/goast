import type { ApiSchema } from '../transform/api-types.ts';
import { getSchemaReference } from '../utils/schema.utils.ts';
import type { MaybePromise } from '../utils/type.utils.ts';
import { type DefaultGenerationProviderConfig, OpenApiGenerationProviderBase } from './generator.ts';
import { addSourceIfTest } from './internal-utils.ts';
import type {
  AnyConfig,
  OpenApiGenerationProviderContext,
  OpenApiGeneratorContext,
  OpenApiGeneratorInput,
  OpenApiGeneratorOutput,
} from './types.ts';

/**
 * The context that is passed to the methods of `OpenApiSchemasGenerationProviderBase`.
 * @template TInput The type of the merged output of the providers that ran before.
 * @template TOutput The type of the output produced by the provider.
 * @template TConfig The type of the provider-specific configuration.
 * @template TSchemaOutput The type of the result produced for each schema.
 */
export type OpenApiSchemasGenerationProviderContext<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TSchemaOutput extends OpenApiGeneratorOutput,
> = OpenApiGenerationProviderContext<TInput, TConfig> & {
  /**
   * The results that have been generated so far, keyed by the ID of their schema.
   */
  existingSchemaResults: Map<string, TSchemaOutput>;
  /**
   * The output of the provider. It is created by `initResult` and returned after all schemas have been generated.
   */
  output: TOutput;
};

/**
 * Base class for generation providers that produce one result per schema.
 * Results are cached per schema. A schema that is a reference to another schema reuses the result of the referenced
 * schema. Subclasses implement `initResult`, `generateSchema` and `addSchemaResult`, and can override
 * `generateAdditionalFiles` to produce output after all schemas have been processed.
 * @template TInput The type of the merged output of the providers that ran before.
 * @template TOutput The type of the output produced by the provider.
 * @template TConfig The type of the provider-specific configuration.
 * @template TSchemaOutput The type of the result produced for each schema.
 * @template TContext The type of the context that is passed to the provider methods.
 * @see OpenApiGenerationProviderBase
 */
export abstract class OpenApiSchemasGenerationProviderBase<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TSchemaOutput extends OpenApiGeneratorOutput,
  TContext extends OpenApiSchemasGenerationProviderContext<TInput, TOutput, TConfig, TSchemaOutput>,
> extends OpenApiGenerationProviderBase<TInput, TOutput, TConfig, TContext> {
  protected override getProviderContext(
    context: OpenApiGeneratorContext<TInput>,
    config: Partial<TConfig> | undefined,
    defaultConfig: DefaultGenerationProviderConfig<TConfig>,
  ): OpenApiSchemasGenerationProviderContext<TInput, TOutput, TConfig, TSchemaOutput> {
    const ctx = super.getProviderContext(context, config, defaultConfig);
    return Object.assign(ctx, {
      existingSchemaResults: new Map<string, TSchemaOutput>(),
      output: this.initResult(ctx),
    });
  }

  protected override async onGenerate(ctx: TContext): Promise<TOutput> {
    for (const schema of ctx.data.schemas) {
      await this.getSchemaResult(ctx, schema);
    }

    await this.generateAdditionalFiles(ctx);

    return ctx.output;
  }

  /**
   * Gets the result for a schema. The result is generated on the first call and returned from the cache afterwards.
   * If the schema is a reference to another schema, the result of the referenced schema is used.
   * In test mode, the source location of the schema is stored in the result.
   * @param ctx The context of the provider.
   * @param schema The schema to get the result for.
   * @returns The result for the schema.
   */
  public async getSchemaResult(ctx: TContext, schema: ApiSchema): Promise<TSchemaOutput> {
    const existingResult = ctx.existingSchemaResults.get(schema.id);
    if (existingResult) return existingResult;

    let result: TSchemaOutput;
    const reference = this.getSchemaReference(ctx, schema);
    if (reference) {
      result = await this.getSchemaResult(ctx, reference);
    } else {
      result = await this.generateSchema(ctx, schema);
    }

    addSourceIfTest(ctx.config, result, () => `${schema.$src.file}#${schema.$src.path}`);
    ctx.existingSchemaResults.set(schema.id, result);
    this.addSchemaResult(ctx, schema, result);
    return result;
  }

  protected getSchemaReference(ctx: TContext, schema: ApiSchema): ApiSchema | undefined {
    const ref = getSchemaReference(schema, ['description']);
    return ref.id !== schema.id ? ref : undefined;
  }

  protected abstract initResult(ctx: OpenApiGenerationProviderContext<TInput, TConfig>): TOutput;

  protected abstract generateSchema(ctx: TContext, schema: ApiSchema): MaybePromise<TSchemaOutput>;

  protected abstract addSchemaResult(ctx: TContext, schema: ApiSchema, result: TSchemaOutput): void;

  // oxlint-disable-next-line no-unused-vars
  protected generateAdditionalFiles(ctx: TContext): MaybePromise<void> {
    // Override if needed
  }
}
