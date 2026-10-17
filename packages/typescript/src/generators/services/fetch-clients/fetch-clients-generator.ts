import { resolve } from 'node:path';

import fs from 'fs-extra';

import {
  type ApiService,
  type AppendValueGroup,
  appendValueGroup,
  Factory,
  type MaybePromise,
  notNullish,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
} from '@goast/core';

import { copyAssetFile } from '../../../assets.ts';
import { ts } from '../../../ast/index.ts';
import { TypeScriptFileBuilder } from '../../../file-builder.ts';
import {
  DefaultTypeScriptFetchClientGenerator,
  type TypeScriptFetchClientGenerator,
} from './fetch-client-generator.ts';
import {
  defaultTypeScriptFetchClientsGeneratorConfig,
  type TypeScriptFetchClientGeneratorOutput,
  type TypeScriptFetchClientsGeneratorConfig,
  type TypeScriptFetchClientsGeneratorContext,
  type TypeScriptFetchClientsGeneratorInput,
  type TypeScriptFetchClientsGeneratorOutput,
} from './models.ts';
import { getReferenceFactories } from './refs.ts';

type Input = TypeScriptFetchClientsGeneratorInput;
type Output = TypeScriptFetchClientsGeneratorOutput;
type Config = TypeScriptFetchClientsGeneratorConfig;
type ServiceOutput = TypeScriptFetchClientGeneratorOutput;
type Context = TypeScriptFetchClientsGeneratorContext;

/**
 * Generates a fetch client class and/or client interface for each API service (tag).
 *
 * Each service produces `{outputDir}/{clientDir}/{service}-client.ts` (the class) and/or
 * `{outputDir}/{clientInterfaceDir}/{service}.ts` (the interface), depending on `clientFileKind`, where `{service}` is
 * the kebab-cased service name. The utilities are copied to `{outputDir}/{utilsDir}`. The index files
 * `{outputDir}/{clientsIndexFile}` and `{outputDir}/{clientInterfacesIndexFile}` are written when they are configured.
 *
 * It publishes `typescript.clients[serviceId]` with the `client` and `clientInterface` exports of each service, and
 * `typescript.indexFiles.clients` and `typescript.indexFiles.clientInterfaces` for subsequent generators.
 * @see TypeScriptFetchClientGenerator
 */
export class TypeScriptFetchClientsGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _clientGeneratorFactory: Factory<TypeScriptFetchClientGenerator, []>;

  /**
   * Initializes a new instance of the TypeScriptFetchClientsGenerator class.
   * @param clientGeneratorFactory The factory that creates the generator for each service. Defaults to a
   * `DefaultTypeScriptFetchClientGenerator`.
   */
  constructor(clientGeneratorFactory?: Factory<TypeScriptFetchClientGenerator, []>) {
    super();
    this._clientGeneratorFactory =
      clientGeneratorFactory ?? Factory.fromValue(new DefaultTypeScriptFetchClientGenerator());
  }

  protected override initResult(): Output {
    return {
      typescript: {
        clients: {},
        indexFiles: {
          clients: undefined,
          clientInterfaces: undefined,
        },
      },
    };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<Input>,
    config?: Partial<Config> | undefined,
  ): Context {
    const providerContext = this.getProviderContext(context, config, defaultTypeScriptFetchClientsGeneratorConfig);
    return Object.assign(providerContext, {
      refs: getReferenceFactories(providerContext.config),
    });
  }

  protected override async generateAdditionalFiles(ctx: TypeScriptFetchClientsGeneratorContext): Promise<void> {
    await this.copyUtilsFiles(ctx);
    ctx.output.typescript.indexFiles.clients = this.generateIndexFile(ctx);
    ctx.output.typescript.indexFiles.clientInterfaces = this.generateInterfaceIndexFile(ctx);
  }

  protected override generateService(ctx: Context, service: ApiService): MaybePromise<ServiceOutput> {
    const clientGenerator = this._clientGeneratorFactory.create();
    return clientGenerator.generate({
      ...ctx,
      service,
    });
  }

  protected override addServiceResult(ctx: Context, service: ApiService, result: ServiceOutput): void {
    ctx.output.typescript.clients[service.id] = result;
  }

  protected generateIndexFile(ctx: Context): string | null {
    const filePath = this.getIndexFilePath(ctx);

    TypeScriptFileBuilder.tryGenerate({
      logName: 'clients index file',
      filePath,
      options: ctx.config,
      generator: (b) => b.append(this.getIndexFileContent(ctx)),
    });

    return filePath;
  }

  protected generateInterfaceIndexFile(ctx: Context): string | null {
    const filePath = this.getInterfaceIndexFilePath(ctx);
    const clientsFilePath = this.getIndexFilePath(ctx);

    if (filePath && filePath === clientsFilePath) {
      return clientsFilePath;
    }

    TypeScriptFileBuilder.tryGenerate({
      logName: 'client interfaces index file',
      filePath,
      options: ctx.config,
      generator: (b) => b.append(this.getInterfaceIndexFileContent(ctx)),
    });

    return filePath;
  }

  protected getIndexFilePath(ctx: Context): string | null {
    return ctx.config.clientsIndexFile ? resolve(ctx.config.outputDir, ctx.config.clientsIndexFile) : null;
  }

  protected getInterfaceIndexFilePath(ctx: Context): string | null {
    return ctx.config.clientInterfacesIndexFile
      ? resolve(ctx.config.outputDir, ctx.config.clientInterfacesIndexFile)
      : null;
  }

  protected getIndexFileContent(ctx: Context): AppendValueGroup<TypeScriptFileBuilder> {
    const cIndexPath = this.getIndexFilePath(ctx);
    const iIndexPath = this.getInterfaceIndexFilePath(ctx);
    return appendValueGroup(
      (iIndexPath && iIndexPath === cIndexPath
        ? Object.values(ctx.output.typescript.clients).flatMap((c) => [c.client, c.clientInterface])
        : Object.values(ctx.output.typescript.clients).map((c) => c.client)
      )
        .filter(notNullish)
        .map((x) => ts.export(x.component, x.filePath)),
    );
  }

  protected getInterfaceIndexFileContent(ctx: Context): AppendValueGroup<TypeScriptFileBuilder> {
    return appendValueGroup(
      Object.values(ctx.output.typescript.clients)
        .map((c) => c.clientInterface)
        .filter(notNullish)
        .map((x) => ts.export(x.component, x.filePath)),
    );
  }

  private async copyUtilsFiles(ctx: Context): Promise<void> {
    const targetDir = resolve(ctx.config.outputDir, ctx.config.utilsDir);
    await fs.ensureDir(targetDir);

    await copyAssetFile('client/fetch/fetch-client.utils.ts', targetDir);
  }
}
