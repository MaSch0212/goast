import { dirname } from 'node:path';

// @deno-types="npm:@types/fs-extra@11"
import fs from 'fs-extra';

import {
  type ApiParameter,
  type ApiSchema,
  type AppendValueGroup,
  appendValueGroup,
  builderTemplate as s,
  createOverwriteProxy,
  type MaybePromise,
  resolveAnyOfAndAllOf,
  SourceBuilder,
  toCasing,
} from '@goast/core';

import { kt } from '../../../ast/index.ts';
import type { KtValue } from '../../../ast/nodes/types.ts';
import type { KotlinImport } from '../../../common-results.ts';
import { KotlinFileBuilder } from '../../../file-builder.ts';
import type { ApiParameterWithMultipartInfo } from '../../../types.ts';
import { modifyString } from '../../../utils.ts';
import { KotlinFileGenerator } from '../../file-generator.ts';
import type { DefaultKotlinOkHttp3GeneratorArgs as Args } from './index.ts';
import type { KotlinOkHttp3ClientGeneratorContext, KotlinOkHttp3ClientGeneratorOutput } from './models.ts';

type Context = KotlinOkHttp3ClientGeneratorContext;
type Output = KotlinOkHttp3ClientGeneratorOutput;
type Builder = KotlinFileBuilder;

export interface KotlinOkHttp3Generator<TOutput extends Output = Output> {
  generate(ctx: Context): MaybePromise<TOutput>;
}

