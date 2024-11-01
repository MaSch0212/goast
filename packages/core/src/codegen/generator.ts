import { resolve } from 'node:path';

// @deno-types="npm:@types/fs-extra"
import fs from 'fs-extra';

import { OpenApiParser } from '../parse/parser.ts';
import type { ApiData } from '../transform/api-types.ts';
import { ActionProvider } from '../utils/action-provider.ts';
import { type DirectoryScanOptions, getFiles } from '../utils/file-system.utils.ts';
import type { EmptyConstructor, Merge } from '../utils/type.utils.ts';
import { defaultOpenApiGeneratorConfig, type OpenApiGeneratorConfig } from './config.ts';
import type {
  AnyConfig,
  OpenApiGenerationProvider,
  OpenApiGenerationProviderContext,
  OpenApiGenerationProviderFn,
  OpenApiGeneratorContext,
  OpenApiGeneratorInput,
  OpenApiGeneratorOutput,
} from './types.ts';

type OpenApiGenerationProviders = {
  provider: ActionProvider<OpenApiGenerationProviderFn>;
  config: AnyConfig | undefined;
}[];

type VInput<TActual, TExpected> = TExpected extends TActual ? TActual
  : { __error: 'The current output of the generator does not satisfy the input of this generator.' };

class _OpenApiGenerator<TOutput extends OpenApiGeneratorInput> {
  private readonly _providers: OpenApiGenerationProviders;
  private readonly _config: OpenApiGeneratorConfig;
  private readonly _parser: OpenApiParser;

  constructor(config: OpenApiGeneratorConfig, providers: OpenApiGenerationProviders, parser: OpenApiParser) {
    this._providers = providers;
    this._config = config;
    this._parser = parser;
  }

  public use<PInput extends OpenApiGeneratorInput, POutput extends OpenApiGeneratorOutput, PConfig extends AnyConfig>(
    provider: ActionProvider<OpenApiGenerationProviderFn<VInput<PInput, TOutput>, POutput, PConfig>>,
    config?: Partial<PConfig>,
  ): _OpenApiGenerator<Merge<[TOutput, POutput]>> {
    // deno-lint-ignore no-explicit-any
    this._providers.push({ provider: provider as any, config });
    return new _OpenApiGenerator<Merge<[TOutput, POutput]>>(this._config, [...this._providers], this._parser);
  }

  public useType<
    PInput extends OpenApiGeneratorInput,
    POutput extends OpenApiGeneratorOutput,
    PConfig extends AnyConfig,
  >(
    type: EmptyConstructor<OpenApiGenerationProvider<VInput<PInput, TOutput>, POutput, PConfig>>,
    config?: Partial<PConfig>,
  ): _OpenApiGenerator<Merge<[TOutput, POutput]>> {
    return this.use(ActionProvider.fromType(type, 'generate'), config);
  }

  public useFn<PInput extends TOutput, POutput extends OpenApiGeneratorOutput, PConfig extends AnyConfig>(
    fn: OpenApiGenerationProviderFn<VInput<PInput, TOutput>, POutput, PConfig>,
    config?: Partial<PConfig>,
  ): _OpenApiGenerator<Merge<[TOutput, POutput]>> {
    return this.use(ActionProvider.fromFn(fn), config);
  }

  public useValue<PInput extends TOutput, POutput extends OpenApiGeneratorOutput, PConfig extends AnyConfig>(
    value: OpenApiGenerationProvider<VInput<PInput, TOutput>, POutput, PConfig>,
    config?: Partial<PConfig>,
  ): _OpenApiGenerator<Merge<[TOutput, POutput]>> {
    return this.use(ActionProvider.fromValue(value, 'generate'), config);
  }

  public async generate<T extends ApiData>(data: T): Promise<TOutput> {
    const absOutputPath = resolve(this._config.outputDir);
    if (this._config.clearOutputDir) {
      await fs.emptyDir(absOutputPath);
    } else {
      await fs.ensureDir(absOutputPath);
    }

    let input = {} as TOutput;
    for (const generator of this._providers) {
      const context = {
        data,
        input,
        config: this._config,
      };

      const result = await generator.provider.run(context, generator.config);
      if (result) {
        input = mergeDeep(input, result);
      }
    }

    return input;
  }

  public async parseAndGenerate(...fileNames: (string | string[])[]): Promise<TOutput> {
    const data = await this._parser.parseApisAndTransform(...fileNames);
    return await this.generate(data);
  }

  public async parseAndGenerateFromDir(dir: string, options?: Partial<DirectoryScanOptions>): Promise<TOutput> {
    const filter = (file: string) =>
      (file.endsWith('.yml') || file.endsWith('.yaml') || file.endsWith('.json')) && (options?.filter?.(file) ?? true);
    return this.parseAndGenerate(...(await getFiles(dir, { ...options, filter })));
  }
}

// deno-lint-ignore ban-types
export class OpenApiGenerator extends _OpenApiGenerator<{}> {
  constructor(config?: Partial<OpenApiGeneratorConfig>) {
    super(
      { ...defaultOpenApiGeneratorConfig, ...config },
      [],
      new OpenApiParser({ ...defaultOpenApiGeneratorConfig, ...config }),
    );
  }
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

export type DefaultGenerationProviderConfig<T extends AnyConfig> =
  & Omit<T, keyof OpenApiGeneratorConfig>
  & Partial<Pick<T, keyof OpenApiGeneratorConfig>>;

export abstract class OpenApiGenerationProviderBase<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TContext extends OpenApiGenerationProviderContext<TInput, TConfig>,
> implements OpenApiGenerationProvider<TInput, TOutput, TConfig> {
  public async generate(
    context: OpenApiGeneratorContext<TInput>,
    config?: Partial<TConfig> | undefined,
  ): Promise<TOutput> {
    const ctx = await this.buildContext(context, config);
    return await this.onGenerate(ctx);
  }

  protected getProviderContext(
    context: OpenApiGeneratorContext<TInput>,
    config: Partial<TConfig> | undefined,
    defaultConfig: DefaultGenerationProviderConfig<TConfig>,
  ): OpenApiGenerationProviderContext<TInput, TConfig> {
    const c = { ...context.config, ...defaultConfig, ...config } as unknown as OpenApiGeneratorConfig & TConfig;
    return Object.assign(context, {
      config: c,
    });
  }

  protected abstract buildContext(
    context: OpenApiGeneratorContext<TInput>,
    config?: Partial<TConfig> | undefined,
  ): TContext | Promise<TContext>;

  protected abstract onGenerate(ctx: TContext): TOutput | Promise<TOutput>;
}
