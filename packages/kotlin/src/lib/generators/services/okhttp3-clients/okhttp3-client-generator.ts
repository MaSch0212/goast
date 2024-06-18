/* eslint-disable unused-imports/no-unused-vars */
import { writeFileSync } from 'fs';
import { dirname } from 'path';

import { ensureDirSync } from 'fs-extra';

import {
  ApiParameter,
  ApiSchema,
  AppendValueGroup,
  SourceBuilder,
  appendValueGroup,
  builderTemplate as s,
  createOverwriteProxy,
  toCasing,
} from '@goast/core';

import { DefaultKotlinOkHttp3GeneratorArgs as Args } from '.';
import { KotlinOkHttp3ClientGeneratorContext, KotlinOkHttp3ClientGeneratorOutput } from './models';
import { kt } from '../../../ast';
import { KotlinImport } from '../../../common-results';
import { KotlinFileBuilder } from '../../../file-builder';
import { modifyString } from '../../../utils';
import { KotlinFileGenerator } from '../../file-generator';

type Context = KotlinOkHttp3ClientGeneratorContext;
type Output = KotlinOkHttp3ClientGeneratorOutput;
type Builder = KotlinFileBuilder;

export interface KotlinOkHttp3Generator<TOutput extends Output = Output> {
  generate(ctx: Context): TOutput;
}

