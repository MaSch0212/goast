import { resolve } from 'path';

import { emptyDir, ensureDir } from 'fs-extra';

import { CodeGeneratorConfig, defaultCodeGeneratorConfig } from './config.js';
import { CodeGeneratorInput, CodeGeneratorOutput, CodeGenerator, GeneratorPipe, AnyConfig } from './types.js';
import { Merge } from '../type.utils.js';
import { OpenApiData } from '../types.js';

class _GeneratorPipe<T extends OpenApiData> implements GeneratorPipe<T> {
  private _pipe: CodeGenerator<CodeGeneratorInput, CodeGeneratorOutput, AnyConfig>[] = [];
  private _config: CodeGeneratorConfig;

  constructor(private _data: OpenApiData, config?: Partial<CodeGeneratorConfig>) {
    this._config = Object.assign({}, defaultCodeGeneratorConfig, config);
  }

  public continueWith<U extends OpenApiData>(
    ...generators: CodeGenerator<CodeGeneratorInput, CodeGeneratorOutput, AnyConfig>[]
  ): _GeneratorPipe<U> {
    this._pipe.push(...generators);
    return this as unknown as _GeneratorPipe<U>;
  }

  public async then(onfulfilled?: ((value: T) => T | PromiseLike<T>) | null | undefined): Promise<T> {
    const absOutputPath = resolve(this._config.outputDir);
    if (this._config.clearOutputDir) {
      await emptyDir(absOutputPath);
    } else {
      await ensureDir(absOutputPath);
    }

    let input = {} as T;
    for (const generator of this._pipe) {
      const context = {
        data: this._data,
        input,
        config: {
          ...this._config,
          ...generator.config,
        },
        state: new Map(),
      };
      const result = await generator.generate(context);
      if (result) {
        input = mergeDeep(input, result);
      }
    }
    return onfulfilled ? onfulfilled(input) : input;
  }
}

export function generate(data: OpenApiData, config?: Partial<CodeGeneratorConfig>): GeneratorPipe<OpenApiData>;
export function generate<A extends CodeGeneratorOutput>(
  data: OpenApiData,
  config: Partial<CodeGeneratorConfig> | undefined,
  g1: CodeGenerator<{}, A, AnyConfig>
): GeneratorPipe<Merge<[A]>>;
export function generate<A extends CodeGeneratorOutput, B extends CodeGeneratorOutput>(
  data: OpenApiData,
  config: Partial<CodeGeneratorConfig> | undefined,
  g1: CodeGenerator<{}, A, AnyConfig>,
  g2: CodeGenerator<Merge<[A]>, B, AnyConfig>
): GeneratorPipe<Merge<[A, B]>>;
export function generate<A extends CodeGeneratorOutput, B extends CodeGeneratorOutput, C extends CodeGeneratorOutput>(
  data: OpenApiData,
  config: Partial<CodeGeneratorConfig> | undefined,
  g1: CodeGenerator<{}, A, AnyConfig>,
  g2: CodeGenerator<Merge<[A]>, B, AnyConfig>,
  g3: CodeGenerator<Merge<[A, B]>, C, AnyConfig>
): GeneratorPipe<Merge<[A, B, C]>>;
export function generate<
  A extends CodeGeneratorOutput,
  B extends CodeGeneratorOutput,
  C extends CodeGeneratorOutput,
  D extends CodeGeneratorOutput
>(
  data: OpenApiData,
  config: Partial<CodeGeneratorConfig> | undefined,
  g1: CodeGenerator<{}, A, AnyConfig>,
  g2: CodeGenerator<Merge<[A]>, B, AnyConfig>,
  g3: CodeGenerator<Merge<[A, B]>, C, AnyConfig>,
  g4: CodeGenerator<Merge<[A, B, C]>, D, AnyConfig>
): GeneratorPipe<Merge<[A, B, C, D]>>;
export function generate<
  A extends CodeGeneratorOutput,
  B extends CodeGeneratorOutput,
  C extends CodeGeneratorOutput,
  D extends CodeGeneratorOutput,
  E extends CodeGeneratorOutput
>(
  data: OpenApiData,
  config: Partial<CodeGeneratorConfig> | undefined,
  g1: CodeGenerator<{}, A, AnyConfig>,
  g2: CodeGenerator<Merge<[A]>, B, AnyConfig>,
  g3: CodeGenerator<Merge<[A, B]>, C, AnyConfig>,
  g4: CodeGenerator<Merge<[A, B, C]>, D, AnyConfig>,
  g5: CodeGenerator<Merge<[A, B, C, D]>, E, AnyConfig>
): GeneratorPipe<Merge<[A, B, C, D, E]>>;
export function generate<
  A extends CodeGeneratorOutput,
  B extends CodeGeneratorOutput,
  C extends CodeGeneratorOutput,
  D extends CodeGeneratorOutput,
  E extends CodeGeneratorOutput,
  F extends CodeGeneratorOutput
