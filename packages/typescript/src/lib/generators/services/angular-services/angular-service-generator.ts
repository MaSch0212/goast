import { resolve } from 'path';

import { ApiEndpoint, ApiSchema, AppendValueGroup, appendValueGroup, toCasing } from '@goast/core';

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
                ts.objectType({ members: [ts.property('status', { type: key })] }),
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
          appendValueGroup([
            'const rb = new ',
            ctx.refs.requestBuilder(),
            '(this.rootUrl, ',
            this.getServiceClassName(ctx),
            '.',
            this.getEndpointPathPropertyName(ctx, endpoint),
            `, '${endpoint.method}');`,
          ]),
          hasParams
            ? (b) =>
                b.appendIf(paramsOptional, 'if (params) ').parenthesizeIf(
                  paramsOptional,
                  '{}',
                  (b) => {
                    endpoint.parameters
                      .filter((p) => p.target === 'path' || p.target === 'query' || p.target === 'header')
                      .forEach((p) =>
                        b.appendLine(
                          'rb.',
                          p.target,
                          '(',
                          ts.string(p.name),
                          ', params.',
                          toCasing(p.name, ctx.config.propertyNameCasing),
                          ', ',
                          ts.object({
                            members: [
                              p.style !== undefined ? ts.property('style', { value: ts.string(p.style) }) : null,
                              p.explode !== undefined ? ts.property('explode', { value: p.explode }) : null,
                            ],
                          }),
                          ');',
                        ),
                      );
                    if (endpoint.requestBody) {
                      b.appendLine(
                        'rb.body(params.body, ',
                        ts.string(endpoint.requestBody.content[0].type ?? 'application/json'),
                        ');',
                      );
                    }
                  },
                  { multiline: true },
                )
            : null,
          (b) =>
            b
              .append('return ', ts.refs.rxjs.firstValueFrom())
              .parenthesize(
                '()',
                (b) =>
                  b
                    .append(
                      'this.http.request(rb.build(',
                      ts.object({
                        members: [
                          ts.property('responseType', { value: ts.string(responseType) }),
                          ts.property('accept', { value: ts.string(accept) }),
                          ts.property('context'),
                        ],
                      }),
                      ')).pipe',
                    )
                    .parenthesize(
                      '()',
                      (b) =>
                        b
                          .appendLine(
                            ts.refs.rxjs.filter(),
                            '((r: unknown) => r instanceof ',
                            ts.refs.angular.httpResponse.infer(),
                            '),',
                          )
                          .appendLine(ts.refs.rxjs.take(), '(1),'),
                      { multiline: true },
                    ),
                { multiline: true },
              )
              .append(' as unknown as ', returnType, ';'),
        ],
        '\n',
      ),
    });
  }

  // protected generateEndpoint(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
  //   builder
  //     .append((builder) => this.generateEndpointPathProperty(ctx, builder, endpoint))
  //     .ensurePreviousLineEmpty()
  //     .append((builder) => this.generateEndpointResponseMethod(ctx, builder, endpoint))
  //     .ensurePreviousLineEmpty()
  //     .append((builder) => this.generateEndpointMethod(ctx, builder, endpoint));
  // }

  // protected generateEndpointPathProperty(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
  //   builder.appendProperty(this.getEndpointPathPropertyOptions(ctx, endpoint));
  // }

  // protected generateEndpointResponseMethod(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
  //   builder.appendMethod(this.getEndpointResponseMethodOptions(ctx, endpoint));
  // }

  // protected generateEndpointResponseMethodContent(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
  //   builder
  //     .append('const rb = new ')
  //     .appendExternalTypeUsage(this.getRequestBuilderRef(ctx))
  //     .appendParameters(
  //       'this.rootUrl',
  //       `${this.getServiceClassName(ctx)}.${this.getEndpointPathPropertyName(ctx, endpoint)}`,
  //       this.toStringLiteral(ctx, endpoint.method),
  //     )
  //     .appendLine(';');

  //   if (this.hasEndpointParams(ctx, endpoint)) {
  //     builder.append('if (params) ').appendCodeBlock((builder) =>
  //       builder
  //         .forEach(
  //           endpoint.parameters.filter((x) => x.target === 'path' || x.target === 'query' || x.target === 'header'),
  //           (builder, parameter) =>
  //             builder
  //               .append('rb.', parameter.target)
  //               .appendParameters(
  //                 this.toStringLiteral(ctx, parameter.name),
  //                 `params.${toCasing(parameter.name, 'camel')}`,
  //                 (builder) =>
  //                   builder.appendObjectLiteral(
  //                     parameter.style !== undefined
  //                       ? `style: ${this.toStringLiteral(ctx, parameter.style)}`
  //                       : undefined,
  //                     parameter.explode !== undefined ? `explode: ${parameter.explode ? 'true' : 'false'}` : undefined,
  //                   ),
  //               )
  //               .appendLine(';'),
  //         )
  //         .if(endpoint.requestBody !== undefined, (builder) =>
  //           builder
  //             .append('rb.body')
  //             .appendParameters(
  //               'params.body',
  //               this.toStringLiteral(ctx, endpoint.requestBody?.content[0]?.type ?? 'application/json'),
  //             )
  //             .appendLine(';'),
  //         ),
  //     );
  //   }

  //   const response = this.getEndpointSuccessResponse(ctx, endpoint);
  //   const accept = response?.contentOptions[0]?.type ?? '*/*';
  //   const responseType = accept.includes('json') ? 'json' : 'text';
  //   builder
  //     .ensurePreviousLineEmpty()
  //     .append('this.http.request')
  //     .appendParameters((builder) =>
  //       builder
  //         .append('rb.build')
  //         .appendParameters((builder) =>
  //           builder.appendObjectLiteral(
  //             `responseType: ${this.toStringLiteral(ctx, responseType)}`,
  //             `accept: ${this.toStringLiteral(ctx, accept)}`,
  //             'context: context',
  //           ),
  //         ),
  //     )
  //     .append('.pipe')
  //     .appendParameters(
  //       (builder) =>
  //         builder.appendExternalTypeUsage(this.rxjsFilterType).appendParameters((builder) =>
  //           builder.appendFunction({
  //             parameters: ['r: any'],
  //             body: (builder) => builder.append('r instanceof ').appendExternalTypeUsage(this.httpResponseType),
  //             singleLine: true,
  //           }),
  //         ),
  //       (builder) =>
  //         builder.appendExternalTypeUsage(this.rxjsMapType).appendParameters((builder) =>
  //           builder.appendFunction({
  //             parameters: [{ name: 'r', type: this.httpResponseType, genericArguments: ['any'] }],
  //             body: response?.contentOptions?.[0]
  //               ? (builder) =>
  //                   builder
  //                     .append('r as ')
  //                     .appendExternalTypeUsage(this.getStrictHttpResponseRef(ctx))
  //                     .appendGenericArguments((builder) =>
  //                       this.generateEndpointSuccessResponseSchema(ctx, builder, endpoint),
  //                     )
  //               : (builder) =>
  //                   builder
  //                     .parenthesize('()', (builder) =>
  //                       builder
  //                         .append('r as ')
  //                         .appendExternalTypeUsage(this.httpResponseType)
  //                         .appendGenericArguments('any'),
  //                     )
  //                     .append('.clone')
  //                     .appendParameters((builder) => builder.appendObjectLiteral('body: undefined'))
  //                     .append(' as ')
  //                     .appendExternalTypeUsage(this.getStrictHttpResponseRef(ctx))
  //                     .appendGenericArguments('void'),
  //             singleLine: true,
  //           }),
  //         ),
  //     )
  //     .appendLine(';');
  // }

  // protected generateEndpointMethod(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
  //   builder.appendMethod(this.getEndpointMethodOptions(ctx, endpoint));
  // }

  // protected generateEndpointMethodContent(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
  //   builder
  //     .append('return this.', this.getEndpointResponseMethodName(ctx, endpoint))
  //     .appendParameters(this.hasEndpointParams(ctx, endpoint) ? 'params' : undefined, 'context')
  //     .append('.pipe')
  //     .appendParameters((builder) =>
  //       builder
  //         .appendExternalTypeUsage(this.rxjsMapType)
  //         .append('((r: ')
  //         .appendExternalTypeUsage(this.getStrictHttpResponseRef(ctx))
  //         .appendGenericArguments((builder) => this.generateEndpointSuccessResponseSchema(ctx, builder, endpoint))
  //         .append(') => r.body as ')
  //         .append((builder) => this.generateEndpointSuccessResponseSchema(ctx, builder, endpoint))
  //         .append(')'),
  //     )
  //     .appendLine(';');
  // }

  // protected getClassOptions(ctx: Context): TypeScriptClassOptions {
  //   return {
  //     name: this.getServiceClassName(ctx),
  //     documentation: ctx.service.description,
  //     annotations: [
  //       {
  //         name: 'Injectable',
  //         module: '@angular/core',
  //         args: [(builder) => builder.appendObjectLiteral(`providedIn: ${this.toStringLiteral(ctx, 'root')}`)],
  //       },
  //     ],
  //     extends: (builder) => builder.appendExternalTypeUsage(this.getBaseServiceRef(ctx)),
  //     body: (builder) => this.generateClassContent(ctx, builder),
  //   };
  // }

  // protected getConstructorOptions(ctx: Context): TypeScriptConstructorOptions {
  //   return {
  //     parameters: [
  //       { name: 'config', type: (builder) => builder.appendExternalTypeUsage(this.getApiConfigurationType(ctx)) },
  //       { name: 'http', type: (builder) => builder.appendExternalTypeUsage(this.httpClientType) },
  //     ],
  //     body: (builder) => this.generateConstructorContent(ctx, builder),
  //   };
  // }

  // protected getEndpointPathPropertyOptions(ctx: Context, endpoint: ApiEndpoint): TypeScriptPropertyOptions {
  //   return {
  //     name: this.getEndpointPathPropertyName(ctx, endpoint),
  //     documentation: ctx.config.exposePathProperties
  //       ? `Path part for operation ${this.getEndpointMethodName(ctx, endpoint)}`
  //       : undefined,
  //     isStatic: true,
  //     accessibility: ctx.config.exposePathProperties ? 'public' : 'protected',
  //     isReadonly: true,
  //     initializer: this.toStringLiteral(ctx, endpoint.path),
  //   };
  // }

  // protected getEndpointMethodParams(
  //   ctx: Context,
  //   endpoint: ApiEndpoint,
  // ): (TextOrBuilderFn<Builder> | TypeScriptParameterOptions)[] {
  //   const params: (TextOrBuilderFn<Builder> | TypeScriptParameterOptions)[] = [];
  //   if (this.hasEndpointParams(ctx, endpoint)) {
  //     params.push({
  //       name: 'params',
  //       type: this.getEndpointParamsTypeName(ctx, endpoint),
  //     });
  //   }

  //   params.push({
  //     name: 'context',
  //     isOptional: true,
  //     type: (builder) => builder.appendExternalTypeUsage(this.httpContextType),
  //   });

  //   return params;
  // }

  // protected generateEndpointSuccessResponseSchema(ctx: Context, builder: Builder, endpoint: ApiEndpoint) {
  //   const successResponse = this.getEndpointSuccessResponse(ctx, endpoint);
  //   const schema = successResponse?.contentOptions[0]?.schema;
  //   if (schema) {
  //     const model = ctx.input.models[schema.id];
  //     if (model) {
  //       builder.appendModelUsage(model);
  //     } else {
  //       builder.append(this.getAnyType(ctx));
  //     }
  //   } else {
  //     builder.append('void');
  //   }
  // }

  // protected getEndpointResponseMethodOptions(ctx: Context, endpoint: ApiEndpoint): TypeScriptMethodOptions {
  //   return {
  //     name: this.getEndpointResponseMethodName(ctx, endpoint),
  //     accessibility: ctx.config.exposeResponseMethods ? 'public' : 'protected',
  //     documentation: ctx.config.exposeResponseMethods
  //       ? [
  //           endpoint.summary,
  //           endpoint.description,
  //           'This method provides access to the full `HttpResponse`, allowing access to response headers.\n' +
  //             `To access only the response body, use \`${this.getEndpointMethodName(ctx, endpoint)}()\` instead.`,
  //         ]
  //           .filter((x) => x)
  //           .join('\n\n')
  //       : undefined,
  //     parameters: this.getEndpointMethodParams(ctx, endpoint),
  //     returnType: (builder) =>
  //       builder
  //         .appendExternalTypeUsage(this.observableType)
  //         .appendGenericArguments((builder) =>
  //           builder
  //             .appendExternalTypeUsage(this.getStrictHttpResponseRef(ctx))
  //             .appendGenericArguments((builder) => this.generateEndpointSuccessResponseSchema(ctx, builder, endpoint)),
  //         ),
  //     body: (builder) => this.generateEndpointResponseMethodContent(ctx, builder, endpoint),
  //   };
  // }

  // protected getEndpointMethodOptions(ctx: Context, endpoint: ApiEndpoint): TypeScriptMethodOptions {
  //   return {
  //     name: this.getEndpointMethodName(ctx, endpoint),
  //     accessibility: 'public',
  //     documentation: [
  //       endpoint.summary,
  //       endpoint.description,
  //       ctx.config.exposeResponseMethods
  //         ? 'This method provides access only to the response body.\n' +
  //           `To access the full response (for headers, for example), \`${this.getEndpointResponseMethodName(
  //             ctx,
  //             endpoint,
  //           )}()\` instead.`
  //         : undefined,
  //     ]
  //       .filter((x) => x)
  //       .join('\n\n'),
  //     parameters: this.getEndpointMethodParams(ctx, endpoint),
  //     returnType:
  //       ctx.config.clientMethodFlavor === 'response-handler'
  //         ? 'void'
  //         : (builder) =>
  //             builder
  //               .appendExternalTypeUsage(this.observableType)
  //               .appendGenericArguments((builder) =>
  //                 this.generateEndpointSuccessResponseSchema(ctx, builder, endpoint),
  //               ),
  //     body: (builder) => this.generateEndpointMethodContent(ctx, builder, endpoint),
  //   };
  // }

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
    return toCasing(`${this.getEndpointMethodName(ctx, endpoint)}Response`, ctx.config.typeNameCasing);
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
