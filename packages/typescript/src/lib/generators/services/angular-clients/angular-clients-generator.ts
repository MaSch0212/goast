import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import { ApiService, Factory, OpenApiGeneratorContext, OpenApiServicesGenerationProviderBase } from '@goast/core';

import { DefaultTypeScriptAngularClientGenerator, TypeScriptAngularClientGenerator } from './angular-client-generator';
import {
  TypeScriptAngularClientsGeneratorInput,
  TypeScriptAngularClientsGeneratorOutput,
  TypeScriptAngularClientsGeneratorConfig,
  TypeScriptAngularClientGeneratorOutput,
  TypeScriptAngularClientsGeneratorContext,
  defaultTypeScriptAngularClientsGeneratorConfig,
} from './models';
import { ImportExportCollection } from '../../../import-collection';
import { getModulePathRelativeToFile, modifyString } from '../../../utils';

type Input = TypeScriptAngularClientsGeneratorInput;
type Output = TypeScriptAngularClientsGeneratorOutput;
type Config = TypeScriptAngularClientsGeneratorConfig;
type ServiceOutput = TypeScriptAngularClientGeneratorOutput;
type Context = TypeScriptAngularClientsGeneratorContext;

export class TypeScriptAngularClientsGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _clientGeneratorFactory: Factory<TypeScriptAngularClientGenerator, []>;

  constructor(clientGeneratorFactory?: Factory<TypeScriptAngularClientGenerator, []>) {
    super();
    this._clientGeneratorFactory =
      clientGeneratorFactory ?? Factory.fromValue(new DefaultTypeScriptAngularClientGenerator());
  }

  protected override initResult(): Output {
    return {
      clients: {},
      clientIndexFilePath: undefined,
    };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<Input>,
    config?: Partial<Config> | undefined
  ): Context {
    return this.getProviderContext(context, config, defaultTypeScriptAngularClientsGeneratorConfig);
  }

  public override onGenerate(ctx: Context): Output {
    const output = super.onGenerate(ctx);
    this.copyUtilsFiles(ctx);
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

    writeFileSync(filePath, this.generateIndexFileContent(ctx, filePath));

    return filePath;
  }

  protected getIndexFilePath(ctx: Context): string {
    return resolve(ctx.config.outputDir, ctx.config.indexFilePath ?? 'clients.ts');
  }

  protected shouldGenerateIndexFile(ctx: Context): boolean {
    return ctx.config.indexFilePath !== null;
  }

  protected generateIndexFileContent(ctx: Context, absoluteIndexFilePath: string): string {
    const exports = new ImportExportCollection();

    for (const clientId in ctx.output.clients) {
      const client = ctx.output.clients[clientId];
      exports.addExport(
        client.name,
        getModulePathRelativeToFile(absoluteIndexFilePath, client.filePath, ctx.config.importModuleTransformer)
      );
    }

    return exports.toString(ctx.config);
  }

  protected copyUtilsFiles(ctx: Context): void {
    const sourceDir = resolve(dirname(require.resolve('@goast/typescript')), '../assets/service/angular');
    const targetDir = resolve(ctx.config.outputDir, ctx.config.utilsDirPath);
    ensureDirSync(targetDir);

    const files = ['api-configuration.ts', 'base-service.ts', 'request-builder.ts'];
    if (ctx.config.clientMethodFlavor === 'response-handler') {
      files.push('response-handler.ts', 'strict-http-response.ts');
    }

    const rootUrl = this.getRootUrl(ctx);
    for (const file of files) {
      const fileContent = readFileSync(resolve(sourceDir, file))
        .toString()
        .replace(/@ROOT_URL@/g, rootUrl);
      writeFileSync(resolve(targetDir, file), fileContent);
    }
  }

  protected getRootUrl(ctx: Context): string {
    return modifyString<[]>(
      (ctx.data.services[0].$src ?? ctx.data.services[0].endpoints[0]?.$src)?.document.servers?.[0]?.url ?? '/',
      ctx.config.rootUrl
    );
  }
}
