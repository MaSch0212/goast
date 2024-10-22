import { resolve } from 'node:path';

import {
  type ApiEndpoint,
  type ApiResponse,
  type ApiSchema,
  type AppendValueGroup,
  appendValueGroup,
  builderTemplate as s,
  type MaybePromise,
  toCasing,
} from '@goast/core';

import { ts } from '../../../ast/index.ts';
import type { TypeScriptExportOutput } from '../../../common-results.ts';
import { TypeScriptFileBuilder } from '../../../file-builder.ts';
import type { TypeScriptImportOptions } from '../../../import-collection.ts';
import { TypeScriptFileGenerator } from '../../file-generator.ts';
import type { TypeScriptK6ClientGeneratorContext, TypeScriptK6ClientGeneratorOutput } from './models.ts';

type Context = TypeScriptK6ClientGeneratorContext;
type Output = TypeScriptK6ClientGeneratorOutput;
type Builder = TypeScriptFileBuilder;

export interface TypeScriptK6ClientGenerator<TOutput extends Output = Output> {
  generate(context: Context): MaybePromise<TOutput>;
}

export class DefaultTypeScriptK6ClientGenerator extends TypeScriptFileGenerator<Context, Output>
  implements TypeScriptK6ClientGenerator {
  public override generate(ctx: TypeScriptK6ClientGeneratorContext): MaybePromise<TypeScriptK6ClientGeneratorOutput> {
    const responseModels = this.generateResponseModels(ctx);

    const filePath = this.getFilePath(ctx);
    const name = this.getClassName(ctx);

    TypeScriptFileBuilder.generate({
      logName: `k6 client ${name}`,
      filePath,
      options: ctx.config,
      generator: (b) => b.append(this.getClientFileContent(ctx)),
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
              return ts.intersectionType<Builder>([
                ts.refs.omit([ts.refs.k6.response(), ts.string('json')]),
                ts.objectType({
                  members: [
                    ts.property('status', { type: key }),
                    ts.method('json', {
                      returnType: value.type,
                    }),
                    ts.method('json', {
                      parameters: [ts.parameter('selector', { type: ts.refs.string() })],
                      returnType: ts.refs.k6.jsonValue(),
                    }),
                  ],
                }),
              ]);
            }),
            !ctx.config.strictResponseTypes
              ? ts.intersectionType([
                ts.refs.k6.response(),
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

  protected getEndpointStatusCodes(ctx: Context, endpoint: ApiEndpoint): Record<number, { type: ts.Type<Builder> }> {
    return Object.fromEntries([
      ...Object.entries(ctx.config.defaultStatusCodeResponseTypes).map(([key, value]) => [
        key,
        {
          parser: value?.parser ?? 'text',
          type: typeof value?.type === 'function'
            ? this.getSchemaType(ctx, value.type(ctx.data.schemas))
            : value ?? ts.refs.never(),
        },
      ]),
      ...endpoint.responses
        .filter((x) => x.statusCode)
        .map((x) => [
          x.statusCode,
          {
            type: this.getSchemaType(ctx, x.contentOptions[0]?.schema, { fallback: ts.refs.never() }),
          },
        ]),
    ]);
  }
  // #endregion

  protected getClientFileContent(ctx: Context): AppendValueGroup<Builder> {
    const code = appendValueGroup<Builder>([], '\n');
    for (const endpoint of ctx.service.endpoints) {
      if (endpoint.parameters.length > 0 || endpoint.requestBody !== undefined) {
        code.values.push(this.getEndpointParamsType(ctx, endpoint));
      }
    }
    code.values.push(
      appendValueGroup<Builder>(
        ctx.service.endpoints.map((e) =>
          ts.variable(this.getEndpointPathPropertyName(ctx, e), {
            readonly: true,
            value: ts.string(e.path),
          })
        ),
      ),
    );
    code.values.push(this.getClass(ctx));
    return code;
  }

  protected getEndpointParamsType(ctx: Context, endpoint: ApiEndpoint): ts.Doc<Builder> {
    const type = ts.doc<Builder>({
      description: `Parameters for operation ${this.getEndpointMethodName(ctx, endpoint)}`,
      tags: [ts.docTag('typedef', this.getEndpointParamsTypeName(ctx, endpoint))],
    });

    for (const parameter of endpoint.parameters) {
      const schema = parameter.schema;
      const name = toCasing(parameter.name, ctx.config.propertyNameCasing);
      type.tags.push(
        ts.docTag('property', parameter.required ? name : `[${name}]`, {
          type: schema
            ? (b) => b.appendModelUsage(ctx.input.typescript.models[schema.id], { type: 'js-doc' })
            : this.getAnyType(ctx),
          text: (parameter.deprecated ? 'Deprecated: ' : '') + parameter.description,
        }),
      );
    }

    if (endpoint.requestBody !== undefined) {
      const body = endpoint.requestBody;
      const schema = body.content[0].schema;
      type.tags.push(
        ts.docTag('property', body.required ? 'body' : '[body]', {
          type: schema
            ? (b) => b.appendModelUsage(ctx.input.typescript.models[schema.id], { type: 'js-doc' })
            : this.getAnyType(ctx),
          text: body.description,
        }),
      );
    }

    return type;
  }

  protected getClass(ctx: Context): ts.Class<Builder> {
    return ts.class<Builder>(this.getClassName(ctx), {
      doc: ts.doc({
        description: ctx.service.description,
        tags: [
          ts.docTag('property', 'rootUrl', 'The root URL for this client.', {
            type: ts.refs.string(),
          }),
          ctx.service.endpoints.length === 0 || ctx.service.endpoints.some((x) => !x.deprecated)
            ? null
            : ts.docTag('deprecated'),
        ],
      }),
      export: true,
      members: [
        ts.constructor({
          doc: ts.doc({
            description: 'Creates a new instance of the client.',
            tags: [
              ts.docTag('param', 'rootUrl', 'The root URL for this client.', { type: ts.refs.string() }),
              ts.docTag(
                'param',
                '[defaultK6ParamsFactory]',
                'A factory function that returns the default K6 parameters.',
                {
                  type: ts.functionType({ returnType: ts.refs.k6.params({ importType: 'js-doc' }) }),
                },
              ),
            ],
          }),
          parameters: [ts.constructorParameter('rootUrl'), ts.constructorParameter('defaultK6ParamsFactory')],
          body: s`this.rootUrl = rootUrl;
                  this._defaultK6ParamsFactory = defaultK6ParamsFactory;`,
        }),
        ...ctx.service.endpoints.map((e) => this.getEndpointMethod(ctx, e)),
        this.getGetK6ParamsMethod(ctx),
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
        importType: 'js-doc',
      },
    );
    const returnType = responseModelType;
    const accept = this.getEndpointSuccessResponse(ctx, endpoint)?.contentOptions[0]?.type ?? '*/*';

    return ts.method<Builder>(this.getEndpointMethodName(ctx, endpoint), {
      async: ctx.config.async,
      parameters: [hasParams ? ts.parameter('params') : null, ts.parameter('k6Params')],
      doc: ts.doc({
        description: endpoint.description,
        tags: [
          hasParams
            ? ts.docTag('param', paramsOptional ? '[params]' : 'params', {
              type: ts.reference(this.getEndpointParamsTypeName(ctx, endpoint)),
            })
            : null,
          ts.docTag('param', '[k6Params]', {
            type: ts.refs.k6.params({ importType: 'js-doc' }),
          }),
          ts.docTag('returns', {
            type: ctx.config.async ? ts.refs.promise([returnType]) : returnType,
          }),
          endpoint.deprecated ? ts.docTag('deprecated') : null,
        ],
      }),
      body: appendValueGroup(
        [
          s`const rb = new ${ctx.refs.requestBuilder()}(this.rootUrl, ${
            this.getEndpointPathPropertyName(ctx, endpoint)
          }, '${endpoint.method}');`,
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
                      ? s`rb.body(params.body, ${
                        ts.string(endpoint.requestBody.content[0].type ?? 'application/json')
                      });`
                      : null,
                  ],
                  '\n',
                ),
                { multiline: true },
              )
            : null,
          '',
          s`return /** @type {${returnType}} */ (${s.indent`
              ${ctx.config.async ? 'await rb.buildAsync' : 'rb.build'}({${s.indent`
                accept: ${ts.string(accept)},
                params: this.getK6Params(k6Params),`}
              })`}
            );`,
        ],
        '\n',
      ),
    });
  }

  protected getGetK6ParamsMethod(_ctx: Context): ts.Method<Builder> {
    return ts.method('getK6Params', {
      doc: ts.doc({
        tags: [
          ts.docTag('private'),
          ts.docTag('param', '[k6Params]', { type: ts.refs.k6.params({ importType: 'js-doc' }) }),
        ],
      }),
      parameters: [ts.parameter('k6Params')],
      body: s`return Object.assign({}, this._defaultK6ParamsFactory ? this._defaultK6ParamsFactory() : {}, k6Params);`,
    });
  }

  protected getEndpointSuccessResponse(_ctx: Context, endpoint: ApiEndpoint): ApiResponse | undefined {
    return (
      endpoint.responses.find((x) => x.statusCode && x.statusCode >= 200 && x.statusCode < 300) ??
        endpoint.responses.find((x) => x.statusCode === undefined)
    );
  }

  protected getSchemaType(
    ctx: Context,
    schema: ApiSchema | undefined,
    options?: TypeScriptImportOptions & { fallback?: ts.Type<Builder> },
  ): ts.Type<Builder> {
    const output = schema && ctx.input.typescript.models[schema.id];
    if (!output) return options?.fallback ?? this.getAnyType(ctx);
    return (b) => b.appendModelUsage(output, options);
  }

  protected getClassName(ctx: Context): string {
    return toCasing(ctx.service.name, ctx.config.clientNameCasing ?? ctx.config.typeNameCasing);
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

  protected getFilePath(ctx: Context): string {
    return resolve(
      ctx.config.outputDir,
      ctx.config.clientDir,
      `${toCasing(ctx.service.name, ctx.config.clientFileNameCasing ?? ctx.config.fileNameCasing)}.js`,
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
}
