import {
  type ApiService,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
} from '@goast/core';

import { type CSharpFastEndpointGenerator, DefaultCSharpFastEndpointGenerator } from './fast-endpoint-generator.ts';
import {
  type CSharpFastEndpointGeneratorOutput,
  type CSharpFastEndpointsGeneratorConfig,
  type CSharpFastEndpointsGeneratorContext,
  type CSharpFastEndpointsGeneratorInput,
  type CSharpFastEndpointsGeneratorOutput,
  defaultCSharpFastEndpointsGeneratorConfig,
} from './models.ts';

type Input = CSharpFastEndpointsGeneratorInput;
type Output = CSharpFastEndpointsGeneratorOutput;
type Config = CSharpFastEndpointsGeneratorConfig;
type ServiceOutput = CSharpFastEndpointGeneratorOutput;
type Context = CSharpFastEndpointsGeneratorContext;

/**
 * Generates FastEndpoints endpoints: one abstract `<Operation>EndpointBase` per operation whose sealed `Configure`
 * and `HandleAsync` bind the request, call an abstract handler method and write its strict result type to the
 * response.
 */
export class CSharpFastEndpointsGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _fastEndpointGeneratorFactory: Factory<CSharpFastEndpointGenerator, []>;

  constructor(fastEndpointGeneratorFactory?: Factory<CSharpFastEndpointGenerator, []>) {
    super();
    this._fastEndpointGeneratorFactory =
      fastEndpointGeneratorFactory ?? Factory.fromValue(new DefaultCSharpFastEndpointGenerator());
  }

  protected override initResult(): Output {
    return { csharp: { fastEndpoints: {} } };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<Input>,
    config?: Partial<Config> | undefined,
  ): Context {
    return this.getProviderContext(context, config, defaultCSharpFastEndpointsGeneratorConfig);
  }

  protected override generateService(ctx: Context, service: ApiService): MaybePromise<ServiceOutput> {
    const fastEndpointGenerator = this._fastEndpointGeneratorFactory.create();
    return fastEndpointGenerator.generate({ ...ctx, service });
  }

  protected override addServiceResult(ctx: Context, service: ApiService, result: ServiceOutput): void {
    ctx.output.csharp.fastEndpoints[service.id] = result;
  }

  protected override generateAdditionalFiles(ctx: Context): MaybePromise<void> {
    return this._fastEndpointGeneratorFactory.create().generateSupportFiles(ctx);
  }
}
