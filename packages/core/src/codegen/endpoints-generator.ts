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

export type OpenApiEndpointsGenerationProviderContext<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TEndpointOutput extends OpenApiGeneratorOutput,
> = OpenApiGenerationProviderContext<TInput, TConfig> & {
  existingEndpointResults: Map<string, TEndpointOutput>;
  output: TOutput;
};

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

  // deno-lint-ignore no-unused-vars
  protected generateAdditionalFiles(ctx: TContext): MaybePromise<void> {
    // Override if needed
  }
}
