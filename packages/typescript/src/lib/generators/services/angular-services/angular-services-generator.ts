import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';

import { ensureDirSync, writeFileSync } from 'fs-extra';

import { ApiService, Factory, OpenApiGeneratorContext, OpenApiServicesGenerationProviderBase } from '@goast/core';

import {
  DefaultTypeScriptAngularServiceGenerator,
  TypeScriptAngularServiceGenerator,
} from './angular-service-generator';
import {
  TypeScriptAngularServicesGeneratorInput,
  TypeScriptAngularServicesGeneratorOutput,
  TypeScriptAngularServicesGeneratorConfig,
  TypeScriptAngularServiceGeneratorOutput,
  TypeScriptAngularServicesGeneratorContext,
  defaultTypeScriptAngularServicesGeneratorConfig,
} from './models';
import { ImportExportCollection } from '../../../import-collection';
import { getModulePathRelativeToFile, modifyString } from '../../../utils';

type Input = TypeScriptAngularServicesGeneratorInput;
type Output = TypeScriptAngularServicesGeneratorOutput;
type Config = TypeScriptAngularServicesGeneratorConfig;
type ServiceOutput = TypeScriptAngularServiceGeneratorOutput;
type Context = TypeScriptAngularServicesGeneratorContext;

export class TypeScriptAngularServicesGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _clientGeneratorFactory: Factory<TypeScriptAngularServiceGenerator, []>;

  constructor(clientGeneratorFactory?: Factory<TypeScriptAngularServiceGenerator, []>) {
    super();
    this._clientGeneratorFactory =
      clientGeneratorFactory ?? Factory.fromValue(new DefaultTypeScriptAngularServiceGenerator());
  }

  protected override initResult(): Output {
    return {
      services: {},
      servicesIndexFilePath: undefined,
    };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<Input>,
    config?: Partial<Config> | undefined
  ): Context {
    return this.getProviderContext(context, config, defaultTypeScriptAngularServicesGeneratorConfig);
  }

  public override onGenerate(ctx: Context): Output {
    const output = super.onGenerate(ctx);
    this.copyUtilsFiles(ctx);
    output.servicesIndexFilePath = this.generateIndexFile(ctx);
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
    ctx.output.services[service.id] = result;
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

    for (const clientId in ctx.output.services) {
      const client = ctx.output.services[clientId];
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

    const files = ['api-configuration.ts', 'base-service.ts', 'request-builder.ts', 'strict-http-response.ts'];
    if (ctx.config.clientMethodFlavor === 'response-handler') {
      files.push('response-handler.ts');
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
