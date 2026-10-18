import type { ApiEndpoint } from '../transform/api-types.ts';
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
 * The context that is passed to the methods of `OpenApiEndpointsGenerationProviderBase`.
 * @template TInput The type of the merged output of the providers that ran before.
 * @template TOutput The type of the output produced by the provider.
 * @template TConfig The type of the provider-specific configuration.
 * @template TEndpointOutput The type of the result produced for each endpoint.
 */
export type OpenApiEndpointsGenerationProviderContext<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TEndpointOutput extends OpenApiGeneratorOutput,
> = OpenApiGenerationProviderContext<TInput, TConfig> & {
  /**
   * The results that have been generated so far, keyed by the ID of their endpoint.
   */
  existingEndpointResults: Map<string, TEndpointOutput>;
  /**
   * The output of the provider. It is created by `initResult` and returned after all endpoints have been generated.
   */
  output: TOutput;
};

/**
 * Base class for generation providers that produce one result per API endpoint.
 * Results are cached per endpoint, so each endpoint is generated only once. Subclasses implement `initResult`,
 * `generateEndpoint` and `addEndpointResult`, and can override `generateAdditionalFiles` to produce output after all
 * endpoints have been processed.
 * @template TInput The type of the merged output of the providers that ran before.
 * @template TOutput The type of the output produced by the provider.
 * @template TConfig The type of the provider-specific configuration.
 * @template TEndpointOutput The type of the result produced for each endpoint.
 * @template TContext The type of the context that is passed to the provider methods.
 * @see OpenApiGenerationProviderBase
 */
export abstract class OpenApiEndpointsGenerationProviderBase<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TEndpointOutput extends OpenApiGeneratorOutput,
  TContext extends OpenApiEndpointsGenerationProviderContext<TInput, TOutput, TConfig, TEndpointOutput>,
> extends OpenApiGenerationProviderBase<TInput, TOutput, TConfig, TContext> {
  protected override getProviderContext(
    context: OpenApiGeneratorContext<TInput>,
    config: Partial<TConfig> | undefined,
    defaultConfig: DefaultGenerationProviderConfig<TConfig>,
  ): OpenApiEndpointsGenerationProviderContext<TInput, TOutput, TConfig, TEndpointOutput> {
    const ctx = super.getProviderContext(context, config, defaultConfig);
    return Object.assign(ctx, {
      existingEndpointResults: new Map<string, TEndpointOutput>(),
      output: this.initResult(ctx),
    });
  }

  protected override async onGenerate(ctx: TContext): Promise<TOutput> {
    for (const endpoint of ctx.data.endpoints) {
      await this.getEndpointResult(ctx, endpoint);
    }

    await this.generateAdditionalFiles(ctx);

    return ctx.output;
  }

  /**
   * Gets the result for an endpoint. The result is generated on the first call and returned from the cache afterwards.
   * In test mode, the source location of the endpoint is stored in the result.
   * @param ctx The context of the provider.
   * @param endpoint The endpoint to get the result for.
   * @returns The result for the endpoint.
   */
  public async getEndpointResult(ctx: TContext, endpoint: ApiEndpoint): Promise<TEndpointOutput> {
    const existingResult = ctx.existingEndpointResults.get(endpoint.id);
    if (existingResult) return existingResult;

    const result = await this.generateEndpoint(ctx, endpoint);
    addSourceIfTest(ctx.config, result, () => `${endpoint.$src.file}#${endpoint.$src.path}`);
    this.addEndpointResult(ctx, endpoint, result);
    return result;
  }

  protected abstract initResult(ctx: OpenApiGenerationProviderContext<TInput, TConfig>): TOutput;

  protected abstract generateEndpoint(ctx: TContext, endpoint: ApiEndpoint): Promise<TEndpointOutput>;

  protected abstract addEndpointResult(ctx: TContext, endpoint: ApiEndpoint, result: TEndpointOutput): void;

  // oxlint-disable-next-line no-unused-vars
  protected generateAdditionalFiles(ctx: TContext): MaybePromise<void> {
    // Override if needed
  }
}
