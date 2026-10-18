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

/**
 * The context that is passed to the methods of `OpenApiServicesGenerationProviderBase`.
 * @template TInput The type of the merged output of the providers that ran before.
 * @template TOutput The type of the output produced by the provider.
 * @template TConfig The type of the provider-specific configuration.
 * @template TServiceOutput The type of the result produced for each service.
 */
export type OpenApiServicesGenerationProviderContext<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TServiceOutput extends OpenApiGeneratorOutput,
> = OpenApiGenerationProviderContext<TInput, TConfig> & {
  /**
   * The results that have been generated so far, keyed by the ID of their service.
   */
  existingServiceResults: Map<string, TServiceOutput>;
  /**
   * The output of the provider. It is created by `initResult` and returned after all services have been generated.
   */
  output: TOutput;
};

/**
 * Base class for generation providers that produce one result per API service.
 * Results are cached per service. Subclasses implement `initResult`, `generateService` and `addServiceResult`, and can
 * override `generateAdditionalFiles` to produce output after all services have been processed.
 * @template TInput The type of the merged output of the providers that ran before.
 * @template TOutput The type of the output produced by the provider.
 * @template TConfig The type of the provider-specific configuration.
 * @template TServiceOutput The type of the result produced for each service.
 * @template TContext The type of the context that is passed to the provider methods.
 * @see OpenApiGenerationProviderBase
 */
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

    addSourceIfTest(ctx.config, result, () =>
      service.$src ? `${service.$src.file}#${service.$src.path}` : `tag:${service.name}`,
    );
    this.addServiceResult(ctx, service, result);
    return result;
  }

  protected abstract initResult(ctx: OpenApiGenerationProviderContext<TInput, TConfig>): TOutput;

  protected abstract generateService(ctx: TContext, service: ApiService): MaybePromise<TServiceOutput>;

  protected abstract addServiceResult(ctx: TContext, service: ApiService, result: TServiceOutput): void;

  // oxlint-disable-next-line no-unused-vars
  protected generateAdditionalFiles(ctx: TContext): MaybePromise<void> {
    // Override if needed
  }
}
