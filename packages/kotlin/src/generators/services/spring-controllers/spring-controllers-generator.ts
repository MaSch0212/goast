// @deno-types="npm:@types/fs-extra@11"
import fs from 'fs-extra';

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
    fs.writeFileSync(`${dir}/${fileName}`, builder.toString());
  }

  protected getApiExceptionHandlerFileContent(ctx: Context): AppendValueGroup<KotlinFileBuilder> {
    return appendValueGroup([this.getApiExceptionHandlerInterface(ctx)], '\n');
  }

  protected getApiExceptionHandlerInterface(ctx: Context): kt.Interface<KotlinFileBuilder> {
    return kt.interface(ctx.refs.apiExceptionHandler.refName, {
      members: [
        kt.function('handleApiException', {
          doc: kt.doc('Handler for API exceptions.', [kt.docTag('return', 'Response entity.')]),
          suspend: true,
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
