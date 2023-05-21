import { OpenApiGeneratorConfig } from './config.js';
import { OpenApiData } from '../types.js';

export type AnyConfig = Readonly<Record<string, unknown>>;
export type OpenApiGeneratorInput = Record<string, unknown>;
export type OpenApiGeneratorOutput = Record<string, unknown> | undefined;
export type OpenApiGeneratorContext<TInput extends OpenApiGeneratorInput = OpenApiGeneratorInput> = {
  data: OpenApiData;
  input: TInput;
  config: OpenApiGeneratorConfig;
  state: Map<string, unknown>;
};

export interface OpenApiGenerationProviderType<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig
> extends Function {
  new (): OpenApiGenerationProvider<TInput, TOutput, TConfig>;
}

export interface OpenApiGenerationProvider<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig
> {
  init(context: OpenApiGeneratorContext<TInput>, config?: Partial<TConfig>): PromiseLike<void> | void;
  generate(): PromiseLike<TOutput> | TOutput;
}

export type OpenApiGenerationProviderFn<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig
> = (context: OpenApiGeneratorContext<TInput>, config?: Partial<TConfig>) => PromiseLike<TOutput> | TOutput;
