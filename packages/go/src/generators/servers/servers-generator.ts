import {
  type ApiService,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
} from '@goast/core';

import { getAssetFileContent } from '../../assets.ts';
import type { GoPackageInfo } from '../file-generator.ts';
import { getGoRuntimePackage, reserveGoRuntimeNames, writeGoRuntimeFile } from '../runtime.ts';
import {
  defaultGoServersGeneratorConfig,
  type GoServerGeneratorOutput,
  type GoServerRuntimeNames,
  type GoServersGeneratorConfig,
  type GoServersGeneratorContext,
  type GoServersGeneratorInput,
  type GoServersGeneratorOutput,
} from './models.ts';
import type { GoOperation } from './operation.ts';
import { DefaultGoServerGenerator, type GoServerGenerator } from './server-generator.ts';

type Input = GoServersGeneratorInput;
type Output = GoServersGeneratorOutput;
type Config = GoServersGeneratorConfig;
type ServiceOutput = GoServerGeneratorOutput;
type Context = GoServersGeneratorContext;

const runtimeAsset = 'servers/server_runtime.go';

/**
 * Generates servers based on `net/http`: for every service (tag) an interface to implement, with typed requests and
 * responses, and a function registering its operations on a `*http.ServeMux` (Go 1.22 or later). Needs the output of
 * the `GoModelsGenerator`, so it has to run after it.
 *
 * For each service (tag) it writes one file, `{outputDir}/{packagePath}/{service}_service.go`, where `{service}` is the
 * service name converted to a Go file name (e.g. `pets_service.go` for the tag `pets`). Once per run it also writes
 * `server_runtime.go` into the same package, with the options, errors and helpers the generated handlers use. It is
 * written only when at least one service was generated. Services named `exclude-from-generation` are removed from
 * `data.services` before generation.
 *
 * Publishes `go.servers`, keyed by service id, with `serviceInterface` and `registerFunction`. Each entry is a
 * reference that later generators can use to refer to them.
 * @see DefaultGoServerGenerator
 * @see GoServersGeneratorConfig
 */
export class GoServersGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _serviceGeneratorFactory: Factory<GoServerGenerator, []>;

  /**
   * Initializes a new instance of the GoServersGenerator class.
   * @param serviceGeneratorFactory Creates the generator of each service. Defaults to the default generator.
   */
  constructor(serviceGeneratorFactory?: Factory<GoServerGenerator, []>) {
    super();
    this._serviceGeneratorFactory = serviceGeneratorFactory ?? Factory.fromValue(new DefaultGoServerGenerator());
  }

  /** Returns the initial output, which has no servers yet. */
  protected override initResult(): Output {
    return {
      go: {
        servers: {},
      },
    };
  }

  /**
   * Builds the context shared by all services. It removes the services named `exclude-from-generation`, resolves the
   * package from `packagePath`, reserves the names of the server runtime in it, and creates the map of operations,
   * which gives an endpoint shared by several services one declaration.
   * @param context The context of the generation, whose data holds the services.
   * @param config The configuration to merge with the defaults.
   */
  protected override async buildContext(
    context: OpenApiGeneratorContext<GoServersGeneratorInput>,
    config?: Partial<Config> | undefined,
  ): Promise<Context> {
    context.data.services = context.data.services.filter((x) => x.name !== 'exclude-from-generation');
    const providerContext = this.getProviderContext(context, config, defaultGoServersGeneratorConfig);
    const pkg = this.getPackage(providerContext.config);
    return Object.assign(providerContext, {
      package: pkg,
      runtimeNames: this.reserveRuntimeNames(providerContext.data, pkg, await getAssetFileContent(runtimeAsset)),
      operations: new Map<string, GoOperation>(),
    });
  }

  /**
   * Generates the interface and the register function of one service, with a generator from the factory.
   * @param ctx The context shared by all services.
   * @param service The service (tag) to generate.
   */
  protected override generateService(ctx: Context, service: ApiService): MaybePromise<ServiceOutput> {
    const serviceGenerator = this._serviceGeneratorFactory.create();
    return serviceGenerator.generate({
      ...ctx,
      service,
    });
  }

  /**
   * Publishes the result of a service under `go.servers`, keyed by its service id.
   * @param ctx The context shared by all services.
   * @param service The service the result belongs to.
   * @param result The result of generating the service.
   */
  protected override addServiceResult(ctx: Context, service: ApiService, result: ServiceOutput): void {
    ctx.output.go.servers[service.id] = result;
  }

  /**
   * Writes `server_runtime.go`, but only if at least one service was generated.
   * @param ctx The context shared by all services.
   */
  protected override async generateAdditionalFiles(ctx: Context): Promise<void> {
    if (Object.keys(ctx.output.go.servers).length > 0) {
      await this.generateRuntime(ctx);
    }
  }

  /**
   * Gets the package the servers are generated into, from `packagePath`. Its directory is `outputDir` followed by the
   * path, its import path is `modulePath` followed by the path, and its name is `packageName` or else derived from the
   * last segment of the path. Backslashes are read as `/`, and leading and trailing slashes are removed.
   * @param config The configuration of the generator.
   */
  protected getPackage(config: Config): GoPackageInfo {
    return getGoRuntimePackage(config);
  }

  /**
   * Reserves the top-level identifiers of the runtime in the package. Exported ones the package declares already
   * (e.g. a schema named `RequestError`) get another name. Unexported ones keep theirs, since the models declare none.
   * @param run The data of the run, in which the identifiers are reserved.
   * @param pkg The package the servers are generated into.
   * @param runtime The content of the server runtime asset, whose top-level declarations are reserved.
   */
  protected reserveRuntimeNames(run: object, pkg: GoPackageInfo, runtime: string): GoServerRuntimeNames {
    return reserveGoRuntimeNames(run, pkg, runtime);
  }

  /**
   * Writes `server_runtime.go` into the package. The imports of the runtime asset are added to the file, and its
   * top-level identifiers are renamed to the names in `runtimeNames`.
   * @param ctx The context shared by all services.
   */
  protected async generateRuntime(ctx: Context): Promise<void> {
    await writeGoRuntimeFile({
      data: ctx.data,
      config: ctx.config,
      pkg: ctx.package,
      asset: runtimeAsset,
      fileName: 'server_runtime',
      runtimeNames: ctx.runtimeNames,
      label: 'server',
    });
  }
}
