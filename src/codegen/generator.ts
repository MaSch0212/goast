import { isNullish } from '../helpers.js';
import { OpenApiData } from '../types.js';
import { CodeGenerator, CodeGeneratorResult, Merge } from './types.js';

export interface GeneratorPipe<T extends OpenApiData> {
  continueWith<A extends CodeGeneratorResult>(
    g1: CodeGenerator<T, A>
  ): GeneratorPipe<T & Merge<[A]>>;
  continueWith<A extends CodeGeneratorResult, B extends CodeGeneratorResult>(
    g1: CodeGenerator<T, A>,
    g2: CodeGenerator<T & Merge<[A]>, B>
  ): GeneratorPipe<T & Merge<[A, B]>>;
  continueWith<
    A extends CodeGeneratorResult,
    B extends CodeGeneratorResult,
    C extends CodeGeneratorResult
  >(
    g1: CodeGenerator<T, A>,
    g2: CodeGenerator<T & Merge<[A]>, B>,
    g3: CodeGenerator<T & Merge<[A, B]>, C>
  ): GeneratorPipe<T & Merge<[A, B, C]>>;
  continueWith<
    A extends CodeGeneratorResult,
    B extends CodeGeneratorResult,
    C extends CodeGeneratorResult,
    D extends CodeGeneratorResult
  >(
    g1: CodeGenerator<T, A>,
    g2: CodeGenerator<T & Merge<[A]>, B>,
    g3: CodeGenerator<T & Merge<[A, B]>, C>,
    g4: CodeGenerator<T & Merge<[A, B, C]>, D>
  ): GeneratorPipe<T & Merge<[A, B, C, D]>>;
  continueWith<
    A extends CodeGeneratorResult,
    B extends CodeGeneratorResult,
    C extends CodeGeneratorResult,
    D extends CodeGeneratorResult,
    E extends CodeGeneratorResult
  >(
    g1: CodeGenerator<T, A>,
    g2: CodeGenerator<T & Merge<[A]>, B>,
    g3: CodeGenerator<T & Merge<[A, B]>, C>,
    g4: CodeGenerator<T & Merge<[A, B, C]>, D>,
    g5: CodeGenerator<T & Merge<[A, B, C, D]>, E>
  ): GeneratorPipe<T & Merge<[A, B, C, D, E]>>;
  continueWith<
    A extends CodeGeneratorResult,
    B extends CodeGeneratorResult,
    C extends CodeGeneratorResult,
    D extends CodeGeneratorResult,
    E extends CodeGeneratorResult,
    F extends CodeGeneratorResult
  >(
    g1: CodeGenerator<T, A>,
    g2: CodeGenerator<T & Merge<[A]>, B>,
    g3: CodeGenerator<T & Merge<[A, B]>, C>,
    g4: CodeGenerator<T & Merge<[A, B, C]>, D>,
    g5: CodeGenerator<T & Merge<[A, B, C, D]>, E>,
    g6: CodeGenerator<T & Merge<[A, B, C, D, E]>, F>
  ): GeneratorPipe<T & Merge<[A, B, C, D, E, F]>>;
  continueWith<
    A extends CodeGeneratorResult,
    B extends CodeGeneratorResult,
    C extends CodeGeneratorResult,
    D extends CodeGeneratorResult,
    E extends CodeGeneratorResult,
    F extends CodeGeneratorResult,
    G extends CodeGeneratorResult
  >(
    g1: CodeGenerator<T, A>,
    g2: CodeGenerator<T & Merge<[A]>, B>,
    g3: CodeGenerator<T & Merge<[A, B]>, C>,
    g4: CodeGenerator<T & Merge<[A, B, C]>, D>,
    g5: CodeGenerator<T & Merge<[A, B, C, D]>, E>,
    g6: CodeGenerator<T & Merge<[A, B, C, D, E]>, F>,
    g7: CodeGenerator<T & Merge<[A, B, C, D, E, F]>, G>
  ): GeneratorPipe<T & Merge<[A, B, C, D, E, F, G]>>;
  continueWith<
    A extends CodeGeneratorResult,
    B extends CodeGeneratorResult,
    C extends CodeGeneratorResult,
    D extends CodeGeneratorResult,
    E extends CodeGeneratorResult,
    F extends CodeGeneratorResult,
    G extends CodeGeneratorResult,
    H extends CodeGeneratorResult
  >(
    g1: CodeGenerator<T, A>,
    g2: CodeGenerator<T & Merge<[A]>, B>,
    g3: CodeGenerator<T & Merge<[A, B]>, C>,
    g4: CodeGenerator<T & Merge<[A, B, C]>, D>,
    g5: CodeGenerator<T & Merge<[A, B, C, D]>, E>,
    g6: CodeGenerator<T & Merge<[A, B, C, D, E]>, F>,
    g7: CodeGenerator<T & Merge<[A, B, C, D, E, F]>, G>,
    g8: CodeGenerator<T & Merge<[A, B, C, D, E, F, G]>, H>
  ): GeneratorPipe<T & Merge<[A, B, C, D, E, F, G, H]>>;
  continueWith<
    A extends CodeGeneratorResult,
    B extends CodeGeneratorResult,
    C extends CodeGeneratorResult,
    D extends CodeGeneratorResult,
    E extends CodeGeneratorResult,
    F extends CodeGeneratorResult,
    G extends CodeGeneratorResult,
    H extends CodeGeneratorResult,
    I extends CodeGeneratorResult
  >(
    g1: CodeGenerator<T, A>,
    g2: CodeGenerator<T & Merge<[A]>, B>,
    g3: CodeGenerator<T & Merge<[A, B]>, C>,
    g4: CodeGenerator<T & Merge<[A, B, C]>, D>,
    g5: CodeGenerator<T & Merge<[A, B, C, D]>, E>,
    g6: CodeGenerator<T & Merge<[A, B, C, D, E]>, F>,
    g7: CodeGenerator<T & Merge<[A, B, C, D, E, F]>, G>,
    g8: CodeGenerator<T & Merge<[A, B, C, D, E, F, G]>, H>,
    g9: CodeGenerator<T & Merge<[A, B, C, D, E, F, G, H]>, I>,
    ...generators: CodeGenerator<any, any>[]
  ): GeneratorPipe<T & Merge<[A, B, C, D, E, F, G, H, I]>>;
  continueWith<U extends OpenApiData>(...generators: CodeGenerator<any, any>[]): GeneratorPipe<U>;
  then(onfulfilled?: ((value: T) => T | PromiseLike<T>) | null | undefined): Promise<T>;
}