export class DefaultKotlinOkHttp3Generator extends KotlinFileGenerator<Context, Output>
  implements KotlinOkHttp3Generator {
  public generate(ctx: KotlinOkHttp3ClientGeneratorContext): MaybePromise<KotlinImport> {
    const typeName = this.getApiClientName(ctx, {});
    const packageName = this.getPackageName(ctx, {});
    const filePath = this.getFilePath(ctx, { packageName });
    fs.ensureDirSync(dirname(filePath));

    console.log(`Generating client for service ${ctx.service.name} to ${filePath}...`);

    const builder = new KotlinFileBuilder(packageName, ctx.config);
    builder.append(this.getClientFileContent(ctx, {}));

    fs.writeFileSync(filePath, builder.toString());

    return { typeName, packageName };
  }

  protected getClientFileContent(ctx: Context, _args: Args.GetClientFileContent): AppendValueGroup<Builder> {
    return appendValueGroup([this.getClientClass(ctx, {})]);
  }

  protected getClientClass(ctx: Context, _args: Args.GetClientClass): kt.Class<Builder> {
    return kt.class(this.getApiClientName(ctx, {}), {
      annotations: [
        ctx.service.endpoints.length === 0 || ctx.service.endpoints.some((x) => !x.deprecated)
          ? null
          : kt.annotation(kt.refs.deprecated(), [kt.argument(kt.string(''))]),
      ],
      extends: ctx.refs.apiClient(),
      primaryConstructor: kt.constructor(
        [
          kt.parameter('basePath', kt.refs.string(), { default: 'defaultBasePath' }),
          kt.parameter('client', kt.refs.okhttp3.okHttpClient(), {
            default: 'defaultClient',
          }),
        ],
        null,
        {
          delegateTarget: 'super',
          delegateArguments: ['basePath', 'client'],
        },
      ),
      companionObject: this.getClientCompanionObject(ctx, {}),
      members: [
        ...ctx.service.endpoints.flatMap((endpoint) =>
          this.getEndpointClientMembers(ctx, { endpoint, parameters: this.getAllParameters(ctx, { endpoint }) })
        ),
        ...this.getAdditionalClientMembers(ctx, {}),
      ],
    });
  }

  protected getClientCompanionObject(ctx: Context, _args: Args.GetClientCompanionObject): kt.Object<Builder> {
    const result = kt.object<Builder>();

    result.members.push(
      kt.property('defaultBasePath', {
        annotations: [kt.annotation(kt.refs.jvmStatic())],
        type: kt.refs.string(),
        delegate: kt.refs.lazyFun.infer(),
        delegateArguments: [
          kt.lambda(
            [],
            kt.call(
              [kt.call([kt.refs.java.system(), 'getProperties'], []), 'getProperty'],
              [kt.call([ctx.refs.apiClient(), 'baseUrlKey']), kt.string(this.getBasePath(ctx, {}))],
            ),
          ),
        ],
      }),
    );

    return result;
  }

  protected getEndpointClientMembers(ctx: Context, args: Args.GetEndpointClientMembers): kt.ClassMember<Builder>[] {
    const { endpoint, parameters } = args;
    const responseSchema = this.getResponseSchema(ctx, { endpoint });
    return [
      this.getEndpointClientMethod(ctx, { endpoint, parameters, responseSchema }),
      this.getEndpointClientHttpInfoMethod(ctx, { endpoint, parameters, responseSchema }),
      this.getEndpointClientRequestConfigMethod(ctx, { endpoint, parameters }),
    ];
  }

  protected getEndpointClientMethod(ctx: Context, args: Args.GetEndpointClientMethod): kt.Function<Builder> {
    const { endpoint, parameters, responseSchema } = args;

    return kt.function(toCasing(endpoint.name, ctx.config.functionNameCasing), {
      doc: kt.doc(endpoint.summary, [
        kt.docTag('throws', 'IllegalStateException', 'If the request is not correctly configured'),
        kt.docTag('throws', 'IOException', 'Rethrows the OkHttp execute method exception'),
        kt.docTag(
          'throws',
          'UnsupportedOperationException',
          'If the API returns an informational or redirection response',
        ),
        kt.docTag('throws', 'ClientException', 'If the API returns a client error response'),
        kt.docTag('throws', 'ServerException', 'If the API returns a server error response'),
      ]),
      annotations: [
        kt.annotation(kt.refs.throws(), [
          kt.refs.java.illegalStateException({ classReference: true }),
          kt.refs.java.ioException({ classReference: true }),
          kt.refs.java.unsupportedOperationException({ classReference: true }),
          ctx.refs.clientException({ classReference: true }),
          ctx.refs.serverException({ classReference: true }),
        ]),
        endpoint.deprecated ? kt.annotation(kt.refs.deprecated(), [kt.argument(kt.string(''))]) : null,
      ],
      parameters: parameters.map((p) =>
        kt.parameter(
          toCasing(p.name, ctx.config.parameterNameCasing),
          this.getParameterType(ctx, { endpoint, parameter: p }),
          {
            description: p.description,
            default: !p.required ? kt.toNode(p.schema?.default) : null,
          },
        )
      ),
      returnType: this.getTypeUsage(ctx, { schema: responseSchema, fallback: kt.refs.unit() }),
      body: this.getEndpointClientMethodBody(ctx, { endpoint, parameters, responseSchema }),
    });
  }

  protected getEndpointClientMethodBody(
    ctx: Context,
    args: Args.GetEndpointClientMethodBody,
  ): AppendValueGroup<Builder> {
    const { endpoint, parameters, responseSchema } = args;

    return appendValueGroup(
      [
        s`val localVarResponse = ${
          kt.call(
            [toCasing(endpoint.name + '_WithHttpInfo', ctx.config.functionNameCasing)],
            parameters.map((x) => toCasing(x.name, ctx.config.parameterNameCasing)),
          )
        }`,
        '',
        s`return when (localVarResponse.responseType) {${s.indent`
            ${ctx.refs.responseType()}.Success -> ${
          responseSchema === undefined
            ? kt.refs.unit()
            : s`(localVarResponse as ${ctx.refs.success(['*'])}).data as ${
              this.getTypeUsage(ctx, {
                schema: responseSchema,
              })
            }`
        }
            ${ctx.refs.responseType()}.Informational -> throw ${kt.refs.java.unsupportedOperationException()}("Client does not support Informational responses.")
            ${ctx.refs.responseType()}.Redirection -> throw ${kt.refs.java.unsupportedOperationException()}("Client does not support Redirection responses.")
            ${ctx.refs.responseType()}.ClientError -> {${s.indent`
              val localVarError = localVarResponse as ${ctx.refs.clientError(['*'])}
              throw ${ctx.refs.clientException()}(${s.indent`
                "Client error : \${localVarError.statusCode} \${localVarError.message.orEmpty()}",
                localVarError.statusCode,
                localVarResponse`}
              )`}
            }

            ${ctx.refs.responseType()}.ServerError -> {${s.indent`
              val localVarError = localVarResponse as ${ctx.refs.serverError(['*'])}
              throw ${ctx.refs.serverException()}(${s.indent`
                "Server error : \${localVarError.statusCode} \${localVarError.message.orEmpty()}",
                localVarError.statusCode,
                localVarResponse`}
              )`}
            }`}
          }`,
      ],
      '\n',
    );
  }

  protected getEndpointClientHttpInfoMethod(
    ctx: Context,
    args: Args.GetEndpointClientHttpInfoMethod,
  ): kt.Function<Builder> {
    const { endpoint, parameters, responseSchema } = args;

    return kt.function(toCasing(args.endpoint.name, ctx.config.functionNameCasing) + 'WithHttpInfo', {
      doc: kt.doc(endpoint.summary, [
        kt.docTag('throws', 'IllegalStateException', 'If the request is not correctly configured'),
        kt.docTag('throws', 'IOException', 'Rethrows the OkHttp execute method exception'),
      ]),
      annotations: [
        kt.annotation(kt.refs.throws(), [
          kt.refs.java.illegalStateException({ classReference: true }),
          kt.refs.java.ioException({ classReference: true }),
        ]),
        endpoint.deprecated ? kt.annotation(kt.refs.deprecated(), [kt.argument(kt.string(''))]) : null,
      ],
      parameters: parameters.map((p) =>
        kt.parameter(
          toCasing(p.name, ctx.config.parameterNameCasing),
          this.getParameterType(ctx, { endpoint, parameter: p }),
          {
            description: p.description,
            default: !p.required ? kt.toNode(p.schema?.default) : null,
          },
        )
      ),
      returnType: ctx.refs.apiResponse([
        this.getTypeUsage(ctx, { schema: responseSchema, fallback: kt.refs.unit({ nullable: true }), nullable: true }),
      ]),
      body: this.getEndpointClientHttpInfoMethodBody(ctx, { endpoint, parameters, responseSchema }),
    });
  }

  protected getEndpointClientHttpInfoMethodBody(
    ctx: Context,
    args: Args.GetEndpointClientHttpInfoMethodBody,
  ): AppendValueGroup<Builder> {
    const { endpoint, parameters, responseSchema } = args;

    return appendValueGroup(
      [
        s`val localVariableConfig = ${
          kt.call(
            [toCasing(endpoint.name, 'camel') + 'RequestConfig'],
            parameters.map((x) => toCasing(x.name, ctx.config.parameterNameCasing)),
          )
        }`,
        s`return ${
          kt.call(
            [
              kt.reference('request', null, {
                generics: [
                  this.getRequestBodyType(ctx, { endpoint }),
                  this.getTypeUsage(ctx, { schema: responseSchema, fallback: kt.refs.unit() }),
                ],
              }),
            ],
            ['localVariableConfig'],
          )
        }`,
      ],
      '\n',
    );
  }

  protected getEndpointClientRequestConfigMethod(
    ctx: Context,
    args: Args.GetEndpointClientRequestConfigMethod,
  ): kt.Function<Builder> {
    const { endpoint, parameters } = args;
    const operationName = toCasing(endpoint.name, ctx.config.functionNameCasing);

    return kt.function(toCasing(args.endpoint.name, ctx.config.functionNameCasing) + 'RequestConfig', {
      accessModifier: 'private',
      doc: kt.doc(`To obtain the request config of the operation ${operationName}`),
      annotations: [endpoint.deprecated ? kt.annotation(kt.refs.deprecated(), [kt.argument(kt.string(''))]) : null],
      parameters: parameters.map((p) =>
        kt.parameter(
          toCasing(p.name, ctx.config.parameterNameCasing),
          this.getParameterType(ctx, { endpoint, parameter: p }),
          {
            description: p.description,
            default: !p.required ? kt.toNode(p.schema?.default) : null,
          },
        )
      ),
      returnType: ctx.refs.requestConfig([this.getRequestBodyType(ctx, { endpoint })]),
      body: this.getEndpointClientRequestConfigMethodBody(ctx, { endpoint, parameters }),
    });
  }

  protected getEndpointClientRequestConfigMethodBody(
    ctx: Context,
    args: Args.GetEndpointClientRequestConfigMethodBody,
  ): AppendValueGroup<Builder> {
    const { endpoint, parameters } = args;
    const queryParameters = parameters.filter((x) => x.target === 'query');
    const headerParameters = parameters.filter((x) => x.target === 'header');
    const result = appendValueGroup<Builder>([], '\n');

    if (endpoint.requestBody) {
      if (endpoint.requestBody.content[0]?.type === 'multipart/form-data') {
        const partConfigs = parameters
          .filter((x) => x.multipart)
          .map<KtValue<Builder>>((param) => {
            const paramName = toCasing(param.name, ctx.config.parameterNameCasing);
            return s`"${param.multipart?.name ?? ''}" to ${ctx.refs.partConfig.infer()}(body = ${paramName})`;
          });
        result.values.push(
          s`val localVariableBody = ${
            kt.call(kt.refs.mapOf([kt.refs.string(), ctx.refs.partConfig(['*'])]), partConfigs)
          }`,
        );
      } else {
        const bodyParamName = toCasing(this.getRequestBodyParamName(ctx, { endpoint }), ctx.config.parameterNameCasing);
        result.values.push(`val localVariableBody = ${bodyParamName}`);
      }
    }

    result.values.push(
      s`val localVariableQuery: ${ctx.refs.multiValueMap()} = ${
        kt.call(
          [kt.refs.mutableMapOf([kt.refs.string(), kt.refs.list([kt.refs.string()])])],
          [],
        )
      }${
        queryParameters.length === 0 ? '' : s.indent`
            .apply {${s.indent`
              ${
          appendValueGroup(
            queryParameters.map((param) => {
              const paramName = toCasing(param.name, ctx.config.parameterNameCasing);
              const toString = this.getParameterToString(ctx, { endpoint, parameter: param });
              const put = s<Builder>`put(${kt.string(paramName)}, listOf(${paramName}${toString}))`;
              return param.required ? put : s<Builder>`if (${paramName} != null) {${s.indent`
                        ${put}`}
                      }`;
            }),
            '\n',
          )
        }`}
            }`
      }`,
    );

    result.values.push('val localVariableHeaders: MutableMap<String, String> = mutableMapOf()');
    if (endpoint.requestBody?.content[0] !== undefined) {
      result.values.push(`localVariableHeaders["Content-Type"] = "${endpoint.requestBody?.content[0].type}"`);
    }
    for (const header of headerParameters) {
      const paramName = toCasing(header.name, ctx.config.parameterNameCasing);
      const toString = this.getParameterToString(ctx, { endpoint, parameter: header });
      result.values.push(
        s`if (${paramName} != null) {${s.indent`
          localVariableHeaders["${header.name}"] = ${paramName}${toString}`}
        }`,
      );
    }

    result.values.push(
      s`return ${
        kt.call(
          [ctx.refs.requestConfig.infer()],
          [
            kt.argument.named('method', kt.call([ctx.refs.requestMethod(), endpoint.method.toUpperCase()])),
            kt.argument.named('path', kt.string(this.getPathWithInterpolation(ctx, { endpoint }), { template: true })),
            kt.argument.named('query', 'localVariableQuery'),
            kt.argument.named('headers', 'localVariableHeaders'),
            kt.argument.named('requiresAuthentication', 'false'),
            endpoint.requestBody ? kt.argument.named('body', 'localVariableBody') : null,
          ],
        )
      }`,
    );

    return result;
  }

  protected getParameterToString(ctx: Context, args: Args.GetParameterToString): kt.Value<Builder> {
    const { parameter } = args;
    if (parameter.schema?.kind === 'array') {
      return '.joinToString()';
    } else if (
      parameter.schema?.kind === 'string' && parameter.schema.enum?.length &&
      this.getSchemaType(ctx, { schema: parameter.schema })
    ) {
      return '.value';
    } else {
      return '.toString()';
    }
  }

  protected getAdditionalClientMembers(
    _ctx: Context,
    _args: Args.GetAdditionalClientMembers,
  ): kt.ClassMember<Builder>[] {
    return [
      kt.function('encodeURIComponent', {
        accessModifier: 'private',
        parameters: [kt.parameter('uriComponent', kt.refs.string())],
        returnType: kt.refs.string(),
        singleExpression: true,
        body:
          s`${kt.refs.okhttp3.httpUrl()}.Builder().scheme("http").host("localhost").addPathSegment(uriComponent).build().encodedPathSegments[0]`,
      }),
    ];
  }

  protected getParameterType(ctx: Context, args: Args.GetParameterType): kt.Type<Builder> {
    const { parameter } = args;
    if (parameter.multipart?.isFile) {
      return kt.refs.java.file();
    }
    return this.getTypeUsage(ctx, {
      schema: parameter.schema,
      nullable: !parameter.required,
    });
  }

  protected getRequestBodyType(ctx: Context, args: Args.GetRequestBodyType): kt.Type<Builder> {
    const { endpoint } = args;
    const content = endpoint.requestBody?.content[0];
    return content?.type === 'multipart/form-data'
      ? kt.refs.map([kt.refs.string(), ctx.refs.partConfig(['*'])])
      : this.getTypeUsage(ctx, { schema: content?.schema, fallback: kt.refs.unit() });
  }

  protected getTypeUsage(ctx: Context, args: Args.GetTypeUsage<Builder>): kt.Type<Builder> {
    const { schema, nullable, fallback } = args;
    const type = this.getSchemaType(ctx, { schema });
    return type
      ? createOverwriteProxy(type, { nullable: nullable ?? type.nullable })
      : (fallback ?? kt.refs.any({ nullable }));
  }

  protected getPackageName(ctx: Context, _args: Args.GetPackageName): string {
    const packageSuffix = typeof ctx.config.packageSuffix === 'string'
      ? ctx.config.packageSuffix
      : ctx.config.packageSuffix(ctx.service);
    return ctx.config.packageName + packageSuffix;
  }

  protected getPathWithInterpolation(ctx: Context, args: Args.GetPathWithInterpolation): string {
    const { endpoint } = args;
    let path = this.getEndpointPath(ctx, { endpoint });
    endpoint.parameters
      .filter((x) => x.target === 'path')
      .forEach((parameter) => {
        path = path.replace(
          `{${parameter.name}}`,
          `\${encodeURIComponent(${toCasing(parameter.name, 'camel')}${
            this.getParameterToString(ctx, { endpoint, parameter })
          })}`,
        );
      });
    return path;
  }

  protected getResponseSchema(_ctx: Context, args: Args.GetResponseSchema): ApiSchema | undefined {
    const { endpoint } = args;
    return endpoint.responses.find((x) => !x.statusCode || (x.statusCode >= 200 && x.statusCode < 300))
      ?.contentOptions[0]?.schema;
  }

  protected getSchemaType(ctx: Context, args: Args.GetSchemaType): kt.Reference<SourceBuilder> | undefined {
    const { schema } = args;
    return schema && ctx.input.kotlin.models[schema.id].type;
  }

  protected getAllParameters(ctx: Context, args: Args.GetAllParameters): ApiParameterWithMultipartInfo[] {
    const { endpoint } = args;
    const parameters = endpoint.parameters.filter(
      (parameter) => parameter.target === 'query' || parameter.target === 'path' || parameter.target === 'header',
    );
    if (endpoint.requestBody) {
      const content = endpoint.requestBody.content[0];
      let schema = content.schema;

      if (content.type === 'multipart/form-data') {
        if (schema && schema.kind === 'object') {
          schema = resolveAnyOfAndAllOf(schema, true) ?? schema;
          const properties = schema.properties ?? {};
          for (const [name, property] of properties.entries()) {
            parameters.push(
              Object.assign(
                this.createApiParameter({
                  id: `multipart-${name}`,
                  name,
                  target: 'body',
                  schema: property.schema,
                  required: schema.required.has(name),
                  description: property.schema.description,
                }),
                {
                  multipart: {
                    name,
                    isFile: property.schema.kind === 'string' && property.schema.format === 'binary',
                  },
                },
              ),
            );
          }
        }
      } else {
        parameters.push(
          this.createApiParameter({
            id: 'body',
            name: this.getRequestBodyParamName(ctx, { endpoint }),
            target: 'body',
            schema,
            required: endpoint.requestBody.required,
            description: endpoint.requestBody.description,
          }),
        );
      }
    }

    return parameters.sort((a, b) => (a.required === b.required ? 0 : a.required ? -1 : 1));
  }

  protected getRequestBodyParamName(ctx: Context, args: Args.GetRequestBodyParamName): string {
    const { endpoint } = args;
    const schema = endpoint.requestBody?.content[0].schema;
    const schemaInfo = this.getSchemaType(ctx, { schema });
    return toCasing(
      schemaInfo && schemaInfo.name !== 'Any' ? SourceBuilder.build((b) => kt.reference.write(b, schemaInfo)) : 'body',
      ctx.config.parameterNameCasing,
    );
  }

  protected getBasePath(ctx: Context, _args: Args.GetBasePath): string {
    return modifyString(
      (ctx.service.$src ?? ctx.service.endpoints[0]?.$src)?.document.servers?.[0]?.url ?? '/',
      ctx.config.basePath,
      ctx.service,
    );
  }

  protected getEndpointPath(ctx: Context, args: Args.GetEndpointPath): string {
    const { endpoint } = args;
    return modifyString(endpoint.path, ctx.config.pathModifier, endpoint);
  }

  protected getFilePath(ctx: Context, args: Args.GetFilePath): string {
    const { packageName } = args;
    return `${ctx.config.outputDir}/${packageName.replace(/\./g, '/')}/${this.getApiClientName(ctx, {})}.kt`;
  }

  protected getApiClientName(ctx: Context, _args: Args.GetApiClientName): string {
    return toCasing(ctx.service.name, ctx.config.typeNameCasing) + 'ApiClient';
  }

  private createApiParameter(data: Partial<ApiParameter> & Pick<ApiParameter, 'id' | 'name' | 'target'>): ApiParameter {
    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      $src: undefined!,
      $ref: undefined,
      schema: undefined,
      required: false,
      description: undefined,
      allowEmptyValue: undefined,
      allowReserved: undefined,
      deprecated: false,
      explode: undefined,
      style: undefined,
      ...data,
    };
  }
}