export class DefaultKotlinOkHttp3Generator
  extends KotlinFileGenerator<Context, Output>
  implements KotlinOkHttp3Generator
{
  public generate(ctx: KotlinOkHttp3ClientGeneratorContext): KotlinImport {
    const typeName = this.getApiClientName(ctx, {});
    const packageName = this.getPackageName(ctx, {});
    const filePath = this.getFilePath(ctx, { packageName });
    ensureDirSync(dirname(filePath));

    console.log(`Generating client for service ${ctx.service.name} to ${filePath}...`);

    const builder = new KotlinFileBuilder(packageName, ctx.config);
    builder.append(this.getClientFileContent(ctx, {}));

    writeFileSync(filePath, builder.toString());

    return { typeName, packageName };
  }

  protected getClientFileContent(ctx: Context, args: Args.GetClientFileContent): AppendValueGroup<Builder> {
    return appendValueGroup([this.getClientClass(ctx, {})]);
  }

  protected getClientClass(ctx: Context, args: Args.GetClientClass): kt.Class<Builder> {
    return kt.class(this.getApiClientName(ctx, {}), {
      extends: ctx.refs.apiClient(),
      primaryConstructor: kt.constructor(
        [
          kt.parameter('basePath', kt.refs.string(), { default: 'defaultBasePath' }),
          kt.parameter('client', kt.refs.okhttp3.okHttpClient(), { default: kt.call(['ApiClient', 'defaultClient']) }),
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
          this.getEndpointClientMembers(ctx, { endpoint, parameters: this.getAllParameters(ctx, { endpoint }) }),
        ),
        ...this.getAdditionalClientMembers(ctx, {}),
      ],
    });
  }

  protected getClientCompanionObject(ctx: Context, args: Args.GetClientCompanionObject): kt.Object<Builder> {
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
      ],
      parameters: parameters.map((p) =>
        kt.parameter(
          toCasing(p.name, ctx.config.parameterNameCasing),
          this.getTypeUsage(ctx, { schema: p.schema, nullable: !p.required }),
          {
            description: p.description,
            default: !p.required ? kt.toNode(p.schema?.default) : null,
          },
        ),
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
        s`val localVarResponse = ${kt.call(
          [toCasing(endpoint.name + '_WithHttpInfo', ctx.config.functionNameCasing)],
          parameters.map((x) => x.name),
        )}`,
        '',
        s`return when (localVarResponse.responseType) {${s.indent`
            ${ctx.refs.responseType()}.Success -> ${
              responseSchema === undefined
                ? kt.refs.unit()
                : s`(localVarResponse as ${ctx.refs.success(['*'])}).data as ${this.getTypeUsage(ctx, {
                    schema: responseSchema,
                  })}`
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
      ],
      parameters: parameters.map((p) =>
        kt.parameter(
          toCasing(p.name, ctx.config.parameterNameCasing),
          this.getTypeUsage(ctx, { schema: p.schema, nullable: !p.required }),
          {
            description: p.description,
            default: !p.required ? kt.toNode(p.schema?.default) : null,
          },
        ),
      ),
      returnType: ctx.refs.apiResponse([
        this.getTypeUsage(ctx, { schema: responseSchema, fallback: kt.refs.unit(), nullable: true }),
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
        s`val localVariableConfig = ${kt.call(
          [toCasing(endpoint.name, 'camel') + 'RequestConfig'],
          parameters.map((x) => x.name),
        )}`,
        s`return ${kt.call(
          [
            kt.reference('request', null, {
              generics: [
                this.getTypeUsage(ctx, { schema: endpoint.requestBody?.content[0].schema, fallback: kt.refs.unit() }),
                this.getTypeUsage(ctx, { schema: responseSchema, fallback: kt.refs.unit() }),
              ],
            }),
          ],
          ['localVariableConfig'],
        )}`,
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
    const requestSchema = endpoint.requestBody?.content[0].schema;

    return kt.function(toCasing(args.endpoint.name, ctx.config.functionNameCasing) + 'RequestConfig', {
      accessModifier: 'private',
      doc: kt.doc(`To obtain the request config of the operation ${operationName}`),
      parameters: parameters.map((p) =>
        kt.parameter(
          toCasing(p.name, ctx.config.parameterNameCasing),
          this.getTypeUsage(ctx, { schema: p.schema, nullable: !p.required }),
          {
            description: p.description,
            default: !p.required ? kt.toNode(p.schema?.default) : null,
          },
        ),
      ),
      returnType: ctx.refs.requestConfig([this.getTypeUsage(ctx, { schema: requestSchema, fallback: kt.refs.unit() })]),
      body: this.getEndpointClientRequestConfigMethodBody(ctx, { endpoint }),
    });
  }

  protected getEndpointClientRequestConfigMethodBody(
    ctx: Context,
    args: Args.GetEndpointClientRequestConfigMethodBody,
  ): AppendValueGroup<Builder> {
    const { endpoint } = args;
    const queryParameters = endpoint.parameters.filter((x) => x.target === 'query');
    const result = appendValueGroup<Builder>([], '\n');

    if (endpoint.requestBody) {
      const bodyParamName = toCasing(this.getRequestBodyParamName(ctx, { endpoint }), ctx.config.parameterNameCasing);
      result.values.push(`val localVariableBody = ${bodyParamName}`);
    }

    result.values.push(
      s`val localVariableQuery: ${ctx.refs.multiValueMap()} = ${kt.call(
        [kt.refs.mutableMapOf([kt.refs.string(), kt.refs.list([kt.refs.string()])])],
        [],
      )}${
        queryParameters.length === 0
          ? ''
          : s.indent`
            .apply {${s.indent`
              ${appendValueGroup(
                queryParameters.map((param) => {
                  const paramName = toCasing(param.name, ctx.config.parameterNameCasing);
                  const toString = param.schema?.kind === 'array' ? '.joinToString()' : '.toString()';
                  const put = s<Builder>`put(${kt.string(paramName)}, listOf(${paramName}${toString}))`;
                  return param.required
                    ? put
                    : s<Builder>`if (${paramName} != null) {${s.indent`
                        ${put}`}
                      }`;
                }),
                '\n',
              )}`}
            }`
      }`,
    );

    result.values.push('val localVariableHeaders: MutableMap<String, String> = mutableMapOf()');
    if (endpoint.requestBody?.content[0] !== undefined) {
      result.values.push(`localVariableHeaders["Content-Type"] = "${endpoint.requestBody?.content[0].type}"`);
    }

    result.values.push(
      s`return ${kt.call(
        [ctx.refs.requestConfig.infer()],
        [
          kt.argument.named('method', kt.call([ctx.refs.requestMethod(), endpoint.method.toUpperCase()])),
          kt.argument.named('path', kt.string(this.getPathWithInterpolation(ctx, { endpoint }), { template: true })),
          kt.argument.named('query', 'localVariableQuery'),
          kt.argument.named('headers', 'localVariableHeaders'),
          kt.argument.named('requiresAuthentication', 'false'),
          endpoint.requestBody ? kt.argument.named('body', 'localVariableBody') : null,
        ],
      )}`,
    );

    return result;
  }

  protected getAdditionalClientMembers(ctx: Context, args: Args.GetAdditionalClientMembers): kt.ClassMember<Builder>[] {
    return [
      kt.function('encodeURIComponent', {
        accessModifier: 'private',
        parameters: [kt.parameter('uriComponent', kt.refs.string())],
        returnType: kt.refs.string(),
        singleExpression: true,
        body: s`${kt.refs.okhttp3.httpUrl()}.Builder().scheme("http").host("localhost").addPathSegment(uriComponent).build().encodedPathSegments[0]`,
      }),
    ];
  }

  protected getTypeUsage(ctx: Context, args: Args.GetTypeUsage<Builder>): kt.Type<Builder> {
    const { schema, nullable, fallback } = args;
    const type = this.getSchemaType(ctx, { schema });
    return type
      ? createOverwriteProxy(type, { nullable: nullable ?? type.nullable })
      : fallback ?? kt.refs.any({ nullable });
  }

  protected getPackageName(ctx: Context, args: Args.GetPackageName): string {
    const packageSuffix =
      typeof ctx.config.packageSuffix === 'string' ? ctx.config.packageSuffix : ctx.config.packageSuffix(ctx.service);
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
          `\${encodeURIComponent(${toCasing(parameter.name, 'camel')}.toString())}`,
        );
      });
    return path;
  }

  protected getResponseSchema(ctx: Context, args: Args.GetResponseSchema): ApiSchema | undefined {
    const { endpoint } = args;
    return endpoint.responses.find((x) => !x.statusCode || (x.statusCode >= 200 && x.statusCode < 300))
      ?.contentOptions[0]?.schema;
  }

  protected getSchemaType(ctx: Context, args: Args.GetSchemaType) {
    const { schema } = args;
    return schema && ctx.input.models[schema.id].type;
  }

  protected getAllParameters(ctx: Context, args: Args.GetAllParameters): ApiParameter[] {
    const { endpoint } = args;
    const parameters = endpoint.parameters.filter(
      (parameter) => parameter.target === 'query' || parameter.target === 'path',
    );
    if (endpoint.requestBody) {
      const schema = endpoint.requestBody.content[0].schema;
      parameters.push({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        $src: undefined!,
        $ref: undefined,
        id: 'body',
        name: this.getRequestBodyParamName(ctx, { endpoint }),
        target: 'body',
        schema,
        required: endpoint.requestBody.required,
        description: endpoint.requestBody.description,
        allowEmptyValue: undefined,
        allowReserved: undefined,
        deprecated: false,
        explode: undefined,
        style: undefined,
      });
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

  protected getBasePath(ctx: Context, args: Args.GetBasePath): string {
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

  protected getApiClientName(ctx: Context, args: Args.GetApiClientName): string {
    return toCasing(ctx.service.name, ctx.config.typeNameCasing) + 'ApiClient';
  }
}
