import { resolve } from 'path';

import {
  ApiEndpoint,
  ApiSchema,
  AppendValueGroup,
  appendValueGroup,
  builderTemplate as s,
  toCasing,
} from '@goast/core';

import { TypeScriptAngularServiceGeneratorContext, TypeScriptAngularServiceGeneratorOutput } from './models';
import { ts } from '../../../ast';
import { TypeScriptExportOutput } from '../../../common-results';
import { TypeScriptFileBuilder } from '../../../file-builder';
import { TypeScriptFileGenerator } from '../../file-generator';

type Context = TypeScriptAngularServiceGeneratorContext;
type Output = TypeScriptAngularServiceGeneratorOutput;
type Builder = TypeScriptFileBuilder;

export interface TypeScriptAngularServiceGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): TOutput;
}

export class DefaultTypeScriptAngularServiceGenerator
  extends TypeScriptFileGenerator<Context, Output>
  implements TypeScriptAngularServiceGenerator
{
  public generate(ctx: Context): Output {
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
            ...Object.entries(statusCodes).map(([key, value]) =>
              ts.intersectionType([
                ts.refs.angular.httpResponse([value]),
                ts.objectType({
                  members: [
                    ts.property('status', { type: key }),
                    ts.property('ok', { type: key.startsWith('2') ? 'true' : 'false' }),
                  ],
                }),
              ]),
            ),
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
          doc: ts.doc({ description: parameter.description }),
          type: schema ? (b) => b.appendModelUsage(ctx.input.models[schema.id]) : this.getAnyType(ctx),
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
          type: schema ? (b) => b.appendModelUsage(ctx.input.models[schema.id]) : this.getAnyType(ctx),
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
      doc: ts.doc({ description: ctx.service.description }),
      decorators: [ts.decorator(ts.refs.angular.injectable(), [ts.toNode({ providedIn: 'root' })])],
      export: true,
      extends: ctx.refs.apiBaseService(),
      members: [
        ...ctx.service.endpoints.map((e) =>
          ts.property(this.getEndpointPathPropertyName(ctx, e), {
            accessModifier: 'private',
            static: true,
            readonly: true,
            value: ts.string(e.path),
          }),
        ),
        ...ctx.service.endpoints.map((e) => this.getEndpointMethod(ctx, e)),
      ],
    });
  }

  protected getEndpointMethod(ctx: Context, endpoint: ApiEndpoint): ts.Method<Builder> {
    const hasParams = this.hasEndpointParams(ctx, endpoint);
    const paramsOptional = !endpoint.parameters.some((p) => p.required) && !endpoint.requestBody?.required;
    const returnType = ts.refs.promise([
      ts.reference(this.getResponseModelName(ctx, endpoint), this.getResponseModelFilePath(ctx)),
    ]);
    const accept = this.getEndpointSuccessResponse(ctx, endpoint)?.contentOptions[0]?.type ?? '*/*';
    const responseType = accept.includes('json') ? 'json' : 'text';
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
      returnType,
      body: appendValueGroup(
        [
          s`const rb = new ${ctx.refs.requestBuilder()}(this.rootUrl, ${this.getServiceClassName(ctx)}.${this.getEndpointPathPropertyName(ctx, endpoint)}, '${endpoint.method}');`,
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
                              p.explode !== undefined ? ts.property('explode', { value: p.explode }) : null,
                            ],
                          });
                          return s<Builder>`rb.${p.target}(${ts.string(p.name)}, params.${toCasing(p.name, ctx.config.propertyNameCasing)}, ${options});`;
                        }),
                      endpoint.requestBody
                        ? s`rb.body(params.body, ${ts.string(endpoint.requestBody.content[0].type ?? 'application/json')});`
                        : null,
                    ],
                    '\n',
                  ),
                  { multiline: true },
                )
            : null,
          '',
          s`return ${ts.refs.rxjs.firstValueFrom()}(${s.indent`
              this.http.request(rb.build({${s.indent`
                responseType: ${ts.string(responseType)},
                accept: ${ts.string(accept)},
                context,`}
              })).pipe(${s.indent`
                ${ts.refs.rxjs.filter()}((r: unknown) => r instanceof ${ts.refs.angular.httpResponse.infer()}),
                ${ts.refs.rxjs.take()}(1),`}
              )`}
            ) as unknown as ${returnType};`,
        ],
        '\n',
      ),
    });
  }

  protected getEndpointSuccessResponse(ctx: Context, endpoint: ApiEndpoint) {
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

  protected getEndpointParamsTypeName(ctx: Context, endpoint: ApiEndpoint) {
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
      ctx.config.servicesDirPath,
      `${toCasing(ctx.service.name, ctx.config.fileNameCasing)}.ts`,
    );
  }

  protected getResponseModelFilePath(ctx: Context): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.responseModelsDirPath,
      `${toCasing(ctx.service.name, ctx.config.responseModelFileNameCasing)}.ts`,
    );
  }

  protected hasEndpointParams(ctx: Context, endpoint: ApiEndpoint) {
    return endpoint.parameters.length > 0 || endpoint.requestBody !== undefined;
  }

  protected getSchemaType(ctx: Context, schema: ApiSchema | undefined, fallback?: ts.Type<Builder>): ts.Type<Builder> {
    const output = schema && ctx.input.models[schema.id];
    if (!output) return fallback ?? this.getAnyType(ctx);
    return (b) => b.appendModelUsage(output);
  }
}
