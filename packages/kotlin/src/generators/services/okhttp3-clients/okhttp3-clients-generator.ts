import { resolve } from 'node:path';

import {
  type ApiService,
  type AppendValue,
  builderTemplate as s,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
  toCasing,
} from '@goast/core';

import { writeGeneratedFile } from '../../../../../core/src/utils/file-system.utils.ts';
import { getAssetFileContent } from '../../../assets.ts';
import { kt } from '../../../ast/index.ts';
import { KotlinFileBuilder } from '../../../file-builder.ts';
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

    const files = [
      'ApiAbstractions.kt',
      'ApiClient.kt',
      'ApiResponse.kt',
      'Errors.kt',
      'PartConfig.kt',
      'RequestConfig.kt',
      'RequestMethod.kt',
      'ResponseExtensions.kt',
    ];

    for (const file of files) {
      const sourcePath = `client/okhttp3/${file}`;
      const targetPath = resolve(targetDir, file);
      console.log(`Copying asset file "${sourcePath}" to "${targetPath}"`);
      let fileContent = (await getAssetFileContent(sourcePath))
        .replace(/@PACKAGE_NAME@/g, ctx.infrastructurePackageName);
      if (file === 'ApiClient.kt') {
        fileContent = fileContent.replace(
          /@API_CLIENT_PARAMETERS@/,
          ctx.config.serializer === 'parameter'
            ? 'val baseUrl: String, val objectMapper: ObjectMapper, val client: Factory = defaultClient'
            : 'val baseUrl: String, val client: Factory = defaultClient, val objectMapper: ObjectMapper = Serializer.jacksonObjectMapper',
        );
      }
      writeGeneratedFile(ctx.config, targetPath, fileContent);
    }

    if (
      ctx.config.serializer === 'static' ||
      typeof ctx.config.serializer === 'object' && ctx.config.serializer.mode === 'static'
    ) {
      const filePath = resolve(targetDir, 'Serializer.kt');
      console.log(`Generating Serializer to ${filePath}...`);
      const factory: AppendValue<KotlinFileBuilder> = typeof ctx.config.serializer === 'object'
        ? ctx.config.serializer.factory
        : s`${kt.refs.jackson.jacksonObjectMapper()}()${s.indent`
            .findAndRegisterModules()
            .setSerializationInclusion(${kt.refs.jackson.jsonInclude()}.Include.${
          toCasing(ctx.config.serializerJsonInclude, 'snake')
        })
            .configure(${kt.refs.jackson.serializationFeature()}.WRITE_DATES_AS_TIMESTAMPS, false)
            .configure(${kt.refs.jackson.deserializationFeature()}.FAIL_ON_UNKNOWN_PROPERTIES, false)`}`;

      const builder = new KotlinFileBuilder(ctx.infrastructurePackageName, ctx.config);
      builder.append(
        kt.object({
          name: 'Serializer',
          members: [
            kt.property('jacksonObjectMapper', {
              type: kt.refs.jackson.objectMapper(),
              mutable: false,
              default: kt.call('run', [kt.lambda([], factory)]),
            }),
          ],
        }),
      );
      builder.writeToFile(filePath);
    }
  }
}
