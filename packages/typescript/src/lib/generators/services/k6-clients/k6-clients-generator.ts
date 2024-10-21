import { resolve } from 'node:path';

// @deno-types="@types/fs-extra"
import fs from 'fs-extra';

import {
  type ApiService,
  type AppendValueGroup,
  appendValueGroup,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
} from '@goast/core';

import { DefaultTypeScriptK6ClientGenerator, type TypeScriptK6ClientGenerator } from './k6-client-generator.ts';
import {
  defaultTypeScriptK6ClientsGeneratorConfig,
  type TypeScriptK6ClientGeneratorOutput,
  type TypeScriptK6ClientsGeneratorConfig,
  type TypeScriptK6ClientsGeneratorContext,
  type TypeScriptK6ClientsGeneratorInput,
  type TypeScriptK6ClientsGeneratorOutput,
} from './models.ts';
import { getReferenceFactories } from './refs.ts';
import { ts } from '../../../ast/index.ts';
import { TypeScriptFileBuilder } from '../../../file-builder.ts';
import { copyAssetFile } from '../../../assets.ts';

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
    this._clientGeneratorFactory = clientGeneratorFactory ??
      Factory.fromValue(new DefaultTypeScriptK6ClientGenerator());
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

  protected override async generateAdditionalFiles(ctx: TypeScriptK6ClientsGeneratorContext): Promise<void> {
    await this.generateUtilsFiles(ctx);
    ctx.output.typescript.indexFiles = this.generateIndexFiles(ctx);
  }

  protected override generateService(ctx: Context, service: ApiService): MaybePromise<ServiceOutput> {
    const clientGenerator = this._clientGeneratorFactory.create();
    return clientGenerator.generate({
      ...ctx,
      service,
    });
  }

  protected override addServiceResult(ctx: Context, service: ApiService, result: ServiceOutput): void {
    ctx.output.typescript.k6Clients[service.id] = result;
  }

  protected async generateUtilsFiles(ctx: Context): Promise<void> {
    const targetDir = resolve(ctx.config.outputDir, ctx.config.utilsDir);
    await fs.ensureDir(targetDir);

    await copyAssetFile('client/k6/request-builder.js', targetDir, 'Request Builder');

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
}
