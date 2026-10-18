import {
  type ApiService,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
} from '@goast/core';

import { type CSharpControllerGenerator, DefaultCSharpControllerGenerator } from './controller-generator.ts';
import {
  type CSharpControllerGeneratorOutput,
  type CSharpControllersGeneratorConfig,
  type CSharpControllersGeneratorContext,
  type CSharpControllersGeneratorInput,
  type CSharpControllersGeneratorOutput,
  defaultCSharpControllersGeneratorConfig,
} from './models.ts';

type Input = CSharpControllersGeneratorInput;
type Output = CSharpControllersGeneratorOutput;
type Config = CSharpControllersGeneratorConfig;
type ServiceOutput = CSharpControllerGeneratorOutput;
type Context = CSharpControllersGeneratorContext;

/**
 * Generates ASP.NET Core MVC controllers: one abstract `<Tag>ControllerBase` per service whose actions bind the
 * request, call an abstract handler method and convert its strict result type to an `IActionResult`.
 */
export class CSharpControllersGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _controllerGeneratorFactory: Factory<CSharpControllerGenerator, []>;

  constructor(controllerGeneratorFactory?: Factory<CSharpControllerGenerator, []>) {
    super();
    this._controllerGeneratorFactory =
      controllerGeneratorFactory ?? Factory.fromValue(new DefaultCSharpControllerGenerator());
  }

  protected override initResult(): Output {
    return { csharp: { controllers: {} } };
  }

  protected override buildContext(
    context: OpenApiGeneratorContext<Input>,
    config?: Partial<Config> | undefined,
  ): Context {
    return this.getProviderContext(context, config, defaultCSharpControllersGeneratorConfig);
  }

  protected override generateService(ctx: Context, service: ApiService): MaybePromise<ServiceOutput> {
    const controllerGenerator = this._controllerGeneratorFactory.create();
    return controllerGenerator.generate({ ...ctx, service });
  }

  protected override addServiceResult(ctx: Context, service: ApiService, result: ServiceOutput): void {
    ctx.output.csharp.controllers[service.id] = result;
  }

  protected override generateAdditionalFiles(ctx: Context): MaybePromise<void> {
    return this._controllerGeneratorFactory.create().generateSupportFiles(ctx);
  }
}
