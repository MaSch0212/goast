import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

import { ensureDirSync } from 'fs-extra';

import { ApiEndpoint, TextOrBuilderFn, toCasing } from '@goast/core';

import { TypeScriptAngularClientGeneratorContext, TypeScriptAngularClientGeneratorOutput } from './models';
import {
  TypeScriptClassOptions,
  TypeScriptConstructorOptions,
  TypeScriptExternalTypeOptions,
  TypeScriptFileBuilder,
  TypeScriptMethodOptions,
  TypeScriptParameterOptions,
  TypeScriptPropertyOptions,
} from '../../../file-builder';
import { TypeScriptFileGenerator } from '../../file-generator';

type Context = TypeScriptAngularClientGeneratorContext;
type Output = TypeScriptAngularClientGeneratorOutput;
type Builder = TypeScriptFileBuilder;

export interface TypeScriptAngularClientGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): TOutput;
}

export class DefaultTypeScriptAngularClientGenerator
  extends TypeScriptFileGenerator<Context, Output>
  implements TypeScriptAngularClientGenerator
{
  protected readonly httpClientType: TypeScriptExternalTypeOptions = {
    name: 'HttpClient',
    moduleName: '@angular/common/http',
  };
  protected readonly httpContextType: TypeScriptExternalTypeOptions = {
    name: 'HttpContext',
    moduleName: '@angular/common/http',
  };
  protected readonly httpResponseType: TypeScriptExternalTypeOptions = {
    name: 'HttpResponse',
    moduleName: '@angular/common/http',
  };
  protected readonly observableType: TypeScriptExternalTypeOptions = {
    name: 'Observable',
    moduleName: 'rxjs',
  };
  protected readonly rxjsFilterType: TypeScriptExternalTypeOptions = {
    name: 'filter',
    moduleName: 'rxjs',
  };
  protected readonly rxjsMapType: TypeScriptExternalTypeOptions = {
    name: 'map',
    moduleName: 'rxjs',
  };
  protected getApiConfigurationType(ctx: Context): TypeScriptExternalTypeOptions {
    return { name: 'ApiConfiguration', filePath: resolve(this.getUtilsDirPath(ctx), 'api-configuration.ts') };
  }
  protected getBaseServiceType(ctx: Context): TypeScriptExternalTypeOptions {
    return { name: 'BaseService', filePath: resolve(this.getUtilsDirPath(ctx), 'base-service.ts') };
  }
  protected getStrictHttpResponseType(ctx: Context): TypeScriptExternalTypeOptions {
    return { name: 'StrictHttpResponse', filePath: resolve(this.getUtilsDirPath(ctx), 'strict-http-response.ts') };
  }
  protected getRequestBuilderType(ctx: Context): TypeScriptExternalTypeOptions {
    return { name: 'RequestBuilder', filePath: resolve(this.getUtilsDirPath(ctx), 'request-builder.ts') };
  }

  public generate(ctx: Context): Output {
    const filePath = this.getFilePath(ctx);
    const name = this.getClassName(ctx);
    console.log(`Generating service ${name} in ${filePath}...`);

    const builder = new TypeScriptFileBuilder(filePath, ctx.config);
    this.generateFileContent(ctx, builder);

    ensureDirSync(dirname(filePath));
    writeFileSync(filePath, builder.toString());

    return { filePath, name };
  }

  protected generateFileContent(ctx: Context, builder: Builder) {
    builder
      .append((builder) =>
        builder.forEach(
          ctx.service.endpoints,
          (builder, endpoint) => this.generateEndpointParamsType(ctx, builder, endpoint),
          { separator: '\n' }
        )
      )
      .ensurePreviousLineEmpty()
      .append((builder) => this.generateClass(ctx, builder));
  }

  protected generateEndpointParamsType(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    if (!this.hasEndpointParams(ctx, endpoint)) {
      return;
    }

    const params: TextOrBuilderFn<Builder>[] = [];
    for (const parameter of endpoint.parameters) {
      const schema = parameter.schema;
      params.push((builder) =>
        builder.appendProperty({
          name: this.toPropertyName(ctx, parameter.name),
          documentation: parameter.description,
          type: schema ? (builder) => builder.appendModelUsage(ctx.input.models[schema.id]) : this.getAnyType(ctx),
          isOptional: !parameter.required,
        })
      );
    }

    if (endpoint.requestBody !== undefined) {
      const body = endpoint.requestBody;
      const schema = body.content[0].schema;
      params.push((builder) =>
        builder.appendProperty({
          name: 'body',
          documentation: body.description,
          type: schema ? (builder) => builder.appendModelUsage(ctx.input.models[schema.id]) : this.getAnyType(ctx),
          isOptional: !body.required,
        })
      );
    }

    builder.appendTypeDeclaration({
      name: this.getEndpointParamsTypeName(ctx, endpoint),
      documentation: `Parameters for operation ${this.getEndpointMethodName(ctx, endpoint)}`,
      type: (builder) => builder.appendCodeBlock(...params),
    });
  }

  protected generateClass(ctx: Context, builder: Builder) {
    builder.appendClass(this.getClassOptions(ctx));
  }

  protected generateClassContent(ctx: Context, builder: Builder) {
    builder
      .append((builder) => this.generateConstructor(ctx, builder))
      .forEach(ctx.service.endpoints, (builder, endpoint) =>
        builder.ensurePreviousLineEmpty().append((builder) => this.generateEndpoint(ctx, builder, endpoint))
      );
  }

  protected generateConstructor(ctx: Context, builder: Builder) {
    builder.appendConstructor(this.getConstructorOptions(ctx));
  }

  protected generateConstructorContent(ctx: Context, builder: Builder) {
    builder.appendLine('super(config, http);');
  }

  protected generateEndpoint(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder
      .append((builder) => this.generateEndpointPathProperty(ctx, builder, endpoint))
      .ensurePreviousLineEmpty()
      .append((builder) => this.generateEndpointResponseMethod(ctx, builder, endpoint))
      .ensurePreviousLineEmpty()
      .append((builder) => this.generateEndpointMethod(ctx, builder, endpoint));
  }

  protected generateEndpointPathProperty(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder.appendProperty(this.getEndpointPathPropertyOptions(ctx, endpoint));
  }

  protected generateEndpointResponseMethod(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder.appendMethod(this.getEndpointResponseMethodOptions(ctx, endpoint));
  }

  protected generateEndpointResponseMethodContent(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder
      .append('const rb = new ')
      .appendExternalTypeUsage(this.getRequestBuilderType(ctx))
      .appendParameters(
        'this.rootUrl',
        `${this.getClassName(ctx)}.${this.getEndpointPathPropertyName(ctx, endpoint)}`,
        this.toStringLiteral(ctx, endpoint.method)
      )
      .appendLine(';');

    if (this.hasEndpointParams(ctx, endpoint)) {
      builder.append('if (params) ').appendCodeBlock((builder) =>
        builder
          .forEach(
            endpoint.parameters.filter((x) => x.target === 'path' || x.target === 'query' || x.target === 'header'),
            (builder, parameter) =>
              builder
                .append('rb.', parameter.target)
                .appendParameters(
                  this.toStringLiteral(ctx, parameter.name),
                  `params.${toCasing(parameter.name, 'camel')}`,
                  (builder) =>
                    builder.appendObjectLiteral(
                      parameter.style !== undefined
                        ? `style: ${this.toStringLiteral(ctx, parameter.style)}`
                        : undefined,
                      parameter.explode !== undefined ? `explode: ${parameter.explode ? 'true' : 'false'}` : undefined
                    )
                )
                .appendLine(';')
          )
          .if(endpoint.requestBody !== undefined, (builder) =>
            builder
              .append('rb.body')
              .appendParameters(
                'params.body',
                this.toStringLiteral(ctx, endpoint.requestBody?.content[0]?.type ?? 'application/json')
              )
              .appendLine(';')
          )
      );
    }

    const response = this.getEndpointSuccessResponse(ctx, endpoint);
    const accept = response?.contentOptions[0]?.type ?? '*/*';
    const responseType = accept.includes('json') ? 'json' : 'text';
    builder
      .ensurePreviousLineEmpty()
      .append('this.http.request')
      .appendParameters((builder) =>
        builder
          .append('rb.build')
          .appendParameters((builder) =>
            builder.appendObjectLiteral(
              `responseType: ${this.toStringLiteral(ctx, responseType)}`,
              `accept: ${this.toStringLiteral(ctx, accept)}`,
              'context: context'
            )
          )
      )
      .append('.pipe')
      .appendParameters(
        (builder) =>
          builder.appendExternalTypeUsage(this.rxjsFilterType).appendParameters((builder) =>
            builder.appendFunction({
              parameters: ['r: any'],
              body: (builder) => builder.append('r instanceof ').appendExternalTypeUsage(this.httpResponseType),
              singleLine: true,
            })
          ),
        (builder) =>
          builder.appendExternalTypeUsage(this.rxjsMapType).appendParameters((builder) =>
            builder.appendFunction({
              parameters: [{ name: 'r', type: this.httpResponseType, genericArguments: ['any'] }],
              body: response?.contentOptions?.[0]
                ? (builder) =>
                    builder
                      .append('r as ')
                      .appendExternalTypeUsage(this.getStrictHttpResponseType(ctx))
                      .appendGenericArguments((builder) =>
                        this.generateEndpointSuccessResponseSchema(ctx, builder, endpoint)
                      )
                : (builder) =>
                    builder
                      .parenthesize('()', (builder) =>
                        builder
                          .append('r as ')
                          .appendExternalTypeUsage(this.httpResponseType)
                          .appendGenericArguments('any')
                      )
                      .append('.clone')
                      .appendParameters((builder) => builder.appendObjectLiteral('body: undefined'))
                      .append(' as ')
                      .appendExternalTypeUsage(this.getStrictHttpResponseType(ctx))
                      .appendGenericArguments('void'),
              singleLine: true,
            })
          )
      )
      .appendLine(';');
  }

  protected generateEndpointMethod(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder.appendMethod(this.getEndpointMethodOptions(ctx, endpoint));
  }

  protected generateEndpointMethodContent(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    builder
      .append('return this.', this.getEndpointResponseMethodName(ctx, endpoint))
      .appendParameters(this.hasEndpointParams(ctx, endpoint) ? 'params' : undefined, 'context')
      .append('.pipe')
      .appendParameters((builder) =>
        builder
          .appendExternalTypeUsage(this.rxjsMapType)
          .append('((r: ')
          .appendExternalTypeUsage(this.getStrictHttpResponseType(ctx))
          .appendGenericArguments((builder) => this.generateEndpointSuccessResponseSchema(ctx, builder, endpoint))
          .append(') => r.body as ')
          .append((builder) => this.generateEndpointSuccessResponseSchema(ctx, builder, endpoint))
          .append(')')
      )
      .appendLine(';');
  }

  protected getClassOptions(ctx: Context): TypeScriptClassOptions {
    return {
      name: this.getClassName(ctx),
      documentation: ctx.service.description,
      annotations: [
        {
          name: 'Injectable',
          moduleName: '@angular/core',
          args: [(builder) => builder.appendObjectLiteral(`providedIn: ${this.toStringLiteral(ctx, 'root')}`)],
        },
      ],
      extends: (builder) => builder.appendExternalTypeUsage(this.getBaseServiceType(ctx)),
      body: (builder) => this.generateClassContent(ctx, builder),
    };
  }

  protected getConstructorOptions(ctx: Context): TypeScriptConstructorOptions {
    return {
      parameters: [
        { name: 'config', type: (builder) => builder.appendExternalTypeUsage(this.getApiConfigurationType(ctx)) },
        { name: 'http', type: (builder) => builder.appendExternalTypeUsage(this.httpClientType) },
      ],
      body: (builder) => this.generateConstructorContent(ctx, builder),
    };
  }

  protected getEndpointPathPropertyOptions(ctx: Context, endpoint: ApiEndpoint): TypeScriptPropertyOptions {
    return {
      name: this.getEndpointPathPropertyName(ctx, endpoint),
      documentation: ctx.config.exposePathProperties
        ? `Path part for operation ${this.getEndpointMethodName(ctx, endpoint)}`
        : undefined,
      isStatic: true,
      accessibility: ctx.config.exposePathProperties ? 'public' : 'protected',
      isReadonly: true,
      initializer: this.toStringLiteral(ctx, endpoint.path),
    };
  }

  protected getEndpointMethodParams(
    ctx: Context,
    endpoint: ApiEndpoint
  ): (TextOrBuilderFn<Builder> | TypeScriptParameterOptions)[] {
    const params: (TextOrBuilderFn<Builder> | TypeScriptParameterOptions)[] = [];
    if (this.hasEndpointParams(ctx, endpoint)) {
      params.push({
        name: 'params',
        type: this.getEndpointParamsTypeName(ctx, endpoint),
      });
    }

    params.push({
      name: 'context',
      isOptional: true,
      type: (builder) => builder.appendExternalTypeUsage(this.httpContextType),
    });

    return params;
  }

  protected generateEndpointSuccessResponseSchema(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
    const successResponse = this.getEndpointSuccessResponse(ctx, endpoint);
    const schema = successResponse?.contentOptions[0]?.schema;
    if (schema) {
      const model = ctx.input.models[schema.id];
      if (model) {
        builder.appendModelUsage(model);
      } else {
        builder.append(this.getAnyType(ctx));
      }
    } else {
      builder.append('void');
    }
  }

  protected getEndpointResponseMethodOptions(ctx: Context, endpoint: ApiEndpoint): TypeScriptMethodOptions {
    return {
      name: this.getEndpointResponseMethodName(ctx, endpoint),
      accessibility: ctx.config.exposeResponseMethods ? 'public' : 'protected',
      documentation: ctx.config.exposeResponseMethods
        ? [
            endpoint.summary,
            endpoint.description,
            'This method provides access to the full `HttpResponse`, allowing access to response headers.\n' +
              `To access only the response body, use \`${this.getEndpointMethodName(ctx, endpoint)}()\` instead.`,
          ]
            .filter((x) => x)
            .join('\n\n')
        : undefined,
      parameters: this.getEndpointMethodParams(ctx, endpoint),
      returnType: (builder) =>
        builder
          .appendExternalTypeUsage(this.observableType)
          .appendGenericArguments((builder) =>
            builder
              .appendExternalTypeUsage(this.getStrictHttpResponseType(ctx))
              .appendGenericArguments((builder) => this.generateEndpointSuccessResponseSchema(ctx, builder, endpoint))
          ),
      body: (builder) => this.generateEndpointResponseMethodContent(ctx, builder, endpoint),
    };
  }

  protected getEndpointMethodOptions(ctx: Context, endpoint: ApiEndpoint): TypeScriptMethodOptions {
    return {
      name: this.getEndpointMethodName(ctx, endpoint),
      accessibility: 'public',
      documentation: [
        endpoint.summary,
        endpoint.description,
        ctx.config.exposeResponseMethods
          ? 'This method provides access only to the response body.\n' +
            `To access the full response (for headers, for example), \`${this.getEndpointResponseMethodName(
              ctx,
              endpoint
            )}()\` instead.`
          : undefined,
      ]
        .filter((x) => x)
        .join('\n\n'),
      parameters: this.getEndpointMethodParams(ctx, endpoint),
      returnType:
        ctx.config.clientMethodFlavor === 'response-handler'
          ? 'void'
          : (builder) =>
              builder
                .appendExternalTypeUsage(this.observableType)
                .appendGenericArguments((builder) =>
                  this.generateEndpointSuccessResponseSchema(ctx, builder, endpoint)
                ),
      body: (builder) => this.generateEndpointMethodContent(ctx, builder, endpoint),
    };
  }

  protected getEndpointSuccessResponse(ctx: Context, endpoint: ApiEndpoint) {
    return (
      endpoint.responses.find((x) => x.statusCode && x.statusCode >= 200 && x.statusCode < 300) ??
      endpoint.responses.find((x) => x.statusCode === undefined)
    );
  }

  protected getClassName(ctx: Context): string {
    return this.toTypeName(ctx, ctx.service.name);
  }

  protected hasEndpointParams(ctx: Context, endpoint: ApiEndpoint) {
    return endpoint.parameters.length > 0 || endpoint.requestBody !== undefined;
  }

  protected getEndpointParamsTypeName(ctx: Context, endpoint: ApiEndpoint) {
    return toCasing(this.getEndpointMethodName(ctx, endpoint), 'pascal') + 'Params';
  }

  protected getEndpointPathPropertyName(ctx: Context, endpoint: ApiEndpoint): string {
    return this.getEndpointMethodName(ctx, endpoint) + 'Path';
  }

  protected getEndpointMethodName(ctx: Context, endpoint: ApiEndpoint): string {
    return this.toMethodName(ctx, endpoint.name);
  }

  protected getEndpointResponseMethodName(ctx: Context, endpoint: ApiEndpoint): string {
    return this.getEndpointMethodName(ctx, endpoint) + '$Response';
  }

  protected getFilePath(ctx: Context): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.clientDirPath,
      `${toCasing(ctx.service.name, ctx.config.fileNameCasing)}.ts`
    );
  }

  protected getUtilsDirPath(ctx: Context): string {
    return resolve(ctx.config.outputDir, ctx.config.utilsDirPath);
  }
}
