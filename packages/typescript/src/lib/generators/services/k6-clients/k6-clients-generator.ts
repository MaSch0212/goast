import { dirname, resolve } from 'path';

import fs from 'fs-extra';

import {
  OpenApiServicesGenerationProviderBase,
  Factory,
  OpenApiGeneratorContext,
  ApiService,
  AppendValueGroup,
  appendValueGroup,
} from '@goast/core';

import { DefaultTypeScriptK6ClientGenerator, TypeScriptK6ClientGenerator } from './k6-client-generator';
import {
  TypeScriptK6ClientsGeneratorInput,
  TypeScriptK6ClientsGeneratorOutput,
  TypeScriptK6ClientsGeneratorConfig,
  TypeScriptK6ClientGeneratorOutput,
  TypeScriptK6ClientsGeneratorContext,
  defaultTypeScriptK6ClientsGeneratorConfig,
} from './models';
import { getReferenceFactories } from './refs';
import { ts } from '../../../ast';
import { TypeScriptFileBuilder } from '../../../file-builder';

type Input = TypeScriptK6ClientsGeneratorInput;
type Output = TypeScriptK6ClientsGeneratorOutput;
type Config = TypeScriptK6ClientsGeneratorConfig;
type ServiceOutput = TypeScriptK6ClientGeneratorOutput;
type Context = TypeScriptK6ClientsGeneratorContext;

export class TypeScriptK6ClientsGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _clientGeneratorFactory: Factory<TypeScriptK6ClientGenerator, []>;

  constructor(clientGeneratorFactory?: Factory<TypeScriptK6ClientGenerator, []>) {
    super();
    this._clientGeneratorFactory =
      clientGeneratorFactory ?? Factory.fromValue(new DefaultTypeScriptK6ClientGenerator());
  }

  protected override initResult(): Output {
    return {
      typescript: {
        k6Clients: {},
        indexFiles: {
          k6Clients: undefined,
          k6ResponseModels: undefined,
        },
      },
    };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<Input>,
    config?: Partial<Config> | undefined,
  ): Context {
    const providerContext = this.getProviderContext(context, config, defaultTypeScriptK6ClientsGeneratorConfig);
    return Object.assign(providerContext, {
      refs: getReferenceFactories(providerContext.config),
    });
  }

  public override onGenerate(ctx: Context): Output {
    const output = super.onGenerate(ctx);
    this.generateUtilsFiles(ctx);
    output.typescript.indexFiles = this.generateIndexFiles(ctx);
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
    ctx.output.typescript.k6Clients[service.id] = result;
  }

  protected generateUtilsFiles(ctx: Context): void {
    const sourceDir = resolve(dirname(require.resolve('@goast/typescript')), '../assets/client/k6');
    const targetDir = resolve(ctx.config.outputDir, ctx.config.utilsDir);
    fs.ensureDirSync(targetDir);

    this.copyFile('Request Builder', sourceDir, targetDir, 'request-builder.js');

    if (!ctx.config.strictResponseTypes) {
      TypeScriptFileBuilder.generate({
        logName: 'http status codes',
        filePath: resolve(targetDir, 'http-status-code.ts'),
        options: ctx.config,
        generator: (b) => b.append(this.getHttpStatusCodeFileContent(ctx)),
      });
    }
  }

  protected getHttpStatusCodeFileContent(ctx: Context): AppendValueGroup<TypeScriptFileBuilder> {
    return appendValueGroup(
      [
        ts.typeAlias('HttpStatusCode', ts.unionType(ctx.config.possibleStatusCodes), {
          doc: ts.doc({ description: 'The possible status codes that any API endpoint can return.' }),
          export: true,
        }),
      ],
      '\n',
    );
  }

  protected generateIndexFiles(ctx: Context): Output['typescript']['indexFiles'] {
    const clientsIndexFilePath = this.getIndexFilePath(ctx);
    const responseModelsIndexFilePath = this.getResponseModelsIndexFilePath(ctx);

    TypeScriptFileBuilder.tryGenerate({
      logName: 'clients index file',
      filePath: clientsIndexFilePath,
      options: ctx.config,
      generator: (b) => b.append(this.getIndexFileContent(ctx)),
    });

    TypeScriptFileBuilder.tryGenerate({
      logName: 'response models index file',
      filePath: responseModelsIndexFilePath,
      options: ctx.config,
      generator: (b) => b.append(this.getResponseModelsIndexFileContent(ctx)),
    });

    return {
      k6Clients: clientsIndexFilePath,
      k6ResponseModels: responseModelsIndexFilePath,
    };
  }

  protected getIndexFilePath(ctx: Context): string | null {
    return ctx.config.clientsIndexFile ? resolve(ctx.config.outputDir, ctx.config.clientsIndexFile) : null;
  }

  protected getResponseModelsIndexFilePath(ctx: Context): string | null {
    return ctx.config.responseModelsIndexFile
      ? resolve(ctx.config.outputDir, ctx.config.responseModelsIndexFile)
      : null;
  }

  protected getIndexFileContent(ctx: Context): AppendValueGroup<TypeScriptFileBuilder> {
    return appendValueGroup(
      Object.values(ctx.output.typescript.k6Clients).map((x) => ts.export(x.component, x.filePath)),
    );
  }

  protected getResponseModelsIndexFileContent(ctx: Context): AppendValueGroup<TypeScriptFileBuilder> {
    return appendValueGroup(
      Object.values(ctx.output.typescript.k6Clients)
        .flatMap((x) => Object.values(x.responseModels))
        .map((x) => ts.export(x.component, x.filePath)),
    );
  }

  private copyFile(logName: string, sourceDir: string, targetDir: string, fileName: string): void {
    const source = resolve(sourceDir, fileName);
    const target = resolve(targetDir, fileName);
    console.log(`Generating ${logName} to ${target}...`);
    fs.copyFileSync(source, target);
  }
}
