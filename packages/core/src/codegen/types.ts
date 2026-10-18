import type { ApiData } from '../transform/api-types.ts';
import type { MaybePromise } from '../utils/type.utils.ts';
import type { OpenApiGeneratorConfig } from './config.ts';

/**
 * A loosely typed configuration object passed to generation providers, which narrow it to their own options.
 */
export type AnyConfig = Readonly<Record<string, unknown>>;

/**
 * The merged output of the generation providers that ran before, keyed by the properties they returned.
 */
export type OpenApiGeneratorInput = Record<string, unknown>;

/**
 * The result of a generation provider. Its properties are deep-merged into the input of the following providers.
 * A falsy result (`undefined`) is ignored.
 */
export type OpenApiGeneratorOutput = Record<string, unknown> | undefined;

/**
 * The context that is passed to every generation provider.
 * @template TInput The type of the merged output of the providers that ran before.
 */
export type OpenApiGeneratorContext<TInput extends OpenApiGeneratorInput = OpenApiGeneratorInput> = {
  /**
   * The parsed and transformed data of all OpenAPI specifications.
   */
  data: ApiData;
  /**
   * The merged output of the providers that ran before the current one. It is empty for the first provider.
   */
  input: TInput;
  /**
   * The configuration of the generator.
   */
  config: OpenApiGeneratorConfig;
};

/**
 * The context that is passed to a provider built on `OpenApiGenerationProviderBase`.
 * It is the same as `OpenApiGeneratorContext`, except that its `config` also contains the provider-specific options.
 * @template TInput The type of the merged output of the providers that ran before.
 * @template TConfig The type of the provider-specific configuration.
 * @see OpenApiGeneratorContext
 */
export type OpenApiGenerationProviderContext<TInput extends OpenApiGeneratorInput, TConfig extends AnyConfig> = Omit<
  OpenApiGeneratorContext<TInput>,
  'config'
> & {
  /**
   * The generator configuration merged with the provider-specific configuration.
   */
  config: OpenApiGeneratorConfig & TConfig;
};

/**
 * A generation provider implemented as an object with a `generate` method.
 * @template TInput The type of the merged output of the providers that ran before.
 * @template TOutput The type of the output produced by this provider.
 * @template TConfig The type of the provider-specific configuration.
 * @see OpenApiGenerationProviderFn
 */
export interface OpenApiGenerationProvider<
  TInput extends OpenApiGeneratorInput = OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput = OpenApiGeneratorOutput,
  TConfig extends AnyConfig = AnyConfig,
> {
  /**
   * Generates the output of this provider.
   * @param context The context of the generator, including the output of the providers that ran before.
   * @param config The provider-specific configuration, if any.
   * @returns The output of this provider, or a promise that resolves to it.
   */
  generate(
    ...args: Parameters<OpenApiGenerationProviderFn<TInput, TOutput, TConfig>>
  ): ReturnType<OpenApiGenerationProviderFn<TInput, TOutput, TConfig>>;
}

/**
 * A generation provider implemented as a function. Its return value is merged into the input of the following
 * providers.
 * @template TInput The type of the merged output of the providers that ran before.
 * @template TOutput The type of the output produced by this provider.
 * @template TConfig The type of the provider-specific configuration.
 * @param context The context of the generator, including the output of the providers that ran before.
 * @param config The provider-specific configuration, if any.
 * @returns The output of this provider, or a promise that resolves to it.
 */
export type OpenApiGenerationProviderFn<
  TInput extends OpenApiGeneratorInput = OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput = OpenApiGeneratorOutput,
  TConfig extends AnyConfig = AnyConfig,
> = (context: OpenApiGeneratorContext<TInput>, config?: Partial<TConfig>) => MaybePromise<TOutput>;
