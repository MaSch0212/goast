import { resolve } from 'node:path';

import {
  type ApiEndpoint,
  type ApiResponse,
  type ApiSchema,
  type AppendValueGroup,
  appendValueGroup,
  builderTemplate as s,
  type MaybePromise,
  type Nullable,
  toCasing,
} from '@goast/core';

import { ts } from '../../../ast/index.ts';
import type { TypeScriptExportOutput } from '../../../common-results.ts';
import { TypeScriptFileBuilder } from '../../../file-builder.ts';
import { TypeScriptFileGenerator } from '../../file-generator.ts';
import type { TypeScriptAngularServiceGeneratorContext, TypeScriptAngularServiceGeneratorOutput } from './models.ts';

type Context = TypeScriptAngularServiceGeneratorContext;
type Output = TypeScriptAngularServiceGeneratorOutput;
type Builder = TypeScriptFileBuilder;

export interface TypeScriptAngularServiceGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): MaybePromise<TOutput>;
}

export class DefaultTypeScriptAngularServiceGenerator extends TypeScriptFileGenerator<Context, Output>
  implements TypeScriptAngularServiceGenerator {
  public generate(ctx: Context): MaybePromise<Output> {
    const responseModels = this.generateResponseModels(ctx);

    const filePath = this.getServiceFilePath(ctx);
    const name = this.getServiceClassName(ctx);

    TypeScriptFileBuilder.generate({
      logName: `service ${name}`,
      filePath,
      options: ctx.config,
      generator: (b) => b.append(this.getServiceFileContent(ctx)),
    });

    return {
      filePath,
      component: name,
      responseModels,
    };
  }

  // #region Response Model
  protected generateResponseModels(ctx: Context): Record<string, TypeScriptExportOutput> {
    const result: Record<string, TypeScriptExportOutput> = {};
    const filePath = this.getResponseModelFilePath(ctx);
    const builder = new TypeScriptFileBuilder(filePath, ctx.config);

    for (const endpoint of ctx.service.endpoints) {
      const name = this.getResponseModelName(ctx, endpoint);
      builder.appendLine(this.getResponseModelFileContent(ctx, endpoint));
      result[endpoint.id] = { component: name, filePath };
    }

    builder.writeToFile();
    return result;
  }

  protected getResponseModelFileContent(ctx: Context, endpoint: ApiEndpoint): AppendValueGroup<Builder> {
    const result = appendValueGroup<Builder>([]);
    const statusCodes = this.getEndpointStatusCodes(ctx, endpoint);
    let statusCodeType: ts.Reference<Builder>;

    const statusCodesTypeName = toCasing(`${endpoint.name}_StatusCodes`, ctx.config.typeNameCasing);
    result.values.push(ts.typeAlias(statusCodesTypeName, ts.unionType(Object.keys(statusCodes))));
    if (ctx.config.strictResponseTypes) {
      statusCodeType = ts.reference(statusCodesTypeName);
    } else {
      statusCodeType = ctx.refs.httpStatusCode();
    }

    result.values.push(
      ts.typeAlias(
        this.getResponseModelName(ctx, endpoint),
        ts.intersectionType([
          ts.unionType([
            ...Object.entries(statusCodes).map(([key, value]) => {
              const isSuccess = key.startsWith('2');
              return ts.intersectionType<Builder>([
                isSuccess
                  ? ts.refs.angular.httpResponse([value.type])
                  : ts.refs.omit([ts.refs.angular.httpErrorResponse(), ts.string('error')]),
                ts.objectType({
                  members: [
                    isSuccess ? null : ts.property('error', { type: ts.unionType([value.type, ts.refs.null_()]) }),
                    ts.property('status', { type: key }),
                    ts.property('ok', { type: isSuccess ? 'true' : 'false' }),
                  ],
                }),
              ]);
            }),
            !ctx.config.strictResponseTypes
              ? ts.intersectionType([
                ts.refs.angular.httpResponse([this.getAnyType(ctx)]),
                ts.objectType({
                  members: [
                    ts.property('status', {
                      type: ts.refs.exclude([ctx.refs.httpStatusCode(), ts.reference(statusCodesTypeName)]),
                    }),
                  ],
                }),
              ])
              : null,
          ]),
          ts.objectType({ members: [ts.property('status', { type: 'TStatus' })] }),
        ]),
        {
          doc: ts.doc({
            description: `Response model for operation ${this.getEndpointMethodName(ctx, endpoint)}`,
            tags: [endpoint.deprecated ? ts.docTag('deprecated') : null],
          }),
          export: true,
          generics: [
            ts.genericParameter('TStatus', {
              constraint: statusCodeType,
              default: statusCodeType,
            }),
          ],
        },
      ),
    );

    return result;
  }

  protected getEndpointStatusCodes(
    ctx: Context,
    endpoint: ApiEndpoint,
  ): Record<number, { parser: 'text' | 'json'; type: ts.Type<Builder> }> {
    return Object.fromEntries([
      ...Object.entries(ctx.config.defaultStatusCodeResponseTypes).map(([key, value]) => [
        key,
        {
          parser: value?.parser ?? 'text',
          type: typeof value?.type === 'function'
            ? this.getSchemaType(ctx, value.type(ctx.data.schemas))
            : value ?? this.getAnyType(ctx),
        },
      ]),
      ...endpoint.responses
        .filter((x) => x.statusCode)
        .map((x) => [
          x.statusCode,
          {
            parser: this.contentTypeToResponseType(x.contentOptions[0]?.type),
            type: this.getSchemaType(ctx, x.contentOptions[0]?.schema, this.getAnyType(ctx)),
          },
        ]),
    ]);
  }
  // #endregion

  protected getServiceFileContent(ctx: Context): AppendValueGroup<Builder> {
    const code = appendValueGroup<Builder>([], '\n');
    for (const endpoint of ctx.service.endpoints) {
      if (endpoint.parameters.length > 0 || endpoint.requestBody !== undefined) {
        code.values.push(this.getEndpointParamsType(ctx, endpoint));
      }
    }
    code.values.push(this.getClass(ctx));
    return code;
  }

  protected getEndpointParamsType(ctx: Context, endpoint: ApiEndpoint): ts.TypeAlias<Builder> {
    const type = ts.objectType<Builder>();

    for (const parameter of endpoint.parameters) {
      const schema = parameter.schema;
      type.members.push(
        ts.property(toCasing(parameter.name, ctx.config.propertyNameCasing), {
          doc: ts.doc({
            description: parameter.description,
            tags: [parameter.deprecated ? ts.docTag('deprecated') : null],
          }),
          type: schema ? (b) => b.appendModelUsage(ctx.input.typescript.models[schema.id]) : this.getAnyType(ctx),
          optional: !parameter.required,
        }),
      );
    }

    if (endpoint.requestBody !== undefined) {
      const body = endpoint.requestBody;
      const schema = body.content[0].schema;
      type.members.push(
        ts.property('body', {
          doc: ts.doc({ description: body.description }),
          type: schema ? (b) => b.appendModelUsage(ctx.input.typescript.models[schema.id]) : this.getAnyType(ctx),
          optional: !body.required,
        }),
      );
    }

    return ts.typeAlias(this.getEndpointParamsTypeName(ctx, endpoint), type, {
      doc: ts.doc({ description: `Parameters for operation ${this.getEndpointMethodName(ctx, endpoint)}` }),
    });
  }

  protected getClass(ctx: Context): ts.Class<Builder> {
    return ts.class<Builder>(this.getServiceClassName(ctx), {
      doc: ts.doc({
        description: ctx.service.description,
        tags: [
          ctx.service.endpoints.length === 0 || ctx.service.endpoints.some((x) => !x.deprecated)
            ? null
            : ts.docTag('deprecated'),
        ],
      }),
      decorators: [
        ts.decorator(
          ts.refs.angular.injectable(),
          ctx.config.provideKind === 'root' ? [ts.toNode({ providedIn: 'root' })] : [],
        ),
      ],
      export: true,
      extends: ctx.refs.apiBaseService(),
      members: [
        ...ctx.service.endpoints.map((e) =>
          ts.property(this.getEndpointPathPropertyName(ctx, e), {
            accessModifier: 'private',
            static: true,
            readonly: true,
            value: ts.string(e.path),
          })
        ),
        ...ctx.service.endpoints.map((e) => this.getEndpointMethod(ctx, e)),
      ],
    });
  }

  protected getEndpointMethod(ctx: Context, endpoint: ApiEndpoint): ts.Method<Builder> {
    const hasParams = this.hasEndpointParams(ctx, endpoint);
    const paramsOptional = !endpoint.parameters.some((p) => p.required) && !endpoint.requestBody?.required;
    const responseModelType = ts.reference(
      this.getResponseModelName(ctx, endpoint),
      this.getResponseModelFilePath(ctx),
      {
        importType: 'type-import',
      },
    );
    const returnType = ctx.refs.abortablePromise([responseModelType]);
    const accept = this.getEndpointSuccessResponseType(ctx, endpoint);
    const responseType = this.contentTypeToResponseType(accept);
    return ts.method<Builder>(this.getEndpointMethodName(ctx, endpoint), {
      accessModifier: 'public',
      parameters: [
        hasParams
          ? ts.parameter('params', {
            optional: paramsOptional,
            type: ts.reference(this.getEndpointParamsTypeName(ctx, endpoint)),
          })
          : null,
        ts.parameter('context', { optional: true, type: ts.refs.angular.httpContext() }),
      ],
      doc: ts.doc({
        description: endpoint.description,
        tags: [endpoint.deprecated ? ts.docTag('deprecated') : null],
      }),
      returnType,
      body: appendValueGroup(
        [
          s`const rb = new ${ctx.refs.requestBuilder()}(this.rootUrl, ${
            this.getServiceClassName(
              ctx,
            )
          }.${this.getEndpointPathPropertyName(ctx, endpoint)}, '${endpoint.method}');`,
          hasParams
            ? (b) =>
              b.appendIf(paramsOptional, 'if (params) ').parenthesizeIf(
                paramsOptional,
                '{}',
                appendValueGroup(
                  [
                    ...endpoint.parameters
                      .filter((p) => p.target === 'path' || p.target === 'query' || p.target === 'header')
                      .map((p) => {
                        const options = ts.object({
                          members: [
                            p.style !== undefined ? ts.property('style', { value: ts.string(p.style) }) : null,
                            p.explode !== undefined ? ts.property('explode', { value: ts.toNode(p.explode) }) : null,
                          ],
                        });
                        return s<Builder>`rb.${p.target}(${ts.string(p.name)}, params.${
                          toCasing(
                            p.name,
                            ctx.config.propertyNameCasing,
                          )
                        }, ${options});`;
                      }),
                    endpoint.requestBody
                      ? s`rb.body(params.body, ${ts.string(this.getEndpointRequestContentType(ctx, endpoint))});`
                      : null,
                  ],
                  '\n',
                ),
                { multiline: true },
              )
            : null,
          '',
          s`return ${ctx.refs.waitForResponse([responseModelType])}(${s.indent`
              this.http.request(rb.build({${s.indent`
                responseType: ${ts.string(responseType)},
                accept: ${ts.string(accept)},
                context,`}
              })),
              {${s.indent`
                errorResponseTypes: ${
            ts.object({
              members: [
                ...Object.entries(this.getEndpointStatusCodes(ctx, endpoint))
                  .filter(([key]) => !key.startsWith('2'))
                  .map(([key, value]) => {
                    return ts.property(key, { value: ts.string(value.parser) });
                  }),
              ],
            })
          }`}
              }`}
            )`,
        ],
        '\n',
      ),
    });
  }

  protected getEndpointRequestContentType(ctx: Context, endpoint: ApiEndpoint): string {
    return ctx.config.defaultSuccessResponseContentType ?? endpoint?.requestBody?.content[0].type ?? 'application/json';
  }

  protected getEndpointSuccessResponseType(ctx: Context, endpoint: ApiEndpoint): string {
    const response = this.getEndpointSuccessResponse(ctx, endpoint);
    if (!response) return '*/*';

    if (!ctx.config.defaultSuccessResponseContentType) return response.contentOptions[0]?.type ?? '*/*';

    return (
      response.contentOptions.find((x) => x.type === ctx.config.defaultSuccessResponseContentType)?.type ??
        response.contentOptions[0]?.type ??
        '*/*'
    );
  }

  protected getEndpointSuccessResponse(_ctx: Context, endpoint: ApiEndpoint): ApiResponse | undefined {
    return (
      endpoint.responses.find((x) => x.statusCode && x.statusCode >= 200 && x.statusCode < 300) ??
        endpoint.responses.find((x) => x.statusCode === undefined)
    );
  }

  protected getServiceClassName(ctx: Context): string {
    return toCasing(ctx.service.name + '_Service', ctx.config.typeNameCasing);
  }

  protected getResponseModelName(ctx: Context, endpoint: ApiEndpoint): string {
    return toCasing(`${this.getEndpointMethodName(ctx, endpoint)}ApiResponse`, ctx.config.typeNameCasing);
  }

  protected getEndpointParamsTypeName(ctx: Context, endpoint: ApiEndpoint): string {
    return toCasing(this.getEndpointMethodName(ctx, endpoint) + '_Params', ctx.config.typeNameCasing);
  }

  protected getEndpointPathPropertyName(ctx: Context, endpoint: ApiEndpoint): string {
    return toCasing(this.getEndpointMethodName(ctx, endpoint) + '_Path', ctx.config.constantNameCasing);
  }

  protected getEndpointMethodName(ctx: Context, endpoint: ApiEndpoint): string {
    return toCasing(endpoint.name, ctx.config.functionNameCasing);
  }

  protected getServiceFilePath(ctx: Context): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.servicesDir,
      `${toCasing(ctx.service.name, ctx.config.serviceFileNameCasing ?? ctx.config.fileNameCasing)}.ts`,
    );
  }

  protected getResponseModelFilePath(ctx: Context): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.responseModelsDir,
      `${toCasing(ctx.service.name, ctx.config.responseModelFileNameCasing ?? ctx.config.fileNameCasing)}.ts`,
    );
  }

  protected hasEndpointParams(_ctx: Context, endpoint: ApiEndpoint): boolean {
    return endpoint.parameters.length > 0 || endpoint.requestBody !== undefined;
  }

  protected getSchemaType(ctx: Context, schema: ApiSchema | undefined, fallback?: ts.Type<Builder>): ts.Type<Builder> {
    const output = schema && ctx.input.typescript.models[schema.id];
    if (!output) return fallback ?? this.getAnyType(ctx);
    return (b) => b.appendModelUsage(output);
  }

  private contentTypeToResponseType(contentType: Nullable<string>): 'text' | 'json' {
    return contentType?.includes('json') ? 'json' : 'text';
  }
}
