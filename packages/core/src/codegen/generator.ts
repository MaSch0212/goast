import { resolve } from 'node:path';

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

type VInput<TActual, TExpected> = TExpected extends TActual
  ? TActual
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

  /**
   * Adds a generation provider to the pipeline. Providers run in the order they were added.
   * @template PInput The input the provider requires. The output of the providers added so far must satisfy it.
   * @template POutput The output produced by the provider.
   * @template PConfig The type of the provider-specific configuration.
   * @param provider The provider to add. Its output is deep-merged into the input of the following providers.
   * @param config The provider-specific configuration that is passed to the provider when it runs.
   * @returns A new generator whose output type includes the output of the added provider.
   */
  public use<PInput extends OpenApiGeneratorInput, POutput extends OpenApiGeneratorOutput, PConfig extends AnyConfig>(
    provider: ActionProvider<OpenApiGenerationProviderFn<VInput<PInput, TOutput>, POutput, PConfig>>,
    config?: Partial<PConfig>,
  ): _OpenApiGenerator<Merge<[TOutput, POutput]>> {
    this._providers.push({ provider: provider as any, config });
    return new _OpenApiGenerator<Merge<[TOutput, POutput]>>(this._config, [...this._providers], this._parser);
  }

  /**
   * Adds a generation provider from a class. A new instance of the class is created when the generator runs,
   * and its `generate` method is called to produce the output.
   * @template PInput The input the provider requires. The output of the providers added so far must satisfy it.
   * @template POutput The output produced by the provider.
   * @template PConfig The type of the provider-specific configuration.
   * @param type The class of the provider. It must have a constructor without parameters.
   * @param config The provider-specific configuration that is passed to the provider when it runs.
   * @returns A new generator whose output type includes the output of the added provider.
   * @see OpenApiGenerationProvider
   */
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

  /**
   * Adds a generation provider from a function. The function is called when the generator runs.
   * @template PInput The input the function requires. The output of the providers added so far must satisfy it.
   * @template POutput The output produced by the function.
   * @template PConfig The type of the provider-specific configuration.
   * @param fn The function that produces the output of the provider.
   * @param config The provider-specific configuration that is passed to the function when it runs.
   * @returns A new generator whose output type includes the output of the added provider.
   * @see OpenApiGenerationProviderFn
   */
  public useFn<PInput extends TOutput, POutput extends OpenApiGeneratorOutput, PConfig extends AnyConfig>(
    fn: OpenApiGenerationProviderFn<VInput<PInput, TOutput>, POutput, PConfig>,
    config?: Partial<PConfig>,
  ): _OpenApiGenerator<Merge<[TOutput, POutput]>> {
    return this.use(ActionProvider.fromFn(fn), config);
  }

  /**
   * Adds a generation provider from an object. Its `generate` method is called when the generator runs.
   * @template PInput The input the provider requires. The output of the providers added so far must satisfy it.
   * @template POutput The output produced by the provider.
   * @template PConfig The type of the provider-specific configuration.
   * @param value The object that produces the output of the provider.
   * @param config The provider-specific configuration that is passed to the provider when it runs.
   * @returns A new generator whose output type includes the output of the added provider.
   * @see OpenApiGenerationProvider
   */
  public useValue<PInput extends TOutput, POutput extends OpenApiGeneratorOutput, PConfig extends AnyConfig>(
    value: OpenApiGenerationProvider<VInput<PInput, TOutput>, POutput, PConfig>,
    config?: Partial<PConfig>,
  ): _OpenApiGenerator<Merge<[TOutput, POutput]>> {
    return this.use(ActionProvider.fromValue(value, 'generate'), config);
  }

  /**
   * Runs all added generation providers in order on already parsed API data.
   * The output directory and the `outputDir` of each provider that defines one are created, or emptied first if
   * `clearOutputDir` is enabled. Each provider receives the merged output of the providers that ran before it.
   * @template T The type of the parsed and transformed API data.
   * @param data The parsed and transformed API data of the OpenAPI specifications.
   * @returns The merged output of all providers.
   */
  public async generate<T extends ApiData>(data: T): Promise<TOutput> {
    const absOutputPath = resolve(this._config.outputDir);
    if (this._config.clearOutputDir) {
      await fs.emptyDir(absOutputPath);
    } else {
      await fs.ensureDir(absOutputPath);
    }

    this._providers.forEach(({ config }) => {
      if (config && 'outputDir' in config && config.outputDir && typeof config.outputDir === 'string') {
        const providerOutputDir = resolve(config.outputDir);
        if (this._config.clearOutputDir) {
          fs.emptyDirSync(providerOutputDir);
        } else {
          fs.ensureDirSync(providerOutputDir);
        }
      }
    });

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

  /**
   * Parses and transforms the given OpenAPI specification files, then runs the generation providers on the result.
   * @param fileNames The paths of the specification files. Each argument can be a single path or an array of paths.
   * @returns The merged output of all providers.
   */
  public async parseAndGenerate(...fileNames: (string | string[])[]): Promise<TOutput> {
    const data = await this._parser.parseApisAndTransform(...fileNames);
    return await this.generate(data);
  }

  /**
   * Parses and transforms all OpenAPI specification files in a directory, then runs the generation providers on the
   * result. Only files with the extensions `.json`, `.yaml` and `.yml` are considered. The directory is scanned
   * non-recursively unless `options.recursive` is enabled.
   * @param dir The directory that contains the specification files.
   * @param options Options for scanning the directory, including an optional filter for the files to consider.
   * @returns The merged output of all providers.
   */
  public async parseAndGenerateFromDir(dir: string, options?: Partial<DirectoryScanOptions>): Promise<TOutput> {
    const filter = (file: string) =>
      (file.endsWith('.yml') || file.endsWith('.yaml') || file.endsWith('.json')) && (options?.filter?.(file) ?? true);
    return this.parseAndGenerate(...(await getFiles(dir, { ...options, filter })));
  }
}

