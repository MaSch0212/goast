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
import { type GoClientGenerator, DefaultGoClientGenerator } from './client-generator.ts';
import {
  defaultGoClientsGeneratorConfig,
  type GoClientGeneratorOutput,
  type GoClientRuntimeNames,
  type GoClientsGeneratorConfig,
  type GoClientsGeneratorContext,
  type GoClientsGeneratorInput,
  type GoClientsGeneratorOutput,
} from './models.ts';
import type { GoClientOperation } from './operation.ts';

type Input = GoClientsGeneratorInput;
type Output = GoClientsGeneratorOutput;
type Config = GoClientsGeneratorConfig;
type ServiceOutput = GoClientGeneratorOutput;
type Context = GoClientsGeneratorContext;

const runtimeAsset = 'clients/client_runtime.go';

/**
 * Generates clients based on `net/http`: for every service (tag) a client type with a method per operation, which
 * builds the request, sends it and returns the decoded body of the success response, or an error. Needs the output of
 * the `GoModelsGenerator`, so it has to run after it.
 *
 * For each service (tag) it writes one file, `{outputDir}/{packagePath}/{service}_client.go`, where `{service}` is the
 * service name converted to a Go file name (e.g. `pets_client.go` for the tag `pets`). Once per run it also writes
 * `client_runtime.go` into the same package, with the options, errors and helpers the generated clients use. It is
 * written only when at least one service was generated. Services named `exclude-from-generation` are removed from
 * `data.services` before generation.
 *
 * Publishes `go.clients`, keyed by service id, with `client` and `constructor`. Each entry is a reference that later
 * generators can use to refer to them.
 * @see DefaultGoClientGenerator
 * @see GoClientsGeneratorConfig
 */
export class GoClientsGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _serviceGeneratorFactory: Factory<GoClientGenerator, []>;

  /**
   * Initializes a new instance of the GoClientsGenerator class.
   * @param serviceGeneratorFactory Creates the generator of each service. Defaults to the default generator.
   */
  constructor(serviceGeneratorFactory?: Factory<GoClientGenerator, []>) {
    super();
    this._serviceGeneratorFactory = serviceGeneratorFactory ?? Factory.fromValue(new DefaultGoClientGenerator());
  }

  /** Returns the initial output, which has no clients yet. */
  protected override initResult(): Output {
    return {
      go: {
        clients: {},
      },
    };
  }

  /**
   * Builds the context shared by all services. It removes the services named `exclude-from-generation`, resolves the
   * package from `packagePath`, reserves the names of the client runtime in it, and creates the map of operations,
   * which gives an endpoint shared by several services one declaration.
   * @param context The context of the generation, whose data holds the services.
   * @param config The configuration to merge with the defaults.
   */
  protected override async buildContext(
    context: OpenApiGeneratorContext<GoClientsGeneratorInput>,
    config?: Partial<Config> | undefined,
  ): Promise<Context> {
    context.data.services = context.data.services.filter((x) => x.name !== 'exclude-from-generation');
    const providerContext = this.getProviderContext(context, config, defaultGoClientsGeneratorConfig);
    const pkg = this.getPackage(providerContext.config);
    return Object.assign(providerContext, {
      package: pkg,
      runtimeNames: this.reserveRuntimeNames(providerContext.data, pkg, await getAssetFileContent(runtimeAsset)),
      operations: new Map<string, GoClientOperation>(),
    });
  }

  /**
   * Generates the client of one service, with a generator from the factory.
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
   * Publishes the result of a service under `go.clients`, keyed by its service id.
   * @param ctx The context shared by all services.
   * @param service The service the result belongs to.
   * @param result The result of generating the service.
   */
  protected override addServiceResult(ctx: Context, service: ApiService, result: ServiceOutput): void {
    ctx.output.go.clients[service.id] = result;
  }

  /**
   * Writes `client_runtime.go`, but only if at least one service was generated.
   * @param ctx The context shared by all services.
   */
  protected override async generateAdditionalFiles(ctx: Context): Promise<void> {
    if (Object.keys(ctx.output.go.clients).length > 0) {
      await this.generateRuntime(ctx);
    }
  }

  /**
   * Gets the package the clients are generated into, from `packagePath`. Its directory is `outputDir` followed by the
   * path, its import path is `modulePath` followed by the path, and its name is `packageName` or else derived from the
   * last segment of the path. Backslashes are read as `/`, and leading and trailing slashes are removed.
   * @param config The configuration of the generator.
   */
  protected getPackage(config: Config): GoPackageInfo {
    return getGoRuntimePackage(config);
  }

  /**
   * Reserves the top-level identifiers of the runtime in the package. Exported ones the package declares already
   * (e.g. a schema named `ClientOption`) get another name. Unexported ones keep theirs, since the models declare none.
   * @param run The data of the run, in which the identifiers are reserved.
   * @param pkg The package the clients are generated into.
   * @param runtime The content of the client runtime asset, whose top-level declarations are reserved.
   */
  protected reserveRuntimeNames(run: object, pkg: GoPackageInfo, runtime: string): GoClientRuntimeNames {
    return reserveGoRuntimeNames(run, pkg, runtime);
  }

  /**
   * Writes `client_runtime.go` into the package. The imports of the runtime asset are added to the file, and its
   * top-level identifiers are renamed to the names in `runtimeNames`.
   * @param ctx The context shared by all services.
   */
  protected async generateRuntime(ctx: Context): Promise<void> {
    await writeGoRuntimeFile({
      data: ctx.data,
      config: ctx.config,
      pkg: ctx.package,
      asset: runtimeAsset,
      fileName: 'client_runtime',
      runtimeNames: ctx.runtimeNames,
      label: 'client',
    });
  }
}
