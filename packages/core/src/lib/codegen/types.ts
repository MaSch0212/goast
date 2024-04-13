import { OpenApiGeneratorConfig } from './config';
import { ApiData } from '../transform';

export type AnyConfig = Readonly<Record<string, unknown>>;
export type OpenApiGeneratorInput = Record<string, unknown>;
export type OpenApiGeneratorOutput = Record<string, unknown> | undefined;
export type OpenApiGeneratorContext<TInput extends OpenApiGeneratorInput = OpenApiGeneratorInput> = {
  data: ApiData;
  input: TInput;
  config: OpenApiGeneratorConfig;
};

export type OpenApiGenerationProviderContext<TInput extends OpenApiGeneratorInput, TConfig extends AnyConfig> = Omit<
  OpenApiGeneratorContext<TInput>,
  'config'
> & {
  config: OpenApiGeneratorConfig & TConfig;
};

export interface OpenApiGenerationProvider<
  TInput extends OpenApiGeneratorInput = OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput = OpenApiGeneratorOutput,
  TConfig extends AnyConfig = AnyConfig,
> {
  generate(
    ...args: Parameters<OpenApiGenerationProviderFn<TInput, TOutput, TConfig>>
  ): ReturnType<OpenApiGenerationProviderFn<TInput, TOutput, TConfig>>;
}

export type OpenApiGenerationProviderFn<
  TInput extends OpenApiGeneratorInput = OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput = OpenApiGeneratorOutput,
  TConfig extends AnyConfig = AnyConfig,
> = (context: OpenApiGeneratorContext<TInput>, config?: Partial<TConfig>) => TOutput;
