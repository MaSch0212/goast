import {
  type ApiService,
  type AppendValueGroup,
  appendValueGroup,
  Factory,
  type MaybePromise,
  type OpenApiGeneratorContext,
  OpenApiServicesGenerationProviderBase,
} from '@goast/core';

import { kt } from '../../../ast/index.ts';
import { KotlinFileBuilder } from '../../../file-builder.ts';
import {
  defaultKotlinServicesGeneratorConfig,
  type KotlinServiceGeneratorOutput,
  type KotlinServicesGeneratorConfig,
  type KotlinServicesGeneratorContext,
  type KotlinServicesGeneratorInput,
  type KotlinServicesGeneratorOutput,
} from './models.ts';
import { getReferenceFactories } from './refs.ts';
import {
  DefaultKotlinSpringControllerGenerator,
  type KotlinSpringControllerGenerator,
} from './spring-controller-generator.ts';

type Input = KotlinServicesGeneratorInput;
type Output = KotlinServicesGeneratorOutput;
type Config = KotlinServicesGeneratorConfig;
type ServiceOutput = KotlinServiceGeneratorOutput;
type Context = KotlinServicesGeneratorContext;

/**
 * Generates the Spring MVC controllers of all services. For each service it writes three Kotlin files into
 * `{outputDir}/{packageDir}`, where `{packageDir}` is `packageName` followed by the service's `packageSuffix`,
 * with each `.` replaced by `/`. With the default settings this is `{outputDir}/com/openapi/generated/api`.
 * - `{Service}_Api.kt`: the API interface, with `@RequestMapping` and the path constants in its companion object.
 * - `{Service}_ApiController.kt`: the `@Controller` class that implements the interface and forwards to the delegate.
 * - `{Service}_ApiDelegate.kt`: the delegate interface, with one function per endpoint to override.
 *
 * The names are the service name plus the `_Api`, `_ApiController` or `_ApiDelegate` suffix, converted with
 * `typeNameCasing`. Once per run it also writes `{outputDir}/{basePackageDir}/ApiExceptionHandler.kt`, where the base
 * package is `packageName` followed by the `packageSuffix` for no service. Services named `exclude-from-generation`
 * are removed from `data.services` before generation.
 *
 * Publishes `kotlin.services`, keyed by service id, with `apiInterface`, `apiController` and `apiDelegate`. Each entry
 * is a `KotlinImport` (`typeName` and `packageName`) that later generators use to reference the file.
 * @see DefaultKotlinSpringControllerGenerator
 * @see KotlinServicesGeneratorConfig
 */
export class KotlinSpringControllersGenerator extends OpenApiServicesGenerationProviderBase<
  Input,
  Output,
  Config,
  ServiceOutput,
  Context
> {
  private readonly _serviceGeneratorFactory: Factory<KotlinSpringControllerGenerator, []>;

  /**
   * Initializes a new instance of the KotlinSpringControllersGenerator class.
   * @param serviceGeneratorFactory Creates the generator of each service. Defaults to the default generator.
   */
  constructor(serviceGeneratorFactory?: Factory<KotlinSpringControllerGenerator, []>) {
    super();
    this._serviceGeneratorFactory =
      serviceGeneratorFactory ?? Factory.fromValue(new DefaultKotlinSpringControllerGenerator());
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
    const providerContext = this.getProviderContext(context, config, defaultKotlinServicesGeneratorConfig);
    return Object.assign(providerContext, {
      refs: getReferenceFactories(providerContext.config),
    });
  }

  protected override generateAdditionalFiles(ctx: KotlinServicesGeneratorContext): void {
    this.generateApiExceptionHandler(ctx);
  }

  protected generateApiExceptionHandler(ctx: Context): void {
    const packageName = ctx.refs.apiExceptionHandler.packageName ?? ctx.config.packageName;
    const dir = `${ctx.config.outputDir}/${packageName.replace(/\./g, '/')}`;
    const fileName = `${ctx.refs.apiExceptionHandler.refName}.kt`;
    console.log(`Generating Api Exception Handler to ${fileName}...`);

    const builder = new KotlinFileBuilder(packageName, ctx.config);
    builder.append(this.getApiExceptionHandlerInterface(ctx));
    builder.writeToFile(`${dir}/${fileName}`);
  }

  protected getApiExceptionHandlerFileContent(ctx: Context): AppendValueGroup<KotlinFileBuilder> {
    return appendValueGroup([this.getApiExceptionHandlerInterface(ctx)], '\n');
  }

  protected getApiExceptionHandlerInterface(ctx: Context): kt.Interface<KotlinFileBuilder> {
    return kt.interface(ctx.refs.apiExceptionHandler.refName, {
      members: [
        kt.function('handleApiException', {
          doc: kt.doc('Handler for API exceptions.', [kt.docTag('return', 'Response entity.')]),
          suspend: ctx.config.suspendingFunctions,
          parameters: [
            kt.parameter('exception', kt.refs.throwable(), {
              description: 'Exception that has been thrown by the API.',
            }),
          ],
          returnType: kt.refs.spring.responseEntity(['*']),
        }),
      ],
    });
  }
}
