import { resolve } from 'path';

import { emptyDir, ensureDir } from 'fs-extra';

import { OpenApiGeneratorConfig, defaultOpenApiGeneratorConfig } from './config';
import {
  AnyConfig,
  OpenApiGenerationProvider,
  OpenApiGenerationProviderFn,
  OpenApiGenerationProviderType,
  OpenApiGeneratorContext,
  OpenApiGeneratorInput,
  OpenApiGeneratorOutput,
} from './types';
import { OpenApiParser } from '../parse/parser';
import { ApiData } from '../transform';
import { getInitializedValue } from '../utils';
import { Merge } from '../utils/type.utils';

type OpenApiGenerationProviders = (
  | {
      kind: 'providerCtor';
      generator: OpenApiGenerationProviderType<OpenApiGeneratorInput, OpenApiGeneratorOutput, AnyConfig>;
      config: AnyConfig | undefined;
    }
  | {
      kind: 'provider';
      generator: OpenApiGenerationProvider<OpenApiGeneratorInput, OpenApiGeneratorOutput, AnyConfig>;
      config: AnyConfig | undefined;
    }
  | {
      kind: 'providerFn';
      generator: OpenApiGenerationProviderFn<OpenApiGeneratorInput, OpenApiGeneratorOutput, AnyConfig>;
      config: AnyConfig | undefined;
    }
)[];

class _OpenApiGenerator<TOutput extends OpenApiGeneratorInput> {
  private _providers: OpenApiGenerationProviders;
  private _config: OpenApiGeneratorConfig;
  private _parser: OpenApiParser;

  constructor(config: OpenApiGeneratorConfig, providers: OpenApiGenerationProviders, parser: OpenApiParser) {
    this._providers = providers;
    this._config = config;
    this._parser = parser;
  }

  public use<PInput extends OpenApiGeneratorInput, POutput extends OpenApiGeneratorOutput, PConfig extends AnyConfig>(
    generator:
      | OpenApiGenerationProviderType<
          TOutput extends PInput
            ? PInput
            : { __error: 'The current output of the generator does not satisfy the input of this generator.' },
          POutput,
          PConfig
        >
      | OpenApiGenerationProvider<
          TOutput extends PInput
            ? PInput
            : { __error: 'The current output of the generator does not satisfy the input of this generator.' },
          POutput,
          PConfig
        >,
    config?: Partial<PConfig>
  ): _OpenApiGenerator<Merge<[TOutput, POutput]>> {
    if (typeof generator === 'function') {
      this._providers.push({
        kind: 'providerCtor',
        generator,
        config,
      });
    } else {
      this._providers.push({
        kind: 'provider',
        generator,
        config,
      });
    }

    return new _OpenApiGenerator<Merge<[TOutput, POutput]>>(this._config, [...this._providers], this._parser);
  }

  public useFn<PInput extends TOutput, POutput extends OpenApiGeneratorOutput, PConfig extends AnyConfig>(
    generator: OpenApiGenerationProviderFn<PInput, POutput, PConfig>,
    config?: Partial<PConfig>
  ): _OpenApiGenerator<Merge<[TOutput, POutput]>> {
    this._providers.push({
      kind: 'providerFn',
      generator: generator as OpenApiGenerationProviderFn<OpenApiGeneratorInput, OpenApiGeneratorOutput, AnyConfig>,
      config,
    });
    return this as unknown as _OpenApiGenerator<Merge<[TOutput, POutput]>>;
  }

  public async generate<T extends ApiData>(data: T): Promise<TOutput> {
    const absOutputPath = resolve(this._config.outputDir);
    if (this._config.clearOutputDir) {
      await emptyDir(absOutputPath);
    } else {
      await ensureDir(absOutputPath);
    }

    let input = {} as TOutput;
    for (const generator of this._providers) {
      const context = {
        data,
        input,
        config: this._config,
        state: new Map(),
      };

      let result: OpenApiGeneratorOutput | undefined;
      if (generator.kind === 'providerCtor') {
        const provider = new generator.generator();
        provider.init(context, generator.config);
        result = provider.generate();
      } else if (generator.kind === 'provider') {
        generator.generator.init(context, generator.config);
        result = generator.generator.generate();
      } else {
        result = generator.generator(context, generator.config);
      }

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
}

export class OpenApiGenerator extends _OpenApiGenerator<{}> {
  constructor(config?: Partial<OpenApiGeneratorConfig>) {
    super({ ...defaultOpenApiGeneratorConfig, ...config }, [], new OpenApiParser());
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

export type DefaultGenerationProviderConfig<T extends AnyConfig> = Omit<T, keyof OpenApiGeneratorConfig> &
  Partial<Pick<T, keyof OpenApiGeneratorConfig>>;

export abstract class OpenApiGenerationProviderBase<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig
> implements OpenApiGenerationProvider<TInput, TOutput, TConfig>
{
  private _context?: OpenApiGeneratorContext<TInput>;
  private _config?: OpenApiGeneratorConfig & TConfig;

  public get context(): OpenApiGeneratorContext<TInput> {
    return getInitializedValue(this._context);
  }
  public get config(): OpenApiGeneratorConfig & TConfig {
    return getInitializedValue(this._config);
  }
  public get input(): TInput {
    return this.context.input;
  }
  public get data(): ApiData {
    return this.context.data;
  }
  public get state(): Map<string, unknown> {
    return this.context.state;
  }

  public init(context: OpenApiGeneratorContext<TInput>, config?: Partial<TConfig>): void {
    this._context = context;
    this._config = { ...this.getDefaultConfig(), ...context.config, ...config } as unknown as OpenApiGeneratorConfig &
      TConfig;
  }

  public abstract generate(): TOutput;

  protected abstract getDefaultConfig(): DefaultGenerationProviderConfig<TConfig>;
}
