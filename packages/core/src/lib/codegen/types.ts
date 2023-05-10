import { Merge } from '../type.utils.js';
import { OpenApiData } from '../types.js';
import { CodeGeneratorConfig } from './config.js';

export type AnyConfig = Readonly<Record<string, unknown>>;
export type CodeGeneratorInput = Record<string, unknown>;
export type CodeGeneratorOutput = Record<string, unknown> | undefined;
export type CodeGeneratorContext<TInput extends CodeGeneratorInput, TConfig extends AnyConfig> = {
  data: OpenApiData;
  input: TInput;
  config: CodeGeneratorConfig & TConfig;
  state: Map<string, unknown>;
};

export interface CodeGenerator<
  TInput extends CodeGeneratorInput,
  TOutput extends CodeGeneratorOutput,
  TConfig extends AnyConfig
> {
  get config(): TConfig;
  generate(context: CodeGeneratorContext<TInput, TConfig>): Promise<TOutput>;
}

export interface GeneratorPipe<T extends object> {
  continueWith<A extends CodeGeneratorOutput>(
    g1: CodeGenerator<{}, A, AnyConfig>
  ): GeneratorPipe<Merge<[A]>>;
  continueWith<A extends CodeGeneratorOutput, B extends CodeGeneratorOutput>(
    g1: CodeGenerator<{}, A, AnyConfig>,
    g2: CodeGenerator<Merge<[A]>, B, AnyConfig>
  ): GeneratorPipe<Merge<[A, B]>>;
  continueWith<
    A extends CodeGeneratorOutput,
    B extends CodeGeneratorOutput,
    C extends CodeGeneratorOutput
  >(
    g1: CodeGenerator<{}, A, AnyConfig>,
    g2: CodeGenerator<Merge<[A]>, B, AnyConfig>,
    g3: CodeGenerator<Merge<[A, B]>, C, AnyConfig>
  ): GeneratorPipe<Merge<[A, B, C]>>;
  continueWith<
    A extends CodeGeneratorOutput,
    B extends CodeGeneratorOutput,
    C extends CodeGeneratorOutput,
    D extends CodeGeneratorOutput
  >(
    g1: CodeGenerator<{}, A, AnyConfig>,
    g2: CodeGenerator<Merge<[A]>, B, AnyConfig>,
    g3: CodeGenerator<Merge<[A, B]>, C, AnyConfig>,
    g4: CodeGenerator<Merge<[A, B, C]>, D, AnyConfig>
  ): GeneratorPipe<Merge<[A, B, C, D]>>;
  continueWith<
    A extends CodeGeneratorOutput,
    B extends CodeGeneratorOutput,
    C extends CodeGeneratorOutput,
    D extends CodeGeneratorOutput,
    E extends CodeGeneratorOutput
  >(
    g1: CodeGenerator<{}, A, AnyConfig>,
    g2: CodeGenerator<Merge<[A]>, B, AnyConfig>,
    g3: CodeGenerator<Merge<[A, B]>, C, AnyConfig>,
    g4: CodeGenerator<Merge<[A, B, C]>, D, AnyConfig>,
    g5: CodeGenerator<Merge<[A, B, C, D]>, E, AnyConfig>
  ): GeneratorPipe<Merge<[A, B, C, D, E]>>;
  continueWith<
    A extends CodeGeneratorOutput,
    B extends CodeGeneratorOutput,
    C extends CodeGeneratorOutput,
    D extends CodeGeneratorOutput,
    E extends CodeGeneratorOutput,
    F extends CodeGeneratorOutput
  >(
    g1: CodeGenerator<{}, A, AnyConfig>,
    g2: CodeGenerator<Merge<[A]>, B, AnyConfig>,
    g3: CodeGenerator<Merge<[A, B]>, C, AnyConfig>,
    g4: CodeGenerator<Merge<[A, B, C]>, D, AnyConfig>,
    g5: CodeGenerator<Merge<[A, B, C, D]>, E, AnyConfig>,
    g6: CodeGenerator<Merge<[A, B, C, D, E]>, F, AnyConfig>
  ): GeneratorPipe<Merge<[A, B, C, D, E, F]>>;
  continueWith<
    A extends CodeGeneratorOutput,
    B extends CodeGeneratorOutput,
    C extends CodeGeneratorOutput,
    D extends CodeGeneratorOutput,
    E extends CodeGeneratorOutput,
    F extends CodeGeneratorOutput,
    G extends CodeGeneratorOutput
  >(
    g1: CodeGenerator<{}, A, AnyConfig>,
    g2: CodeGenerator<Merge<[A]>, B, AnyConfig>,
    g3: CodeGenerator<Merge<[A, B]>, C, AnyConfig>,
    g4: CodeGenerator<Merge<[A, B, C]>, D, AnyConfig>,
    g5: CodeGenerator<Merge<[A, B, C, D]>, E, AnyConfig>,
    g6: CodeGenerator<Merge<[A, B, C, D, E]>, F, AnyConfig>,
    g7: CodeGenerator<Merge<[A, B, C, D, E, F]>, G, AnyConfig>
  ): GeneratorPipe<Merge<[A, B, C, D, E, F, G]>>;
  continueWith<
    A extends CodeGeneratorOutput,
    B extends CodeGeneratorOutput,
    C extends CodeGeneratorOutput,
    D extends CodeGeneratorOutput,
    E extends CodeGeneratorOutput,
    F extends CodeGeneratorOutput,
    G extends CodeGeneratorOutput,
    H extends CodeGeneratorOutput
  >(
    g1: CodeGenerator<{}, A, AnyConfig>,
    g2: CodeGenerator<Merge<[A]>, B, AnyConfig>,
    g3: CodeGenerator<Merge<[A, B]>, C, AnyConfig>,
    g4: CodeGenerator<Merge<[A, B, C]>, D, AnyConfig>,
    g5: CodeGenerator<Merge<[A, B, C, D]>, E, AnyConfig>,
    g6: CodeGenerator<Merge<[A, B, C, D, E]>, F, AnyConfig>,
    g7: CodeGenerator<Merge<[A, B, C, D, E, F]>, G, AnyConfig>,
    g8: CodeGenerator<Merge<[A, B, C, D, E, F, G]>, H, AnyConfig>
  ): GeneratorPipe<Merge<[A, B, C, D, E, F, G, H]>>;
  continueWith<
    A extends CodeGeneratorOutput,
    B extends CodeGeneratorOutput,
    C extends CodeGeneratorOutput,
    D extends CodeGeneratorOutput,
    E extends CodeGeneratorOutput,
    F extends CodeGeneratorOutput,
    G extends CodeGeneratorOutput,
    H extends CodeGeneratorOutput,
    I extends CodeGeneratorOutput
  >(
    g1: CodeGenerator<{}, A, AnyConfig>,
    g2: CodeGenerator<Merge<[A]>, B, AnyConfig>,
    g3: CodeGenerator<Merge<[A, B]>, C, AnyConfig>,
    g4: CodeGenerator<Merge<[A, B, C]>, D, AnyConfig>,
    g5: CodeGenerator<Merge<[A, B, C, D]>, E, AnyConfig>,
    g6: CodeGenerator<Merge<[A, B, C, D, E]>, F, AnyConfig>,
    g7: CodeGenerator<Merge<[A, B, C, D, E, F]>, G, AnyConfig>,
    g8: CodeGenerator<Merge<[A, B, C, D, E, F, G]>, H, AnyConfig>,
    g9: CodeGenerator<Merge<[A, B, C, D, E, F, G, H]>, I, AnyConfig>,
    ...generators: CodeGenerator<CodeGeneratorInput, CodeGeneratorOutput, AnyConfig>[]
  ): GeneratorPipe<Merge<[A, B, C, D, E, F, G, H, I]>>;
  continueWith<U extends OpenApiData>(
    ...generators: CodeGenerator<CodeGeneratorInput, CodeGeneratorOutput, AnyConfig>[]
  ): GeneratorPipe<U>;
  then(onfulfilled?: ((value: T) => T | PromiseLike<T>) | null | undefined): Promise<T>;
}
