import { resolve } from 'path';

import {
  ApiEndpoint,
  ApiSchema,
  AppendValueGroup,
  adjustCasing,
  appendValueGroup,
  builderTemplate as s,
  toCasing,
} from '@goast/core';

import { TypeScriptEasyNetworkStubGeneratorContext, TypeScriptEasyNetworkStubGeneratorOutput } from './models';
import { ts } from '../../../ast';
import { TypeScriptFileBuilder } from '../../../file-builder';
import { TypeScriptFileGenerator } from '../../file-generator';

type Context = TypeScriptEasyNetworkStubGeneratorContext;
type Output = TypeScriptEasyNetworkStubGeneratorOutput;
type Builder = TypeScriptFileBuilder;

export interface TypeScriptEasyNetworkStubGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): TOutput;
}

export class DefaultTypeScriptEasyNetworkStubGenerator
  extends TypeScriptFileGenerator<Context, Output>
  implements TypeScriptEasyNetworkStubGenerator
{
  public generate(ctx: Context): Output {
    const filePath = this.getStubFilePath(ctx);
    const name = this.getStubClassName(ctx);

    TypeScriptFileBuilder.generate({
      logName: `stub ${name}`,
      filePath,
      options: ctx.config,
      generator: (b) => b.append(this.getStubFileContent(ctx)),
    });

    return {
      filePath,
      component: name,
    };
  }

  protected getStubFileContent(ctx: Context): AppendValueGroup<Builder> {
    return appendValueGroup(
      [...ctx.service.endpoints.map((endpoint) => this.getResponderVariable(ctx, endpoint)), this.getStubClass(ctx)],
      '\n',
    );
  }

  protected getResponderVariable(ctx: Context, endpoint: ApiEndpoint): ts.Variable<Builder> {
    return ts.variable(this.getResponderVariableName(ctx, endpoint), {
      readonly: true,
      value: ts.call(
        ctx.refs.getStubResponder([
          ts.objectType({
            members: Object.entries(this.getEndpointStatusCodes(ctx, endpoint)).map(([statusCode, type]) =>
              ts.property<Builder>(statusCode, { type }),
            ),
          }),
        ]),
        [],
      ),
    });
  }

  protected getStubClass(ctx: Context): ts.Class<Builder> {
    return ts.class(this.getStubClassName(ctx), {
      export: true,
      extends: ctx.refs.easyNetworkStubBase(),
      members: [
        ...ctx.service.endpoints.map((endpoint) =>
          ts.property<Builder>(this.getEndpointPathPropertyName(ctx, endpoint), {
            static: true,
            readonly: true,
            accessModifier: 'private',
            value: s`${ts.string(this.getStubRoute(ctx, endpoint))} as const`,
          }),
        ),
        '\n',
        ...ctx.service.endpoints.map((endpoint) =>
          ts.property<Builder>(this.getEndpointRequestsFieldName(ctx, endpoint), {
            readonly: true,
            accessModifier: 'private',
            type: this.getEndpointRequestsType(ctx, endpoint),
            value: ts.tuple([]),
          }),
        ),
        '\n',
        ...ctx.service.endpoints.map((endpoint) =>
          ts.property<Builder>(this.getEndpointRequestsPropertyName(ctx, endpoint), {
            readonly: true,
            accessModifier: 'public',
            type: this.getEndpointRequestsType(ctx, endpoint, { readonly: true }),
            get: ts.property.getter({
              body: appendValueGroup([`return this.${this.getEndpointRequestsFieldName(ctx, endpoint)};`], '\n'),
            }),
          }),
        ),
        ...ctx.service.endpoints.map((endpoint) => this.getEndpointStubMethod(ctx, endpoint)),
        ts.method('reset', {
          accessModifier: 'public',
          override: true,
          returnType: ts.refs.void_(),
          body: appendValueGroup(
            [
              ...ctx.service.endpoints.map(
                (endpoint) => `this.${this.getEndpointRequestsFieldName(ctx, endpoint)}.length = 0;`,
              ),
              'super.reset();',
            ],
            '\n',
          ),
        }),
      ],
    });
  }

  protected getEndpointRequestsType(
    ctx: Context,
    endpoint: ApiEndpoint,
    options?: { readonly?: boolean },
  ): ts.Type<Builder> {
    return ts.arrayType(
      ctx.refs.stubRequestInfo([
        ts.typeof(ts.call([this.getStubClassName(ctx), this.getEndpointPathPropertyName(ctx, endpoint)])),
        this.getSchemaType(ctx, endpoint.requestBody?.content[0].schema),
      ]),
      options,
    );
  }

  protected getEndpointStubMethod(ctx: Context, endpoint: ApiEndpoint): ts.Method<Builder> {
    const requestType = this.getSchemaType(ctx, endpoint.requestBody?.content[0].schema);
    return ts.method(this.getEndpointStubMethodName(ctx, endpoint), {
      accessModifier: 'public',
      parameters: [
        ts.parameter('response', {
          type: ctx.refs.strictRouteResponseCallback([
            requestType,
            ts.typeof(ts.call([this.getStubClassName(ctx), this.getEndpointPathPropertyName(ctx, endpoint)])),
            ts.typeof(this.getResponderVariableName(ctx, endpoint)),
          ]),
        }),
      ],
      returnType: 'this',
      body: appendValueGroup(
        [
          s`this.stubWrapper.stub2<${requestType}>()(${s.indent`
              ${ts.string(endpoint.method.toUpperCase())},
              ${this.getStubClassName(ctx)}.${this.getEndpointPathPropertyName(ctx, endpoint)},
              async (request) => {${s.indent`
                if (this.stubWrapper.options.rememberRequests) {${s.indent`
                  this.${this.getEndpointRequestsFieldName(ctx, endpoint)}.push(request);`}
                }
                throw await response(${this.getResponderVariableName(ctx, endpoint)}, request);`}
              }`}
            );`,
          'return this;',
        ],
        '\n',
      ),
    });
  }

  protected getStubFilePath(ctx: Context): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.stubsDirPath,
      `${toCasing(ctx.service.name, ctx.config.fileNameCasing)}.ts`,
    );
  }

  protected getResponderVariableName(ctx: Context, endpoint: ApiEndpoint): string {
    return toCasing(endpoint.name + '_Responder', ctx.config.propertyNameCasing);
  }

  protected getStubClassName(ctx: Context): string {
    return toCasing(ctx.service.name + '_Stubs', ctx.config.typeNameCasing);
  }

  protected getEndpointPathPropertyName(ctx: Context, endpoint: ApiEndpoint): string {
    return toCasing(endpoint.name + '_Path', ctx.config.constantNameCasing);
  }

  protected getEndpointRequestsFieldName(ctx: Context, endpoint: ApiEndpoint): string {
    return toCasing(endpoint.name + '_Requests', adjustCasing(ctx.config.propertyNameCasing, { prefix: '_' }));
  }

  protected getEndpointRequestsPropertyName(ctx: Context, endpoint: ApiEndpoint): string {
    return toCasing(endpoint.name + '_Requests', ctx.config.propertyNameCasing);
  }

  protected getEndpointStubMethodName(ctx: Context, endpoint: ApiEndpoint): string {
    return toCasing('stub_' + endpoint.name, ctx.config.functionNameCasing);
  }

  protected getStubRoute(ctx: Context, endpoint: ApiEndpoint): string {
    let path = endpoint.path;
    let isFirstQueryParam = true;
    for (const param of endpoint.parameters) {
      let type = ((param.schema && ctx.input.models[param.schema.id]?.component) ?? ts.refs.unknown.name).replace(
        /^readonly /,
        '',
      );

      const arrayMatch = /^\((.*)\)\[\]$/.exec(type);
      if (arrayMatch !== null) {
        type = `${arrayMatch[1]}[]`;
      }

      if (param.target === 'path') {
        path = path.replace(`{${param.name}}`, `{${param.name}${param.required ? '' : '?'}:${type}}`);
      } else if (param.target === 'query') {
        path = path + (isFirstQueryParam ? '?' : '&') + `{${param.name}${param.required ? '' : '?'}:${type}}`;
        isFirstQueryParam = false;
      }
    }
    return path.replace(/^\/+/, '');
  }

  protected getEndpointStatusCodes(ctx: Context, endpoint: ApiEndpoint): Record<number, ts.Type<Builder>> {
    return Object.fromEntries([
      ...Object.entries(ctx.config.defaultStatusCodeResponseTypes).map(([key, value]) => [
        key,
        typeof value === 'function' ? this.getSchemaType(ctx, value(ctx.data.schemas)) : value,
      ]),
      ...endpoint.responses
        .filter((x) => x.statusCode)
        .map((x) => [x.statusCode, this.getSchemaType(ctx, x.contentOptions[0]?.schema, ts.refs.never())]),
    ]);
  }

  protected getSchemaType(ctx: Context, schema: ApiSchema | undefined, fallback?: ts.Type<Builder>): ts.Type<Builder> {
    const output = schema && ctx.input.models[schema.id];
    if (!output) return fallback ?? this.getAnyType(ctx);
    return (b) => b.appendModelUsage(output);
  }
}
