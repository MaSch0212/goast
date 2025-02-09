import {
  type ApiService,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
} from '@goast/core';

import {
  defaultKotlinServicesGeneratorConfig,
  type KotlinServiceGeneratorOutput,
  type KotlinServicesGeneratorConfig,
  type KotlinServicesGeneratorContext,
  type KotlinServicesGeneratorInput,
  type KotlinServicesGeneratorOutput,
} from './models.ts';
import {
  DefaultKotlinSpringControllerGenerator,
  type KotlinSpringControllerGenerator,
} from './spring-controller-generator.ts';

type Input = KotlinServicesGeneratorInput;
type Output = KotlinServicesGeneratorOutput;
type Config = KotlinServicesGeneratorConfig;
type ServiceOutput = KotlinServiceGeneratorOutput;
type Context = KotlinServicesGeneratorContext;

export class KotlinSpringControllersGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _serviceGeneratorFactory: Factory<KotlinSpringControllerGenerator, []>;

  constructor(serviceGeneratorFactory?: Factory<KotlinSpringControllerGenerator, []>) {
    super();
    this._serviceGeneratorFactory = serviceGeneratorFactory ??
      Factory.fromValue(new DefaultKotlinSpringControllerGenerator());
  }

  protected initResult(): Output {
    return {
      kotlin: {
        services: {},
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
    ctx.output.kotlin.services[service.id] = result;
  }

  protected buildContext(
    context: OpenApiGeneratorContext<KotlinServicesGeneratorInput>,
    config?: Partial<Config> | undefined,
  ): Context {
    context.data.services = context.data.services.filter((x) => x.name !== 'exclude-from-generation');
    return this.getProviderContext(context, config, defaultKotlinServicesGeneratorConfig);
  }
}
