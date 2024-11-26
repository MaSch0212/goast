import { resolve } from 'node:path';

// @deno-types="npm:@types/fs-extra@11"
import fs from 'fs-extra';

import {
  type ApiService,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
  toCasing,
} from '@goast/core';

import { getAssetFileContent } from '../../../assets.ts';
import type { KotlinServicesGeneratorInput } from '../spring-controllers/index.ts';
import {
  defaultKotlinOkHttp3ClientsGeneratorConfig,
  type KotlinOkHttp3ClientGeneratorOutput,
  type KotlinOkHttp3ClientsGeneratorConfig,
  type KotlinOkHttp3ClientsGeneratorContext,
  type KotlinOkHttp3ClientsGeneratorInput,
  type KotlinOkHttp3ClientsGeneratorOutput,
} from './models.ts';
import { DefaultKotlinOkHttp3Generator, type KotlinOkHttp3Generator } from './okhttp3-client-generator.ts';
import { getReferenceFactories } from './refs.ts';

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

  protected override async generateAdditionalFiles(ctx: KotlinOkHttp3ClientsGeneratorContext): Promise<void> {
    await this.copyInfrastructureFiles(ctx);
  }

  protected initResult(): Output {
    return {
      kotlin: {
        clients: {},
      },
    };
  }

  protected generateService(ctx: Context, service: ApiService): MaybePromise<ServiceOutput> {
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

  private async copyInfrastructureFiles(ctx: Context): Promise<void> {
    const targetDir = resolve(ctx.config.outputDir, ctx.infrastructurePackageName.replace(/\./g, '/'));
    await fs.ensureDir(targetDir);

    const files = [
      'ApiAbstractions.kt',
      'ApiClient.kt',
      'ApiResponse.kt',
      'Errors.kt',
      'PartConfig.kt',
      'RequestConfig.kt',
      'RequestMethod.kt',
      'ResponseExtensions.kt',
      'Serializer.kt',
    ];

    for (const file of files) {
      const sourcePath = `client/okhttp3/${file}`;
      const targetPath = resolve(targetDir, file);
      console.log(`Copying asset file "${sourcePath}" to "${targetPath}"`);
      const fileContent = (await getAssetFileContent(sourcePath))
        .replace(/@PACKAGE_NAME@/g, ctx.infrastructurePackageName)
        .replace(/@JSON_INCLUDE@/g, toCasing(ctx.config.serializerJsonInclude, 'snake'));
      fs.writeFileSync(targetPath, fileContent);
    }
  }
}
