import { OpenApiGeneratorConfig } from './config';
import { ApiData } from '../transform';

export type AnyConfig = Readonly<Record<string, unknown>>;
export type OpenApiGeneratorInput = Record<string, unknown>;
export type OpenApiGeneratorOutput = Record<string, unknown> | undefined;
export type OpenApiGeneratorContext<TInput extends OpenApiGeneratorInput = OpenApiGeneratorInput> = {
  data: ApiData;
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
  init(context: OpenApiGeneratorContext<TInput>, config?: Partial<TConfig>): void;
  generate(): TOutput;
}

export type OpenApiGenerationProviderFn<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig
> = (context: OpenApiGeneratorContext<TInput>, config?: Partial<TConfig>) => TOutput;
