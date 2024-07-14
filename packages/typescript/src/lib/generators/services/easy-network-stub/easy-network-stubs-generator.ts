import { dirname, resolve } from 'path';

import { copyFileSync, ensureDirSync } from 'fs-extra';

import {
  ApiService,
  AppendValueGroup,
  Factory,
  OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
  adjustCasing,
  appendValueGroup,
  toCasing,
  builderTemplate as s,
} from '@goast/core';

import {
  DefaultTypeScriptEasyNetworkStubGenerator,
  TypeScriptEasyNetworkStubGenerator,
} from './easy-network-stub-generator';
import {
  TypeScriptEasyNetworkStubsGeneratorInput,
  TypeScriptEasyNetworkStubsGeneratorOutput,
  TypeScriptEasyNetworkStubsGeneratorConfig,
  TypeScriptEasyNetworkStubGeneratorOutput,
  TypeScriptEasyNetworkStubsGeneratorContext,
  defaultTypeScriptEasyNetworkStubsGeneratorConfig,
} from './models';
import { getReferenceFactories } from './refs';
import { ts } from '../../../ast';
import { TypeScriptExportOutput } from '../../../common-results';
import { TypeScriptFileBuilder } from '../../../file-builder';

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

  public override onGenerate(ctx: Context): Output {
    const output = super.onGenerate(ctx);
    this.generateUtilsFiles(ctx);
    output.typescript.indexFiles = this.generateIndexFiles(ctx);
    return output;
  }

  protected override generateService(ctx: Context, service: ApiService): TypeScriptExportOutput {
    const clientGenerator = this._generatorFactory.create();
    return clientGenerator.generate({
      ...ctx,
      service,
    });
  }

  protected override addServiceResult(ctx: Context, service: ApiService, result: TypeScriptExportOutput): void {
    ctx.output.typescript.stubs[service.id] = result;
  }

  protected generateUtilsFiles(ctx: Context): void {
    const sourceDir = resolve(dirname(require.resolve('@goast/typescript')), '../assets/stubs/easy-network-stub');
    const targetDir = resolve(ctx.config.outputDir, ctx.config.utilsDir);
    ensureDirSync(targetDir);

    this.copyFile('easy-network-stub utils', sourceDir, targetDir, 'easy-network-stub.utils.ts');
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
          }),
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
                  s`return this.${toCasing(serviceNames[id], fieldCasing)} ??= ${ctx.refs.createEasyNetworkStubGroup.infer()}(this, this._stubWrapper, ${ts.reference(x.component, x.filePath)});`,
                ],
                '\n',
              ),
            }),
          }),
        ),
        ts.method('resetStubs', {
          accessModifier: 'public',
          returnType: 'this',
          body: appendValueGroup(
            [
              ...Object.keys(ctx.output.typescript.stubs).map(
                (id) => `this.${toCasing(serviceNames[id], fieldCasing)}?.reset();`,
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

  private copyFile(logName: string, sourceDir: string, targetDir: string, fileName: string): void {
    const source = resolve(sourceDir, fileName);
    const target = resolve(targetDir, fileName);
    console.log(`Generating ${logName} to ${target}...`);
    copyFileSync(source, target);
  }
}
