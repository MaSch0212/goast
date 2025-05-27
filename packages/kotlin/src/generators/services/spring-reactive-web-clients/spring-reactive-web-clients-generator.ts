import {
  type ApiService,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
} from '@goast/core';

import type { KotlinServicesGeneratorInput } from '../spring-controllers/index.ts';
import {
  defaultKotlinSpringReactiveWebClientsGeneratorConfig,
  type KotlinSpringReactiveWebClientGeneratorOutput,
  type KotlinSpringReactiveWebClientsGeneratorConfig,
  type KotlinSpringReactiveWebClientsGeneratorContext,
  type KotlinSpringReactiveWebClientsGeneratorInput,
  type KotlinSpringReactiveWebClientsGeneratorOutput,
} from './models.ts';
import {
  DefaultKotlinSpringReactiveWebClientGenerator,
  type KotlinSpringReactiveWebClientGenerator,
} from './spring-reactive-web-client-generator.ts';

type Input = KotlinSpringReactiveWebClientsGeneratorInput;
type Output = KotlinSpringReactiveWebClientsGeneratorOutput;
type Config = KotlinSpringReactiveWebClientsGeneratorConfig;
type ServiceOutput = KotlinSpringReactiveWebClientGeneratorOutput;
type Context = KotlinSpringReactiveWebClientsGeneratorContext;

export class KotlinSpringReactiveWebClientsGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _serviceGeneratorFactory: Factory<KotlinSpringReactiveWebClientGenerator, []>;

  constructor(serviceGeneratorFactory?: Factory<KotlinSpringReactiveWebClientGenerator, []>) {
    super();
    this._serviceGeneratorFactory = serviceGeneratorFactory ??
      Factory.fromValue(new DefaultKotlinSpringReactiveWebClientGenerator());
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
    return this.getProviderContext(context, config, defaultKotlinSpringReactiveWebClientsGeneratorConfig);
  }
}