/**
 * Generates output from OpenAPI specifications by running a pipeline of generation providers.
 * Providers are added with `useType`, `useFn` or `useValue` and run in the order they were added. Each provider can
 * read the output of the providers before it from `ctx.input`.
 * @example
 * ```ts
 * import { OpenApiGenerator } from '@goast/core';
 * import { TypeScriptModelsGenerator } from '@goast/typescript';
 *
 * const generator = new OpenApiGenerator()
 *   // Add a generator using a class
 *   .useType(TypeScriptModelsGenerator)
 *   // Add a generator using a function that can read the output of the previous generator from `ctx.input`
 *   .useFn((ctx, cfg) => {
 *     // Do the generation
 *     return {}; // Return information about the generated files so it can be used by other generators
 *   });
 *
 * // Generate for all OpenAPI specification files in a directory
 * await generator.parseAndGenerateFromDir('path/to/openapi/specs');
 * ```
 */
export class OpenApiGenerator extends _OpenApiGenerator<{}> {
  /**
   * Initializes a new instance of the OpenApiGenerator class.
   * @param config The configuration to use. Options that are not specified fall back to
   * `defaultOpenApiGeneratorConfig`.
   */
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

/**
 * The default configuration of a generation provider. The options of `OpenApiGeneratorConfig` become optional and fall
 * back to the generator configuration, while the provider-specific options keep their own optionality.
 * @template T The type of the provider configuration.
 */
export type DefaultGenerationProviderConfig<T extends AnyConfig> = Omit<T, keyof OpenApiGeneratorConfig> &
  Partial<Pick<T, keyof OpenApiGeneratorConfig>>;

/**
 * Base class for generation providers. Subclasses implement `buildContext`, which creates a provider-specific context
 * from the generator context and configuration, and `onGenerate`, which produces the output from that context.
 * @template TInput The type of the merged output of the providers that ran before.
 * @template TOutput The type of the output produced by the provider.
 * @template TConfig The type of the provider-specific configuration.
 * @template TContext The type of the context that is created by `buildContext` and consumed by `onGenerate`.
 * @see OpenApiGenerationProvider
 */
export abstract class OpenApiGenerationProviderBase<
  TInput extends OpenApiGeneratorInput,
  TOutput extends OpenApiGeneratorOutput,
  TConfig extends AnyConfig,
  TContext extends OpenApiGenerationProviderContext<TInput, TConfig>,
> implements OpenApiGenerationProvider<TInput, TOutput, TConfig> {
  /**
   * Generates the output of this provider by building its context and then calling `onGenerate` with it.
   * @param context The context of the generator, including the output of the providers that ran before.
   * @param config The provider-specific configuration, if any.
   * @returns The output of this provider.
   */
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
