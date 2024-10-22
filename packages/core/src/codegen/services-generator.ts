import type { ApiService } from '../transform/api-types.ts';
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

  protected override async onGenerate(ctx: TContext): Promise<TOutput> {
    for (const service of ctx.data.services) {
      await this.getServiceResult(ctx, service);
    }

    await this.generateAdditionalFiles(ctx);

    return ctx.output;
  }

  protected async getServiceResult(ctx: TContext, service: ApiService): Promise<TServiceOutput> {
    const existingResult = ctx.existingServiceResults.get(service.id);
    if (existingResult) return existingResult;

    const result = await this.generateService(ctx, service);

    addSourceIfTest(
      ctx.config,
      result,
      () => service.$src ? `${service.$src.file}#${service.$src.path}` : `tag:${service.name}`,
    );
    this.addServiceResult(ctx, service, result);
    return result;
  }

  protected abstract initResult(ctx: OpenApiGenerationProviderContext<TInput, TConfig>): TOutput;

  protected abstract generateService(ctx: TContext, service: ApiService): MaybePromise<TServiceOutput>;

  protected abstract addServiceResult(ctx: TContext, service: ApiService, result: TServiceOutput): void;

  // deno-lint-ignore no-unused-vars
  protected generateAdditionalFiles(ctx: TContext): MaybePromise<void> {
    // Override if needed
  }
}
