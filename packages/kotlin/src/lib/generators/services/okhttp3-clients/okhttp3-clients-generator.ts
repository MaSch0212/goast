import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

import fs from 'fs-extra';

import { ApiService, Factory, OpenApiGeneratorContext, OpenApiServicesGenerationProviderBase } from '@goast/core';

import {
  KotlinOkHttp3ClientGeneratorOutput,
  KotlinOkHttp3ClientsGeneratorConfig,
  KotlinOkHttp3ClientsGeneratorContext,
  KotlinOkHttp3ClientsGeneratorInput,
  KotlinOkHttp3ClientsGeneratorOutput,
  defaultKotlinOkHttp3ClientsGeneratorConfig,
} from './models';
import { KotlinOkHttp3Generator, DefaultKotlinOkHttp3Generator } from './okhttp3-client-generator';
import { getReferenceFactories } from './refs';
import { KotlinServicesGeneratorInput } from '../spring-controllers';

type Input = KotlinOkHttp3ClientsGeneratorInput;
type Output = KotlinOkHttp3ClientsGeneratorOutput;
type Config = KotlinOkHttp3ClientsGeneratorConfig;
type ServiceOutput = KotlinOkHttp3ClientGeneratorOutput;
type Context = KotlinOkHttp3ClientsGeneratorContext;

export class KotlinOkHttp3ClientsGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _serviceGeneratorFactory: Factory<KotlinOkHttp3Generator, []>;

  constructor(serviceGeneratorFactory?: Factory<KotlinOkHttp3Generator, []>) {
    super();
    this._serviceGeneratorFactory = serviceGeneratorFactory ?? Factory.fromValue(new DefaultKotlinOkHttp3Generator());
  }

  public override onGenerate(ctx: Context): Output {
    this.copyInfrastructureFiles(ctx);
    return super.onGenerate(ctx);
  }

  protected initResult(): Output {
    return {
      kotlin: {
        clients: {},
      },
    };
  }

  protected generateService(ctx: Context, service: ApiService): ServiceOutput {
    const serviceGenerator = this._serviceGeneratorFactory.create();
    return serviceGenerator.generate({
      ...ctx,
      service,
    });
  }

  protected addServiceResult(ctx: Context, service: ApiService, result: ServiceOutput): void {
    ctx.output.kotlin.clients[service.id] = result;
  }

  protected buildContext(
    context: OpenApiGeneratorContext<KotlinServicesGeneratorInput>,
    config?: Partial<Config> | undefined,
  ): Context {
    context.data.services = context.data.services.filter((x) => x.name !== 'exclude-from-generation');
    const providerContext = this.getProviderContext(context, config, defaultKotlinOkHttp3ClientsGeneratorConfig);
    const infrastructurePackageName = this.getInfrastructurePackageName(providerContext.config);
    return Object.assign(providerContext, {
      infrastructurePackageName,
      refs: getReferenceFactories(infrastructurePackageName),
    });
  }

  protected getInfrastructurePackageName(config: Config): string {
    if (typeof config.infrastructurePackageName === 'string') {
      return config.infrastructurePackageName;
    }
    if (config.infrastructurePackageName.mode === 'append-package-name') {
      return config.packageName + config.infrastructurePackageName.value;
    }
    if (config.infrastructurePackageName.mode === 'append-full-package-name') {
      return this.getPackageName(config) + config.infrastructurePackageName.value;
    }

    return config.infrastructurePackageName.value;
  }

  protected getPackageName(config: Config): string {
    const packageSuffix = typeof config.packageSuffix === 'string' ? config.packageSuffix : config.packageSuffix();
    return config.packageName + packageSuffix;
  }

  private copyInfrastructureFiles(ctx: Context): void {
    const sourceDir = resolve(dirname(require.resolve('@goast/kotlin')), '../assets/client/okhttp3');
    const targetDir = resolve(ctx.config.outputDir, ctx.infrastructurePackageName.replace(/\./g, '/'));
    fs.ensureDirSync(targetDir);

    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      const fileContent = fs
        .readFileSync(resolve(sourceDir, file))
        .toString()
        .replace(/@PACKAGE_NAME@/g, ctx.infrastructurePackageName);
      writeFileSync(resolve(targetDir, file), fileContent);
    }
  }
}
