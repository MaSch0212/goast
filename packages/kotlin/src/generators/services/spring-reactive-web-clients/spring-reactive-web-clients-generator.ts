import { resolve } from 'node:path';

import {
  type ApiService,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
  writeGeneratedFile,
} from '@goast/core';

import { getAssetFileContent } from '../../../assets.ts';
import type { KotlinServicesGeneratorInput } from '../spring-controllers/index.ts';
import {
  defaultKotlinSpringReactiveWebClientsGeneratorConfig,
  type KotlinSpringReactiveWebClientGeneratorOutput,
  type KotlinSpringReactiveWebClientsGeneratorConfig,
  type KotlinSpringReactiveWebClientsGeneratorContext,
  type KotlinSpringReactiveWebClientsGeneratorInput,
  type KotlinSpringReactiveWebClientsGeneratorOutput,
} from './models.ts';
import { getReferenceFactories } from './refs.ts';
import {
  DefaultKotlinSpringReactiveWebClientGenerator,
  type KotlinSpringReactiveWebClientGenerator,
} from './spring-reactive-web-client-generator.ts';

type Input = KotlinSpringReactiveWebClientsGeneratorInput;
type Output = KotlinSpringReactiveWebClientsGeneratorOutput;
type Config = KotlinSpringReactiveWebClientsGeneratorConfig;
type ServiceOutput = KotlinSpringReactiveWebClientGeneratorOutput;
type Context = KotlinSpringReactiveWebClientsGeneratorContext;

/**
 * Generates a Spring WebFlux `WebClient` based Kotlin client for each service.
 *
 * Each service produces one file, `{outputDir}/{package path}/{Name}.kt`, where `{Name}` is the service name followed
 * by `_Requests`, cased with `typeNameCasing`. The file is written by the service generator, which defaults to
 * `DefaultKotlinSpringReactiveWebClientGenerator`. The shared `ApiRequestFile.kt` helper is also copied to
 * `{outputDir}/{infrastructure package path}/ApiRequestFile.kt`. Services named `exclude-from-generation` are skipped.
 *
 * Publishes the result under `kotlin.clients`, keyed by service id, with the `typeName` and `packageName` of each
 * requests object, so later generators can import them. Reads the `kotlin.models` output of the models generator.
 *
 * `springBootVersion` has no effect on this generator.
 *
 * @see KotlinSpringReactiveWebClientsGeneratorOutput
 */
export class KotlinSpringReactiveWebClientsGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _serviceGeneratorFactory: Factory<KotlinSpringReactiveWebClientGenerator, []>;

  /**
   * Creates the generator.
   * @param serviceGeneratorFactory Creates the generator that writes the client of each service. Defaults to a
   * `DefaultKotlinSpringReactiveWebClientGenerator`.
   */
  constructor(serviceGeneratorFactory?: Factory<KotlinSpringReactiveWebClientGenerator, []>) {
    super();
    this._serviceGeneratorFactory =
      serviceGeneratorFactory ?? Factory.fromValue(new DefaultKotlinSpringReactiveWebClientGenerator());
  }

  protected override async generateAdditionalFiles(ctx: Context): Promise<void> {
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
    const providerContext = this.getProviderContext(
      context,
      config,
      defaultKotlinSpringReactiveWebClientsGeneratorConfig,
    );
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

    const files = ['ApiRequestFile.kt'];

    for (const file of files) {
      const sourcePath = `client/spring-reactive-web-clients/${file}`;
      const targetPath = resolve(targetDir, file);
      console.log(`Copying asset file "${sourcePath}" to "${targetPath}"`);
      const fileContent = (await getAssetFileContent(sourcePath)).replace(
        /@PACKAGE_NAME@/g,
        ctx.infrastructurePackageName,
      );
      writeGeneratedFile(ctx.config, targetPath, fileContent);
    }
  }
}
