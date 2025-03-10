import { resolve } from 'node:path';

// @deno-types="npm:@types/fs-extra@11"
import fs from 'fs-extra';

import {
  type ApiService,
  type AppendValueGroup,
  appendValueGroup,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
  toCasing,
} from '@goast/core';

import { copyAssetFile } from '../../../assets.ts';
import { ts } from '../../../ast/index.ts';
import { TypeScriptFileBuilder } from '../../../file-builder.ts';
import { modifyString } from '../../../utils.ts';
import {
  DefaultTypeScriptAngularServiceGenerator,
  type TypeScriptAngularServiceGenerator,
} from './angular-service-generator.ts';
import {
  defaultTypeScriptAngularServicesGeneratorConfig,
  type TypeScriptAngularServiceGeneratorOutput,
  type TypeScriptAngularServicesGeneratorConfig,
  type TypeScriptAngularServicesGeneratorContext,
  type TypeScriptAngularServicesGeneratorInput,
  type TypeScriptAngularServicesGeneratorOutput,
} from './models.ts';
import { getReferenceFactories } from './refs.ts';

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
    this._clientGeneratorFactory = clientGeneratorFactory ??
      Factory.fromValue(new DefaultTypeScriptAngularServiceGenerator());
  }

  protected override initResult(): Output {
    return {
      typescript: {
        services: {},
        indexFiles: { services: undefined, responseModels: undefined },
      },
    };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<Input>,
    config?: Partial<Config> | undefined,
  ): Context {
    const providerContext = this.getProviderContext(context, config, defaultTypeScriptAngularServicesGeneratorConfig);
    return Object.assign(providerContext, {
      refs: getReferenceFactories(providerContext.config),
    });
  }

  protected override async generateAdditionalFiles(ctx: TypeScriptAngularServicesGeneratorContext): Promise<void> {
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
    ctx.output.typescript.services[service.id] = result;
  }

  // #region Utils
  protected async generateUtilsFiles(ctx: Context): Promise<void> {
    const targetDir = resolve(ctx.config.outputDir, ctx.config.utilsDir);
    await fs.ensureDir(targetDir);

    await copyAssetFile('client/angular/request-builder.ts', targetDir, 'Request Builder');
    await copyAssetFile('client/angular/angular-service.utils.ts', targetDir, 'Angular Service Utils');

    TypeScriptFileBuilder.generate({
      logName: 'api configuration',
      filePath: resolve(targetDir, 'api-configuration.ts'),
      options: ctx.config,
      generator: (b) => b.append(this.getApiConfigurationFileContent(ctx)),
    });

    TypeScriptFileBuilder.generate({
      logName: 'api base service',
      filePath: resolve(targetDir, 'api-base-service.ts'),
      options: ctx.config,
      generator: (b) => b.append(this.getApiBaseServiceFileContent(ctx)),
    });

    if (!ctx.config.strictResponseTypes) {
      TypeScriptFileBuilder.generate({
        logName: 'http status codes',
        filePath: resolve(targetDir, 'http-status-code.ts'),
        options: ctx.config,
        generator: (b) => b.append(this.getHttpStatusCodeFileContent(ctx)),
      });
    }

    if (ctx.config.provideKind === 'provide-fn') {
      TypeScriptFileBuilder.generate({
        logName: 'providers',
        filePath: resolve(targetDir, 'provide.ts'),
        options: ctx.config,
        generator: (b) => b.append(this.getProvideFnFileContent(ctx)),
      });
    }
  }

  protected getApiConfigurationFileContent(ctx: Context): AppendValueGroup<TypeScriptFileBuilder> {
    return appendValueGroup(
      [
        ts.class(toCasing(`${ctx.config.domainName ?? ''}ApiConfiguration`, ctx.config.typeNameCasing), {
          doc: ts.doc({ description: `${ctx.config.domainName ?? 'Global'} API Configuration.` }),
          decorators: [
            ts.decorator(ts.refs.angular.injectable(), [
              ctx.config.provideKind === 'root' ? ts.toNode({ providedIn: 'root' }) : null,
            ]),
          ],
          export: true,
          members: [
            ts.property('rootUrl', {
              accessModifier: 'public',
              type: ts.refs.string(),
              value: ts.string(this.getRootUrl(ctx)),
            }),
          ],
        }),
      ],
      '\n',
    );
  }

  protected getApiBaseServiceFileContent(ctx: Context): AppendValueGroup<TypeScriptFileBuilder> {
    return appendValueGroup(
      [
        ts.class('ApiBaseService', {
          doc: ts.doc({ description: 'Base class for API services.' }),
          export: true,
          abstract: true,
          members: [
            ts.property('config', {
              accessModifier: 'protected',
              value: (b) => b.append(ts.refs.angular.inject(), '(', ctx.refs.apiConfiguration(), ')'),
            }),
            ts.property('http', {
              accessModifier: 'protected',
              value: (b) => b.append(ts.refs.angular.inject(), '(', ts.refs.angular.httpClient(), ')'),
            }),
            ts.property('_rootUrl', { accessModifier: 'private', type: ts.refs.string(), value: ts.string('') }),
            ts.property('rootUrl', {
              doc: ts.doc({
                description:
                  `Gets or sets the root URL for API operations provided by this service.\nFalls back to \`${ctx.refs.apiConfiguration.refName}.rootUrl\` if not set in this service.`,
              }),
              accessModifier: 'public',
              type: ts.refs.string(),
              get: ts.property.getter({ body: 'return this._rootUrl || this.config.rootUrl;' }),
              set: ts.property.setter({ body: 'this._rootUrl = value;' }),
            }),
          ],
        }),
      ],
      '\n',
    );
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

  protected getProvideFnFileContent(ctx: Context): AppendValueGroup<TypeScriptFileBuilder> {
    return appendValueGroup(
      [
        ts.function(toCasing(`provide_${ctx.config.domainName ?? ''}_Api`, ctx.config.functionNameCasing), {
          doc: ts.doc({
            description: 'Provides all the API services' +
              (ctx.config.domainName ? ` for ${ctx.config.domainName}` : '') + '.',
          }),
          export: true,
          parameters: [ts.parameter('config', { type: ctx.refs.apiConfiguration(), optional: true })],
          returnType: ts.refs.angular.provider(),
          body: appendValueGroup([
            'return ',
            ts.tuple([
              (b) =>
                b.append(
                  'config ? { provide: ',
                  ctx.refs.apiConfiguration(),
                  ', useValue: config } : ',
                  ctx.refs.apiConfiguration(),
                ),
              ...Object.values(ctx.output.typescript.services).map((x) => ts.reference(x.component, x.filePath)),
            ]),
            ';',
          ]),
        }),
      ],
      '\n',
    );
  }

  protected getRootUrl(ctx: Context): string {
    return modifyString<[]>(
      (ctx.data.services[0].$src ?? ctx.data.services[0].endpoints[0]?.$src)?.document.servers?.[0]?.url ?? '/',
      ctx.config.rootUrl,
    );
  }
  // #endregion

  // #region Index
  protected generateIndexFiles(ctx: Context): Output['typescript']['indexFiles'] {
    const servicesIndexFilePath = this.getServicesIndexFilePath(ctx);
    const responseModelsIndexFilePath = this.getResponseModelsIndexFilePath(ctx);

    TypeScriptFileBuilder.tryGenerate({
      logName: 'services index file',
      filePath: servicesIndexFilePath,
      options: ctx.config,
      generator: (b) => b.append(this.getServicesIndexFileContent(ctx)),
    });

    TypeScriptFileBuilder.tryGenerate({
      logName: 'response models index file',
      filePath: responseModelsIndexFilePath,
      options: ctx.config,
      generator: (b) => b.append(this.getResponseModelsIndexFileContent(ctx)),
    });

    return {
      services: servicesIndexFilePath,
      responseModels: responseModelsIndexFilePath,
    };
  }

  protected getServicesIndexFileContent(ctx: Context): AppendValueGroup<TypeScriptFileBuilder> {
    return appendValueGroup([
      ts.export(ctx.refs.apiConfiguration.refName, ctx.refs.apiConfiguration.moduleNameOrfilePath),
      ctx.config.provideKind === 'provide-fn'
        ? ts.export(ctx.refs.provide.refName, ctx.refs.provide.moduleNameOrfilePath)
        : null,
      ...Object.values(ctx.output.typescript.services).map((x) => ts.export(x.component, x.filePath)),
    ]);
  }

  protected getResponseModelsIndexFileContent(ctx: Context): AppendValueGroup<TypeScriptFileBuilder> {
    return appendValueGroup(
      Object.values(ctx.output.typescript.services)
        .flatMap((x) => Object.values(x.responseModels))
        .map((x) => ts.export(x.component, x.filePath, { kind: 'type-export' })),
    );
  }

  protected getServicesIndexFilePath(ctx: Context): string | null {
    return ctx.config.servicesIndexFile ? resolve(ctx.config.outputDir, ctx.config.servicesIndexFile) : null;
  }

  protected getResponseModelsIndexFilePath(ctx: Context): string | null {
    return ctx.config.responseModelsIndexFile
      ? resolve(ctx.config.outputDir, ctx.config.responseModelsIndexFile)
      : null;
  }
  // #endregion
}