class _GeneratorPipe<T extends OpenApiData> implements GeneratorPipe<T> {
  private _pipe: CodeGenerator<any, any>[] = [];

  constructor(private _data: OpenApiData) {}

  public continueWith<U extends OpenApiData>(
    ...generators: CodeGenerator<any, any>[]
  ): _GeneratorPipe<U> {
    this._pipe.push(...generators);
    return this as any;
  }

  public async then(
    onfulfilled?: ((value: T) => T | PromiseLike<T>) | null | undefined
  ): Promise<T> {
    let data = this._data as any;
    for (const generator of this._pipe) {
      const result = await generator(data);
      data = mergeDeep(data, result);
    }
    return onfulfilled ? onfulfilled(data) : data;
  }
}

export function generate(data: OpenApiData): GeneratorPipe<OpenApiData>;
export function generate<A extends CodeGeneratorResult>(
  data: OpenApiData,
  g1: CodeGenerator<OpenApiData, A>
): GeneratorPipe<OpenApiData & Merge<[A]>>;
export function generate<A extends CodeGeneratorResult, B extends CodeGeneratorResult>(
  data: OpenApiData,
  g1: CodeGenerator<OpenApiData, A>,
  g2: CodeGenerator<OpenApiData & Merge<[A]>, B>
): GeneratorPipe<OpenApiData & Merge<[A, B]>>;
export function generate<
  A extends CodeGeneratorResult,
  B extends CodeGeneratorResult,
  C extends CodeGeneratorResult
>(
  data: OpenApiData,
  g1: CodeGenerator<OpenApiData, A>,
  g2: CodeGenerator<OpenApiData & Merge<[A]>, B>,
  g3: CodeGenerator<OpenApiData & Merge<[A, B]>, C>
): GeneratorPipe<OpenApiData & Merge<[A, B, C]>>;
export function generate<
  A extends CodeGeneratorResult,
  B extends CodeGeneratorResult,
  C extends CodeGeneratorResult,
  D extends CodeGeneratorResult
>(
  data: OpenApiData,
  g1: CodeGenerator<OpenApiData, A>,
  g2: CodeGenerator<OpenApiData & Merge<[A]>, B>,
  g3: CodeGenerator<OpenApiData & Merge<[A, B]>, C>,
  g4: CodeGenerator<OpenApiData & Merge<[A, B, C]>, D>
): GeneratorPipe<OpenApiData & Merge<[A, B, C, D]>>;
export function generate<
  A extends CodeGeneratorResult,
  B extends CodeGeneratorResult,
  C extends CodeGeneratorResult,
  D extends CodeGeneratorResult,
  E extends CodeGeneratorResult
>(
  data: OpenApiData,
  g1: CodeGenerator<OpenApiData, A>,
  g2: CodeGenerator<OpenApiData & Merge<[A]>, B>,
  g3: CodeGenerator<OpenApiData & Merge<[A, B]>, C>,
  g4: CodeGenerator<OpenApiData & Merge<[A, B, C]>, D>,
  g5: CodeGenerator<OpenApiData & Merge<[A, B, C, D]>, E>
): GeneratorPipe<OpenApiData & Merge<[A, B, C, D, E]>>;
export function generate<
  A extends CodeGeneratorResult,
  B extends CodeGeneratorResult,
  C extends CodeGeneratorResult,
  D extends CodeGeneratorResult,
  E extends CodeGeneratorResult,
  F extends CodeGeneratorResult
