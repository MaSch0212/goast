import { DefaultGenerationProviderConfig, OpenApiGenerationProviderBase } from './generator';
import { addSourceIfTest } from './internal-utils';
import {
  OpenApiGeneratorInput,
  OpenApiGeneratorOutput,
  AnyConfig,
  OpenApiGenerationProviderContext,
  OpenApiGeneratorContext,
} from './types';
import { ApiEndpoint } from '../transform';

export type OpenApiEndpointsGenerationProviderContext<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TEndpointOutput extends OpenApiGeneratorOutput
> = OpenApiGenerationProviderContext<TInput, TConfig> & {
  existingEndpointResults: Map<string, TEndpointOutput>;
  output: TOutput;
};

export abstract class OpenApiEndpointsGenerationProviderBase<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TEndpointOutput extends OpenApiGeneratorOutput,
  TContext extends OpenApiEndpointsGenerationProviderContext<TInput, TOutput, TConfig, TEndpointOutput>
> extends OpenApiGenerationProviderBase<TInput, TOutput, TConfig, TContext> {
  protected override getProviderContext(
    context: OpenApiGeneratorContext<TInput>,
    config: Partial<TConfig> | undefined,
    defaultConfig: DefaultGenerationProviderConfig<TConfig>
  ): OpenApiEndpointsGenerationProviderContext<TInput, TOutput, TConfig, TEndpointOutput> {
    const ctx = super.getProviderContext(context, config, defaultConfig);
    return Object.assign(ctx, {
      existingEndpointResults: new Map<string, TEndpointOutput>(),
      output: this.initResult(ctx),
    });
  }

  protected override onGenerate(ctx: TContext): TOutput {
    for (const endpoint of ctx.data.endpoints) {
      this.getEndpointResult(ctx, endpoint);
    }

    return ctx.output;
  }

  public getEndpointResult(ctx: TContext, endpoint: ApiEndpoint): TEndpointOutput {
    const existingResult = ctx.existingEndpointResults.get(endpoint.id);
    if (existingResult) return existingResult;

    const result = this.generateEndpoint(ctx, endpoint);
    addSourceIfTest(ctx.config, result, () => `${endpoint.$src.file}#${endpoint.$src.path}`);
    this.addEndpointResult(ctx, endpoint, result);
    return result;
  }

  protected abstract initResult(ctx: OpenApiGenerationProviderContext<TInput, TConfig>): TOutput;

  protected abstract generateEndpoint(ctx: TContext, endpoint: ApiEndpoint): TEndpointOutput;

  protected abstract addEndpointResult(ctx: TContext, endpoint: ApiEndpoint, result: TEndpointOutput): void;
}
