import { Merge } from '../type.utils.js';
import { OpenApiData } from '../types.js';
import { CodeGeneratorConfig } from './config.js';

export type CodeGeneratorInput = Record<string, unknown>;
export type CodeGeneratorOutput = Record<string, unknown> | undefined;
export type CodeGeneratorContext<TInput extends CodeGeneratorInput> = {
  data: OpenApiData;
  input: TInput;
  config: CodeGeneratorConfig;
};
export interface CodeGenerator<
  TInput extends CodeGeneratorInput,
  TOutput extends CodeGeneratorOutput
> {
  generate(context: CodeGeneratorContext<TInput>): Promise<TOutput>;
}

export interface GeneratorPipe<T extends object> {
  continueWith<A extends CodeGeneratorOutput>(g1: CodeGenerator<{}, A>): GeneratorPipe<Merge<[A]>>;
  continueWith<A extends CodeGeneratorOutput, B extends CodeGeneratorOutput>(
    g1: CodeGenerator<{}, A>,
    g2: CodeGenerator<Merge<[A]>, B>
  ): GeneratorPipe<Merge<[A, B]>>;
  continueWith<
    A extends CodeGeneratorOutput,
    B extends CodeGeneratorOutput,
    C extends CodeGeneratorOutput
  >(
    g1: CodeGenerator<{}, A>,
    g2: CodeGenerator<Merge<[A]>, B>,
    g3: CodeGenerator<Merge<[A, B]>, C>
  ): GeneratorPipe<Merge<[A, B, C]>>;
  continueWith<
    A extends CodeGeneratorOutput,
    B extends CodeGeneratorOutput,
    C extends CodeGeneratorOutput,
    D extends CodeGeneratorOutput
  >(
    g1: CodeGenerator<{}, A>,
    g2: CodeGenerator<Merge<[A]>, B>,
    g3: CodeGenerator<Merge<[A, B]>, C>,
    g4: CodeGenerator<Merge<[A, B, C]>, D>
  ): GeneratorPipe<Merge<[A, B, C, D]>>;
  continueWith<
    A extends CodeGeneratorOutput,
    B extends CodeGeneratorOutput,
    C extends CodeGeneratorOutput,
    D extends CodeGeneratorOutput,
    E extends CodeGeneratorOutput
  >(
    g1: CodeGenerator<{}, A>,
    g2: CodeGenerator<Merge<[A]>, B>,
    g3: CodeGenerator<Merge<[A, B]>, C>,
    g4: CodeGenerator<Merge<[A, B, C]>, D>,
    g5: CodeGenerator<Merge<[A, B, C, D]>, E>
  ): GeneratorPipe<Merge<[A, B, C, D, E]>>;
  continueWith<
    A extends CodeGeneratorOutput,
    B extends CodeGeneratorOutput,
    C extends CodeGeneratorOutput,
    D extends CodeGeneratorOutput,
    E extends CodeGeneratorOutput,
    F extends CodeGeneratorOutput
  >(
    g1: CodeGenerator<{}, A>,
    g2: CodeGenerator<Merge<[A]>, B>,
    g3: CodeGenerator<Merge<[A, B]>, C>,
    g4: CodeGenerator<Merge<[A, B, C]>, D>,
    g5: CodeGenerator<Merge<[A, B, C, D]>, E>,
    g6: CodeGenerator<Merge<[A, B, C, D, E]>, F>
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
    g1: CodeGenerator<{}, A>,
    g2: CodeGenerator<Merge<[A]>, B>,
    g3: CodeGenerator<Merge<[A, B]>, C>,
    g4: CodeGenerator<Merge<[A, B, C]>, D>,
    g5: CodeGenerator<Merge<[A, B, C, D]>, E>,
    g6: CodeGenerator<Merge<[A, B, C, D, E]>, F>,
    g7: CodeGenerator<Merge<[A, B, C, D, E, F]>, G>
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
    g1: CodeGenerator<{}, A>,
    g2: CodeGenerator<Merge<[A]>, B>,
    g3: CodeGenerator<Merge<[A, B]>, C>,
    g4: CodeGenerator<Merge<[A, B, C]>, D>,
    g5: CodeGenerator<Merge<[A, B, C, D]>, E>,
    g6: CodeGenerator<Merge<[A, B, C, D, E]>, F>,
    g7: CodeGenerator<Merge<[A, B, C, D, E, F]>, G>,
    g8: CodeGenerator<Merge<[A, B, C, D, E, F, G]>, H>
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
    g1: CodeGenerator<{}, A>,
    g2: CodeGenerator<Merge<[A]>, B>,
    g3: CodeGenerator<Merge<[A, B]>, C>,
    g4: CodeGenerator<Merge<[A, B, C]>, D>,
    g5: CodeGenerator<Merge<[A, B, C, D]>, E>,
    g6: CodeGenerator<Merge<[A, B, C, D, E]>, F>,
    g7: CodeGenerator<Merge<[A, B, C, D, E, F]>, G>,
    g8: CodeGenerator<Merge<[A, B, C, D, E, F, G]>, H>,
    g9: CodeGenerator<Merge<[A, B, C, D, E, F, G, H]>, I>,
    ...generators: CodeGenerator<CodeGeneratorInput, CodeGeneratorOutput>[]
  ): GeneratorPipe<Merge<[A, B, C, D, E, F, G, H, I]>>;
  continueWith<U extends OpenApiData>(
    ...generators: CodeGenerator<CodeGeneratorInput, CodeGeneratorOutput>[]
  ): GeneratorPipe<U>;
  then(onfulfilled?: ((value: T) => T | PromiseLike<T>) | null | undefined): Promise<T>;
}