>(
  data: OpenApiData,
  g1: CodeGenerator<OpenApiData, A>,
  g2: CodeGenerator<OpenApiData & Merge<[A]>, B>,
  g3: CodeGenerator<OpenApiData & Merge<[A, B]>, C>,
  g4: CodeGenerator<OpenApiData & Merge<[A, B, C]>, D>,
  g5: CodeGenerator<OpenApiData & Merge<[A, B, C, D]>, E>,
  g6: CodeGenerator<OpenApiData & Merge<[A, B, C, D, E]>, F>
): GeneratorPipe<OpenApiData & Merge<[A, B, C, D, E, F]>>;
export function generate<
  A extends CodeGeneratorResult,
  B extends CodeGeneratorResult,
  C extends CodeGeneratorResult,
  D extends CodeGeneratorResult,
  E extends CodeGeneratorResult,
  F extends CodeGeneratorResult,
  G extends CodeGeneratorResult
>(
  data: OpenApiData,
  g1: CodeGenerator<OpenApiData, A>,
  g2: CodeGenerator<OpenApiData & Merge<[A]>, B>,
  g3: CodeGenerator<OpenApiData & Merge<[A, B]>, C>,
  g4: CodeGenerator<OpenApiData & Merge<[A, B, C]>, D>,
  g5: CodeGenerator<OpenApiData & Merge<[A, B, C, D]>, E>,
  g6: CodeGenerator<OpenApiData & Merge<[A, B, C, D, E]>, F>,
  g7: CodeGenerator<OpenApiData & Merge<[A, B, C, D, E, F]>, G>
): GeneratorPipe<OpenApiData & Merge<[A, B, C, D, E, F, G]>>;
export function generate<
  A extends CodeGeneratorResult,
  B extends CodeGeneratorResult,
  C extends CodeGeneratorResult,
  D extends CodeGeneratorResult,
  E extends CodeGeneratorResult,
  F extends CodeGeneratorResult,
  G extends CodeGeneratorResult,
  H extends CodeGeneratorResult
>(
  data: OpenApiData,
  g1: CodeGenerator<OpenApiData, A>,
  g2: CodeGenerator<OpenApiData & Merge<[A]>, B>,
  g3: CodeGenerator<OpenApiData & Merge<[A, B]>, C>,
  g4: CodeGenerator<OpenApiData & Merge<[A, B, C]>, D>,
  g5: CodeGenerator<OpenApiData & Merge<[A, B, C, D]>, E>,
  g6: CodeGenerator<OpenApiData & Merge<[A, B, C, D, E]>, F>,
  g7: CodeGenerator<OpenApiData & Merge<[A, B, C, D, E, F]>, G>,
  g8: CodeGenerator<OpenApiData & Merge<[A, B, C, D, E, F, G]>, H>
): GeneratorPipe<OpenApiData & Merge<[A, B, C, D, E, F, G, H]>>;
export function generate<
  A extends CodeGeneratorResult,
  B extends CodeGeneratorResult,
  C extends CodeGeneratorResult,
  D extends CodeGeneratorResult,
  E extends CodeGeneratorResult,
  F extends CodeGeneratorResult,
  G extends CodeGeneratorResult,
  H extends CodeGeneratorResult,
  I extends CodeGeneratorResult
>(
  data: OpenApiData,
  g1: CodeGenerator<OpenApiData, A>,
  g2: CodeGenerator<OpenApiData & Merge<[A]>, B>,
  g3: CodeGenerator<OpenApiData & Merge<[A, B]>, C>,
  g4: CodeGenerator<OpenApiData & Merge<[A, B, C]>, D>,
  g5: CodeGenerator<OpenApiData & Merge<[A, B, C, D]>, E>,
  g6: CodeGenerator<OpenApiData & Merge<[A, B, C, D, E]>, F>,
  g7: CodeGenerator<OpenApiData & Merge<[A, B, C, D, E, F]>, G>,
  g8: CodeGenerator<OpenApiData & Merge<[A, B, C, D, E, F, G]>, H>,
  g9: CodeGenerator<OpenApiData & Merge<[A, B, C, D, E, F, G, H]>, I>,
  ...generators: CodeGenerator<any, any>[]
): GeneratorPipe<OpenApiData & Merge<[A, B, C, D, E, F, G, H, I]>>;

export function generate<T extends OpenApiData>(
  data: OpenApiData,
  ...generators: CodeGenerator<any, any>[]
): GeneratorPipe<T> {
  const pipe = new _GeneratorPipe(data);
  return pipe.continueWith<T>(...generators);
}

function mergeDeep<
  T extends Record<string | number | symbol, any>,
  U extends Record<string | number | symbol, any>[]
>(target: T, ...sources: U): T & U[number] {
  if (!sources.length) return target;
  const source = sources.shift();

  for (const key in source) {
    const value = source[key];
    if (typeof value === 'object') {
      if (!target[key]) Object.assign(target, { [key]: value });
      else mergeDeep(target[key], value);
    } else if (Array.isArray(value)) {
      if (!target[key]) Object.assign(target, { [key]: value });
      else Object.assign(target, { [key]: [...target[key], ...value] });
    } else {
      Object.assign(target, { [key]: value });
    }
  }

  return mergeDeep(target, ...sources);
}