>(
  data: OpenApiData,
  config: Partial<CodeGeneratorConfig> | undefined,
  g1: CodeGenerator<{}, A, AnyConfig>,
  g2: CodeGenerator<Merge<[A]>, B, AnyConfig>,
  g3: CodeGenerator<Merge<[A, B]>, C, AnyConfig>,
  g4: CodeGenerator<Merge<[A, B, C]>, D, AnyConfig>,
  g5: CodeGenerator<Merge<[A, B, C, D]>, E, AnyConfig>,
  g6: CodeGenerator<Merge<[A, B, C, D, E]>, F, AnyConfig>
): GeneratorPipe<Merge<[A, B, C, D, E, F]>>;
export function generate<
  A extends CodeGeneratorOutput,
  B extends CodeGeneratorOutput,
  C extends CodeGeneratorOutput,
  D extends CodeGeneratorOutput,
  E extends CodeGeneratorOutput,
  F extends CodeGeneratorOutput,
  G extends CodeGeneratorOutput
>(
  data: OpenApiData,
  config: Partial<CodeGeneratorConfig> | undefined,
  g1: CodeGenerator<{}, A, AnyConfig>,
  g2: CodeGenerator<Merge<[A]>, B, AnyConfig>,
  g3: CodeGenerator<Merge<[A, B]>, C, AnyConfig>,
  g4: CodeGenerator<Merge<[A, B, C]>, D, AnyConfig>,
  g5: CodeGenerator<Merge<[A, B, C, D]>, E, AnyConfig>,
  g6: CodeGenerator<Merge<[A, B, C, D, E]>, F, AnyConfig>,
  g7: CodeGenerator<Merge<[A, B, C, D, E, F]>, G, AnyConfig>
): GeneratorPipe<Merge<[A, B, C, D, E, F, G]>>;
export function generate<
  A extends CodeGeneratorOutput,
  B extends CodeGeneratorOutput,
  C extends CodeGeneratorOutput,
  D extends CodeGeneratorOutput,
  E extends CodeGeneratorOutput,
  F extends CodeGeneratorOutput,
  G extends CodeGeneratorOutput,
  H extends CodeGeneratorOutput
>(
  data: OpenApiData,
  config: Partial<CodeGeneratorConfig> | undefined,
  g1: CodeGenerator<{}, A, AnyConfig>,
  g2: CodeGenerator<Merge<[A]>, B, AnyConfig>,
  g3: CodeGenerator<Merge<[A, B]>, C, AnyConfig>,
  g4: CodeGenerator<Merge<[A, B, C]>, D, AnyConfig>,
  g5: CodeGenerator<Merge<[A, B, C, D]>, E, AnyConfig>,
  g6: CodeGenerator<Merge<[A, B, C, D, E]>, F, AnyConfig>,
  g7: CodeGenerator<Merge<[A, B, C, D, E, F]>, G, AnyConfig>,
  g8: CodeGenerator<Merge<[A, B, C, D, E, F, G]>, H, AnyConfig>
): GeneratorPipe<Merge<[A, B, C, D, E, F, G, H]>>;
export function generate<
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
  data: OpenApiData,
  config: Partial<CodeGeneratorConfig> | undefined,
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
export function generate<T extends OpenApiData>(
  data: OpenApiData,
  config: Partial<CodeGeneratorConfig> | undefined,
  ...generators: CodeGenerator<CodeGeneratorInput, CodeGeneratorOutput, AnyConfig>[]
): GeneratorPipe<T> {
  const pipe = new _GeneratorPipe(data, config);
  return pipe.continueWith<T>(...generators);
}

function mergeDeep<T extends Record<string, unknown>, U extends Record<string, unknown>[]>(
  target: T,
  ...sources: U
): T & U[number] {
  if (!sources.length) return target;
  const source = sources.shift();

  for (const key in source) {
    const value = source[key];
    if (value && typeof value === 'object') {
      if (!target[key]) Object.assign(target, { [key]: value });
      else mergeDeep(target[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      if (!target[key]) Object.assign(target, { [key]: value });
      else Object.assign(target, { [key]: [...(target[key] as Iterable<unknown>), ...value] });
    } else {
      Object.assign(target, { [key]: value });
    }
  }

  return mergeDeep(target, ...sources);
}
