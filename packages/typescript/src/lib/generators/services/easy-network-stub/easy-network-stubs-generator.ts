import { dirname, resolve } from 'path';

import { copyFileSync, ensureDirSync } from 'fs-extra';

import {
  ApiService,
  AppendValueGroup,
  Factory,
  OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
  appendValueGroup,
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
      stubs: {},
      indexFiles: { stubs: undefined },
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
    output.indexFiles = this.generateIndexFiles(ctx);
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
    ctx.output.stubs[service.id] = result;
  }

  protected generateUtilsFiles(ctx: Context): void {
    const sourceDir = resolve(dirname(require.resolve('@goast/typescript')), '../assets/stubs/easy-network-stub');
    const targetDir = resolve(ctx.config.outputDir, ctx.config.utilsDirPath);
    ensureDirSync(targetDir);

    this.copyFile('easy-network-stub utils', sourceDir, targetDir, 'easy-network-stub.utils.ts');
  }

  protected generateIndexFiles(ctx: Context): Output['indexFiles'] {
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
    return appendValueGroup(Object.values(ctx.output.stubs).map((x) => ts.export(x.component, x.filePath)));
  }

  protected getStubsIndexFilePath(ctx: Context): string | null {
    return ctx.config.stubsIndexFilePath ? resolve(ctx.config.outputDir, ctx.config.stubsIndexFilePath) : null;
  }

  private copyFile(logName: string, sourceDir: string, targetDir: string, fileName: string): void {
    const source = resolve(sourceDir, fileName);
    const target = resolve(targetDir, fileName);
    console.log(`Generating ${logName} to ${target}...`);
    copyFileSync(source, target);
  }
}
