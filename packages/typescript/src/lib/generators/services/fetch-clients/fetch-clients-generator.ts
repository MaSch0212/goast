import { dirname, resolve } from 'path';

import { ensureDirSync, writeFileSync, copyFileSync, readdirSync } from 'fs-extra';

import { ApiService, OpenApiGeneratorContext, OpenApiServicesGenerationProviderBase, Factory } from '@goast/core';

import { DefaultTypeScriptFetchClientGenerator, TypeScriptFetchClientGenerator } from './fetch-client-generator';
import {
  TypeScriptFetchClientGeneratorOutput,
  TypeScriptFetchClientsGeneratorConfig,
  TypeScriptFetchClientsGeneratorContext,
  TypeScriptFetchClientsGeneratorInput,
  TypeScriptFetchClientsGeneratorOutput,
  defaultTypeScriptFetchClientsGeneratorConfig,
} from './models';
import { TypeScriptFileBuilder } from '../../../file-builder';
import { ImportExportCollection } from '../../../import-collection';

type Input = TypeScriptFetchClientsGeneratorInput;
type Output = TypeScriptFetchClientsGeneratorOutput;
type Config = TypeScriptFetchClientsGeneratorConfig;
type ServiceOutput = TypeScriptFetchClientGeneratorOutput;
type Context = TypeScriptFetchClientsGeneratorContext;

export class TypeScriptClientsGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _clientGeneratorFactory: Factory<TypeScriptFetchClientGenerator, []>;

  constructor(clientGeneratorFactory?: Factory<TypeScriptFetchClientGenerator, []>) {
    super();
    this._clientGeneratorFactory =
      clientGeneratorFactory ?? Factory.fromValue(new DefaultTypeScriptFetchClientGenerator());
  }

  protected override initResult(): Output {
    return {
      clients: {},
      clientIndexFilePath: undefined,
      clientInterfaceIndexFilePath: undefined,
    };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<Input>,
    config?: Partial<Config> | undefined
  ): Context {
    return this.getProviderContext(context, config, defaultTypeScriptFetchClientsGeneratorConfig);
  }

  public override onGenerate(ctx: Context): Output {
    this.copyUtilsFiles(ctx);
    const output = super.onGenerate(ctx);
    output.clientIndexFilePath = this.generateIndexFile(ctx);
    return output;
  }

  protected override generateService(ctx: Context, service: ApiService): ServiceOutput {
    const clientGenerator = this._clientGeneratorFactory.create();
    return clientGenerator.generate({
      ...ctx,
      service,
    });
  }

  protected override addServiceResult(ctx: Context, service: ApiService, result: ServiceOutput): void {
    ctx.output.clients[service.id] = result;
  }

  protected generateIndexFile(ctx: Context): string | undefined {
    if (!this.shouldGenerateIndexFile(ctx)) {
      return undefined;
    }

    const filePath = this.getIndexFilePath(ctx);
    console.log(`Generating index file to ${filePath}...`);
    ensureDirSync(dirname(filePath));

    const builder = new TypeScriptFileBuilder(filePath, ctx.config);
    this.generateIndexFileContent(ctx, builder);
    writeFileSync(filePath, builder.toString());

    return filePath;
  }

  protected getIndexFilePath(ctx: Context): string {
    return resolve(ctx.config.outputDir, ctx.config.indexFilePath ?? 'clients.ts');
  }

  protected shouldGenerateIndexFile(ctx: Context): boolean {
    return ctx.config.indexFilePath !== null;
  }

  protected generateIndexFileContent(ctx: Context, builder: TypeScriptFileBuilder) {
    const exports = new ImportExportCollection();

    for (const clientId in ctx.output.clients) {
      const client = ctx.output.clients[clientId];
      if (client.class?.filePath) {
        exports.addExport(client.class.component, client.class.filePath);
      }
      if (client.interface?.filePath) {
        exports.addExport(client.interface.component, client.interface.filePath);
      }
    }

    exports.writeTo(builder);
  }

  private copyUtilsFiles(ctx: Context): void {
    const sourceDir = resolve(dirname(require.resolve('@goast/typescript')), '../assets/client/fetch');
    const targetDir = resolve(ctx.config.outputDir, ctx.config.utilsDirPath);
    ensureDirSync(targetDir);

    const files = readdirSync(sourceDir);
    for (const file of files) {
      copyFileSync(resolve(sourceDir, file), resolve(targetDir, file));
    }
  }
}
