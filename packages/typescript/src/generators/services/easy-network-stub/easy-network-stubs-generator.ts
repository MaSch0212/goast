import { resolve } from 'node:path';

// @deno-types="npm:@types/fs-extra"
import fs from 'fs-extra';

import {
  adjustCasing,
  type ApiService,
  type AppendValueGroup,
  appendValueGroup,
  builderTemplate as s,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
  toCasing,
} from '@goast/core';

import { copyAssetFile } from '../../../assets.ts';
import { ts } from '../../../ast/index.ts';
import type { TypeScriptExportOutput } from '../../../common-results.ts';
import { TypeScriptFileBuilder } from '../../../file-builder.ts';
import {
  DefaultTypeScriptEasyNetworkStubGenerator,
  type TypeScriptEasyNetworkStubGenerator,
} from './easy-network-stub-generator.ts';
import {
  defaultTypeScriptEasyNetworkStubsGeneratorConfig,
  type TypeScriptEasyNetworkStubGeneratorOutput,
  type TypeScriptEasyNetworkStubsGeneratorConfig,
  type TypeScriptEasyNetworkStubsGeneratorContext,
  type TypeScriptEasyNetworkStubsGeneratorInput,
  type TypeScriptEasyNetworkStubsGeneratorOutput,
} from './models.ts';
import { getReferenceFactories } from './refs.ts';

type Input = TypeScriptEasyNetworkStubsGeneratorInput;
type Output = TypeScriptEasyNetworkStubsGeneratorOutput;
type Config = TypeScriptEasyNetworkStubsGeneratorConfig;
type ServiceOutput = TypeScriptEasyNetworkStubGeneratorOutput;
type Context = TypeScriptEasyNetworkStubsGeneratorContext;

export class TypeScriptEasyNetworkStubsGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _generatorFactory: Factory<TypeScriptEasyNetworkStubGenerator, []>;

  constructor(generatorFactory?: Factory<TypeScriptEasyNetworkStubGenerator, []>) {
    super();
    this._generatorFactory = generatorFactory ?? Factory.fromValue(new DefaultTypeScriptEasyNetworkStubGenerator());
  }

  protected override initResult(): Output {
    return {
      typescript: {
        stubs: {},
        indexFiles: { stubs: undefined },
      },
    };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<Input>,
    config?: Partial<Config> | undefined,
  ): Context {
    const providerContext = this.getProviderContext(context, config, defaultTypeScriptEasyNetworkStubsGeneratorConfig);
    return Object.assign(providerContext, {
      refs: getReferenceFactories(providerContext.config),
    });
  }

  protected override async generateAdditionalFiles(ctx: TypeScriptEasyNetworkStubsGeneratorContext): Promise<void> {
    await this.generateUtilsFiles(ctx);
    ctx.output.typescript.indexFiles = this.generateIndexFiles(ctx);
  }

  protected override generateService(ctx: Context, service: ApiService): MaybePromise<TypeScriptExportOutput> {
    const clientGenerator = this._generatorFactory.create();
    return clientGenerator.generate({
      ...ctx,
      service,
    });
  }

  protected override addServiceResult(ctx: Context, service: ApiService, result: TypeScriptExportOutput): void {
    ctx.output.typescript.stubs[service.id] = result;
  }

  protected async generateUtilsFiles(ctx: Context): Promise<void> {
    const targetDir = resolve(ctx.config.outputDir, ctx.config.utilsDir);
    await fs.ensureDir(targetDir);

    await copyAssetFile('stubs/easy-network-stub/easy-network-stub.utils.ts', targetDir, 'easy-network-stub utils');
  }

  protected generateIndexFiles(ctx: Context): Output['typescript']['indexFiles'] {
    const stubsIndexFilePath = this.getStubsIndexFilePath(ctx);

    TypeScriptFileBuilder.tryGenerate({
      logName: 'stubs index file',
      filePath: stubsIndexFilePath,
      options: ctx.config,
      generator: (b) => b.append(this.getStubsIndexFileContent(ctx)),
    });

    return {
      stubs: stubsIndexFilePath,
    };
  }

  protected getStubsIndexFileContent(ctx: Context): AppendValueGroup<TypeScriptFileBuilder> {
    return appendValueGroup(
      [
        appendValueGroup(Object.values(ctx.output.typescript.stubs).map((x) => ts.export(x.component, x.filePath))),
        this.getStubsClass(ctx),
      ],
      '\n',
    );
  }

  protected getStubsClass(ctx: Context): ts.Class<TypeScriptFileBuilder> {
    const fieldCasing = adjustCasing(ctx.config.propertyNameCasing, { prefix: '_' });
    const serviceNames = Object.fromEntries(ctx.data.services.map((x) => [x.id, x.name]));
    return ts.class(this.getStubsClassName(ctx), {
      export: true,
      members: [
        ts.property('_stubWrapper', {
          accessModifier: 'private',
          readonly: true,
          type: ctx.refs.easyNetworkStubWrapper(),
        }),
        ...Object.entries(ctx.output.typescript.stubs).map(([id, x]) =>
          ts.property<TypeScriptFileBuilder>(toCasing(serviceNames[id], fieldCasing), {
            accessModifier: 'private',
            optional: true,
            type: ctx.refs.easyNetworkStubGroup([ts.reference(x.component, x.filePath), 'this']),
          })
        ),
        ts.constructor({
          parameters: [
            ts.constructorParameter('stub', { type: ts.refs.easyNetworkStub.easyNetworkStub() }),
            ts.constructorParameter('options', {
              type: ts.refs.partial([ctx.refs.easyNetworkStubWrapperOptions()]),
              optional: true,
            }),
          ],
          body: appendValueGroup(
            [s`this._stubWrapper = new ${ctx.refs.easyNetworkStubWrapper()}(stub, options);`],
            '\n',
          ),
        }),
        ts.property('requests', {
          accessModifier: 'public',
          type: ts.arrayType(ctx.refs.stubRequestItem(), { readonly: true }),
          get: ts.property.getter({
            body: appendValueGroup(['return this._stubWrapper.requests;'], '\n'),
          }),
        }),
        ...Object.entries(ctx.output.typescript.stubs).map(([id, x]) =>
          ts.property<TypeScriptFileBuilder>(toCasing(serviceNames[id], ctx.config.propertyNameCasing), {
            accessModifier: 'public',
            type: ctx.refs.easyNetworkStubGroup([ts.reference(x.component, x.filePath), 'this']),
            get: ts.property.getter({
              body: appendValueGroup(
                [
                  s`return this.${
                    toCasing(
                      serviceNames[id],
                      fieldCasing,
                    )
                  } ??= ${ctx.refs.createEasyNetworkStubGroup.infer()}(this, this._stubWrapper, ${
                    ts.reference(
                      x.component,
                      x.filePath,
                    )
                  });`,
                ],
                '\n',
              ),
            }),
          })
        ),
        ts.method('resetStubs', {
          accessModifier: 'public',
          returnType: 'this',
          body: appendValueGroup(
            [
              ...Object.keys(ctx.output.typescript.stubs).map((id) =>
                `this.${toCasing(serviceNames[id], fieldCasing)}?.reset();`
              ),
              'return this;',
            ],
            '\n',
          ),
        }),
      ],
    });
  }

  protected getStubsIndexFilePath(ctx: Context): string | null {
    return ctx.config.stubsIndexFile ? resolve(ctx.config.outputDir, ctx.config.stubsIndexFile) : null;
  }

  protected getStubsClassName(ctx: Context): string {
    return toCasing(`${ctx.config.domainName ?? ''}_ApiStubs`, ctx.config.typeNameCasing);
  }
}
