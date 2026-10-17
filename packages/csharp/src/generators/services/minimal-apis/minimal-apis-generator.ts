import {
  type ApiService,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
} from '@goast/core';

import { type CSharpMinimalApiGenerator, DefaultCSharpMinimalApiGenerator } from './minimal-api-generator.ts';
import {
  type CSharpMinimalApiGeneratorOutput,
  type CSharpMinimalApisGeneratorConfig,
  type CSharpMinimalApisGeneratorContext,
  type CSharpMinimalApisGeneratorInput,
  type CSharpMinimalApisGeneratorOutput,
  defaultCSharpMinimalApisGeneratorConfig,
} from './models.ts';

type Input = CSharpMinimalApisGeneratorInput;
type Output = CSharpMinimalApisGeneratorOutput;
type Config = CSharpMinimalApisGeneratorConfig;
type ServiceOutput = CSharpMinimalApiGeneratorOutput;
type Context = CSharpMinimalApisGeneratorContext;

/**
 * Generates ASP.NET Core Minimal APIs: one abstract `<Tag>ApiBase` per service that declares the handler methods and a
 * `Map<Tag>Api` extension that maps every route: it binds the request, calls the handler and converts its result.
 */
export class CSharpMinimalApisGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _minimalApiGeneratorFactory: Factory<CSharpMinimalApiGenerator, []>;

  constructor(minimalApiGeneratorFactory?: Factory<CSharpMinimalApiGenerator, []>) {
    super();
    this._minimalApiGeneratorFactory =
      minimalApiGeneratorFactory ?? Factory.fromValue(new DefaultCSharpMinimalApiGenerator());
  }

  protected override initResult(): Output {
    return { csharp: { minimalApis: {} } };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<Input>,
    config?: Partial<Config> | undefined,
  ): Context {
    return this.getProviderContext(context, config, defaultCSharpMinimalApisGeneratorConfig);
  }

  protected override generateService(ctx: Context, service: ApiService): MaybePromise<ServiceOutput> {
    const minimalApiGenerator = this._minimalApiGeneratorFactory.create();
    return minimalApiGenerator.generate({ ...ctx, service });
  }

  protected override addServiceResult(ctx: Context, service: ApiService, result: ServiceOutput): void {
    ctx.output.csharp.minimalApis[service.id] = result;
  }

  protected override generateAdditionalFiles(ctx: Context): MaybePromise<void> {
    return this._minimalApiGeneratorFactory.create().generateSupportFiles(ctx);
  }
}
