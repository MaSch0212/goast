import {
  type ApiService,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
} from '@goast/core';

import { getAssetFileContent } from '../../assets.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import { getGoIdentifierRegistry } from '../../identifier-registry.ts';
import { toGoPackageName } from '../../utils.ts';
import type { GoPackageInfo } from '../file-generator.ts';
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
 * the `GoModelsGenerator`.
 */
export class GoServersGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _serviceGeneratorFactory: Factory<GoServerGenerator, []>;

  constructor(serviceGeneratorFactory?: Factory<GoServerGenerator, []>) {
    super();
    this._serviceGeneratorFactory = serviceGeneratorFactory ?? Factory.fromValue(new DefaultGoServerGenerator());
  }

  protected override initResult(): Output {
    return {
      go: {
        servers: {},
      },
    };
  }

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

  protected override generateService(ctx: Context, service: ApiService): MaybePromise<ServiceOutput> {
    const serviceGenerator = this._serviceGeneratorFactory.create();
    return serviceGenerator.generate({
      ...ctx,
      service,
    });
  }

  protected override addServiceResult(ctx: Context, service: ApiService, result: ServiceOutput): void {
    ctx.output.go.servers[service.id] = result;
  }

  protected override async generateAdditionalFiles(ctx: Context): Promise<void> {
    if (Object.keys(ctx.output.go.servers).length > 0) {
      await this.generateRuntime(ctx);
    }
  }

  /** The package the servers are generated into. */
  protected getPackage(config: Config): GoPackageInfo {
    const path = config.packagePath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    const modulePath = config.modulePath.replace(/\/+$/, '');
    return {
      path,
      name: config.packageName ?? toGoPackageName(path || modulePath),
      importPath: path ? `${modulePath}/${path}` : modulePath,
      dir: path ? `${config.outputDir}/${path}` : config.outputDir,
    };
  }

  /**
   * Reserves the top-level identifiers of the runtime in the package. Exported ones the package declares already
   * (e.g. a schema named `RequestError`) get another name. Unexported ones keep theirs, since the models declare none.
   */
  protected reserveRuntimeNames(run: object, pkg: GoPackageInfo, runtime: string): GoServerRuntimeNames {
    const registry = getGoIdentifierRegistry(run, pkg.importPath);
    const names: GoServerRuntimeNames = {};
    for (const [, name] of runtime.matchAll(/^(?:func|type|var|const) ([A-Za-z_][A-Za-z0-9_]*)/gm)) {
      names[name] = registry.reserve(name, `runtime:${name}`);
    }
    return names;
  }

  /** The file with the options, errors and helpers the generated handlers use. */
  protected async generateRuntime(ctx: Context): Promise<void> {
    const pkg = ctx.package;
    const files = getGoIdentifierRegistry(ctx.data, `${pkg.importPath}\u0000files`);
    const filePath = `${pkg.dir}/${files.reserve('server_runtime')}.go`;
    console.log(`Generating server runtime to ${filePath}...`);

    const runtime = await getAssetFileContent(runtimeAsset);
    const importBlock = /^import \(\n([\s\S]*?)\n\)\n/m.exec(runtime);
    if (!importBlock) throw new Error(`The asset ${runtimeAsset} has no import block.`);

    const builder = new GoFileBuilder(pkg.name, pkg.importPath, ctx.config);
    for (const [, path] of importBlock[1].matchAll(/"([^"]+)"/g)) {
      builder.imports.addImport(path);
    }
    let body = runtime.slice(importBlock.index + importBlock[0].length);
    for (const [name, renamed] of Object.entries(ctx.runtimeNames)) {
      if (name !== renamed) body = body.replace(new RegExp(`\\b${name}\\b`, 'g'), renamed);
    }
    builder.append(body);
    builder.writeToFile(filePath);
  }
}
