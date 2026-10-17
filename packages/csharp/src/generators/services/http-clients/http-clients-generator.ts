import {
  type ApiService,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
} from '@goast/core';

import { CSharpFileBuilder } from '../../../file-builder.ts';
import { type CSharpHttpClientGenerator, DefaultCSharpHttpClientGenerator } from './http-client-generator.ts';
import {
  type CSharpHttpClientGeneratorOutput,
  type CSharpHttpClientsGeneratorConfig,
  type CSharpHttpClientsGeneratorContext,
  type CSharpHttpClientsGeneratorInput,
  type CSharpHttpClientsGeneratorOutput,
  defaultCSharpHttpClientsGeneratorConfig,
} from './models.ts';
import { getReferenceFactories } from './refs.ts';
import { csharpClientRuntimeFiles } from './runtime.ts';

type Input = CSharpHttpClientsGeneratorInput;
type Output = CSharpHttpClientsGeneratorOutput;
type Config = CSharpHttpClientsGeneratorConfig;
type ServiceOutput = CSharpHttpClientGeneratorOutput;
type Context = CSharpHttpClientsGeneratorContext;

export class CSharpHttpClientsGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _serviceGeneratorFactory: Factory<CSharpHttpClientGenerator, []>;

  constructor(serviceGeneratorFactory?: Factory<CSharpHttpClientGenerator, []>) {
    super();
    this._serviceGeneratorFactory =
      serviceGeneratorFactory ?? Factory.fromValue(new DefaultCSharpHttpClientGenerator());
  }

  protected override async generateAdditionalFiles(ctx: Context): Promise<void> {
    this.writeRuntimeFiles(ctx);
  }

  protected initResult(): Output {
    return {
      csharp: {
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
    ctx.output.csharp.clients[service.id] = result;
  }

  protected buildContext(
    context: OpenApiGeneratorContext<CSharpHttpClientsGeneratorInput>,
    config?: Partial<Config> | undefined,
  ): Context {
    const providerContext = this.getProviderContext(context, config, defaultCSharpHttpClientsGeneratorConfig);
    const namespace = this.getNamespace(providerContext.config);
    return Object.assign(providerContext, {
      namespace,
      refs: getReferenceFactories(namespace),
      writtenFiles: new Set<string>(),
    });
  }

  protected getNamespace(config: Config): string {
    return config.rootNamespace + config.namespaceSuffix;
  }

  /** Writes the helper types shared by every client: `ApiRuntime`, `ApiException` and `ApiFile`. */
  protected writeRuntimeFiles(ctx: Context): void {
    for (const file of csharpClientRuntimeFiles) {
      const filePath = `${ctx.config.outputDir}/${ctx.config.clientsDir}/${file.fileName}`;
      console.log(`Generating ${file.fileName} to ${filePath}...`);
      const builder = new CSharpFileBuilder(ctx.namespace, ctx.config);
      file.usings.forEach((namespace) => builder.addUsing(namespace));
      builder.append(file.body);
      builder.writeToFile(filePath);
    }
  }
}
