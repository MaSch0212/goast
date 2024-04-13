import { DefaultGenerationProviderConfig, OpenApiGenerationProviderBase } from './generator';
import { addSourceIfTest } from './internal-utils';
import {
  OpenApiGeneratorInput,
  OpenApiGeneratorOutput,
  AnyConfig,
  OpenApiGeneratorContext,
  OpenApiGenerationProviderContext,
} from './types';
import { ApiService } from '../transform';

export type OpenApiServicesGenerationProviderContext<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TServiceOutput extends OpenApiGeneratorOutput,
> = OpenApiGenerationProviderContext<TInput, TConfig> & {
  existingServiceResults: Map<string, TServiceOutput>;
  output: TOutput;
};

export abstract class OpenApiServicesGenerationProviderBase<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TServiceOutput extends OpenApiGeneratorOutput,
  TContext extends OpenApiServicesGenerationProviderContext<TInput, TOutput, TConfig, TServiceOutput>,
> extends OpenApiGenerationProviderBase<TInput, TOutput, TConfig, TContext> {
  protected override getProviderContext(
    context: OpenApiGeneratorContext<TInput>,
    config: Partial<TConfig> | undefined,
    defaultConfig: DefaultGenerationProviderConfig<TConfig>,
  ): OpenApiServicesGenerationProviderContext<TInput, TOutput, TConfig, TServiceOutput> {
    const ctx = super.getProviderContext(context, config, defaultConfig);
    return Object.assign(ctx, {
      existingServiceResults: new Map<string, TServiceOutput>(),
      output: this.initResult(ctx),
    });
  }

  public override onGenerate(ctx: TContext): TOutput {
    for (const service of ctx.data.services) {
      this.getServiceResult(ctx, service);
    }

    return ctx.output;
  }

  public getServiceResult(ctx: TContext, service: ApiService): TServiceOutput {
    const existingResult = ctx.existingServiceResults.get(service.id);
    if (existingResult) return existingResult;

    const result = this.generateService(ctx, service);

    addSourceIfTest(ctx.config, result, () =>
      service.$src ? `${service.$src.file}#${service.$src.path}` : `tag:${service.name}`,
    );
    this.addServiceResult(ctx, service, result);
    return result;
  }

  protected abstract initResult(ctx: OpenApiGenerationProviderContext<TInput, TConfig>): TOutput;

  protected abstract generateService(ctx: TContext, service: ApiService): TServiceOutput;

  protected abstract addServiceResult(ctx: TContext, service: ApiService, result: TServiceOutput): void;
}
