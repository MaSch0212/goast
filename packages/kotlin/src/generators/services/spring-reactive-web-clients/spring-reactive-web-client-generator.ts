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
import { KotlinFileBuilder } from '../../../file-builder.ts';
import type { ApiParameterWithMultipartInfo } from '../../../types.ts';
import { modifyString } from '../../../utils.ts';
import { KotlinFileGenerator } from '../../file-generator.ts';
import type { DefaultKotlinSpringReactiveWebClientGeneratorArgs as Args } from './index.ts';
import type {
  KotlinSpringReactiveWebClientGeneratorContext,
  KotlinSpringReactiveWebClientGeneratorOutput,
} from './models.ts';

type Context = KotlinSpringReactiveWebClientGeneratorContext;
type Output = KotlinSpringReactiveWebClientGeneratorOutput;
type Builder = KotlinFileBuilder;

export interface KotlinSpringReactiveWebClientGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): MaybePromise<TOutput>;
}

export class DefaultKotlinSpringReactiveWebClientGenerator extends KotlinFileGenerator<Context, Output>
  implements KotlinSpringReactiveWebClientGenerator {
  public generate(ctx: Context): MaybePromise<Output> {
    const typeName = this.getRequestsObjectName(ctx, {});
    const packageName = this.getPackageName(ctx, {});
    const filePath = this.getFilePath(ctx, { packageName });
    fs.ensureDirSync(dirname(filePath));

    console.log(`Generating client for service ${ctx.service.name} to ${filePath}...`);

    const builder = new KotlinFileBuilder(packageName, ctx.config);
    builder.append(this.getClientFileContent(ctx, {}));

    fs.writeFileSync(filePath, builder.toString());

    return { typeName, packageName };
  }

  // deno-lint-ignore no-unused-vars
  protected getClientFileContent(ctx: Context, args: Args.GetClientFileContent): AppendValueGroup<Builder> {
    return appendValueGroup([this.getRequestsObject(ctx, {})], '\n\n');
  }

  // deno-lint-ignore no-unused-vars
  protected getRequestsObject(ctx: Context, args: Args.GetRequestsObject): kt.Object<Builder> {
    return kt.object({
      name: this.getRequestsObjectName(ctx, {}),
      members: ctx.service.endpoints.flatMap((endpoint) =>
        this.getEndpointMembers(ctx, { endpoint, parameters: this.getAllParameters(ctx, { endpoint }) })
      ),
    });
  }

  protected getEndpointMembers(ctx: Context, args: Args.GetEndpointMembers): kt.ObjectMember<Builder>[] {
    const { endpoint, parameters } = args;
    const responseSchema = this.getResponseSchema(ctx, { endpoint });

    return [
      this.getEndpointFunction(ctx, { endpoint, parameters, responseSchema }),
      this.getEndpointFunctionWithHandler(ctx, { endpoint, parameters, responseSchema }),
      this.getEndpointUriFunction(ctx, { endpoint, parameters }),
      this.getEndpointRequestFunction(ctx, { endpoint, parameters, responseSchema }),
    ];
  }

  protected getEndpointFunctionName(ctx: Context, args: Args.GetEndpointFunctionName): string {
    const { endpoint } = args;
    return toCasing(endpoint.name, ctx.config.functionNameCasing);
  }

  protected getEndpointFunction(ctx: Context, args: Args.GetEndpointFunction): kt.Function<Builder> {
    const { endpoint, parameters, responseSchema } = args;
    const functionName = this.getEndpointFunctionName(ctx, { endpoint });

    return kt.function(functionName, {
      doc: kt.doc(endpoint.description),
      suspend: true,
      receiverType: kt.refs.springReactive.webClient(),
      parameters: parameters.map((parameter) =>
        kt.parameter(
          toCasing(parameter.name, ctx.config.parameterNameCasing),
          this.getParameterType(ctx, { endpoint, parameter }),
          { default: this.getParameterDefaultValue(ctx, { endpoint, parameter }) },
        )
      ),
      returnType: this.getTypeUsage(ctx, { schema: responseSchema, fallback: kt.refs.unit() }),
      body: this.getEndpointFunctionBody(ctx, { endpoint, parameters, responseSchema }),
    });
  }

  protected getEndpointFunctionBody(ctx: Context, args: Args.GetEndpointFunctionBody): AppendValueGroup<Builder> {
    const { endpoint, parameters, responseSchema } = args;
    const result = appendValueGroup<Builder>([], '\n');

    const requestFunctionName = this.getEndpointRequestFunctionName(ctx, { endpoint });
    const parameterNames = parameters.map((p) => toCasing(p.name, ctx.config.parameterNameCasing));
    const call = kt.call([
      'this',
      kt.call(requestFunctionName, parameterNames),
      kt.call('retrieve', []),
      responseSchema
        ? kt.call(
          kt.refs.springReactive.awaitBody([
            this.getTypeUsage(ctx, { schema: responseSchema, fallback: kt.refs.unit() }),
          ]),
          [],
        )
        : kt.call(kt.refs.springReactive.awaitBodilessEntity(), []),
    ]);

    if (responseSchema) {
      result.values.push(s`return ${call}`);
    } else {
      result.values.push(call);
    }

    return result;
  }

  protected getEndpointFunctionWithHandler(
    ctx: Context,
    args: Args.GetEndpointFunctionWithHandler,
  ): kt.Function<Builder> {
    const { endpoint, parameters, responseSchema } = args;
    const functionName = this.getEndpointFunctionName(ctx, { endpoint });

    return kt.function(functionName, {
      doc: kt.doc(endpoint.description),
      suspend: true,
      generics: [kt.genericParameter('T')],
      receiverType: kt.refs.springReactive.webClient(),
      parameters: [
        ...parameters.map((parameter) =>
          kt.parameter(
            toCasing(parameter.name, ctx.config.parameterNameCasing),
            this.getParameterType(ctx, { endpoint, parameter }),
            { default: this.getParameterDefaultValue(ctx, { endpoint, parameter }) },
          )
        ),
        kt.parameter(
          'responseHandler',
          kt.lambdaType([kt.refs.springReactive.clientResponse()], 'T', { suspend: true }),
        ),
      ],
      returnType: 'T',
      body: this.getEndpointFunctionWithHandlerBody(ctx, { endpoint, parameters, responseSchema }),
    });
  }

  protected getEndpointFunctionWithHandlerBody(
    ctx: Context,
    args: Args.GetEndpointFunctionWithHandlerBody,
  ): AppendValueGroup<Builder> {
    const { endpoint, parameters } = args;
    const result = appendValueGroup<Builder>([], '\n');

    const requestFunctionName = this.getEndpointRequestFunctionName(ctx, { endpoint });
    const parameterNames = parameters.map((p) => toCasing(p.name, ctx.config.parameterNameCasing));

    result.values.push(s`return ${
      kt.call([
        kt.call(['this', requestFunctionName], parameterNames),
        kt.call(['exchangeToMono'], [
          kt.lambda(
            [],
            kt.call(kt.refs.kotlinx.mono.infer(), [kt.lambda([], 'responseHandler(it)', { singleline: true })]),
            { singleline: true },
          ),
        ]),
        kt.call([kt.refs.kotlinx.awaitFirstOrNull.infer()], []),
      ])
    } as T`);

    return result;
  }

  protected getEndpointRequestFunctionName(ctx: Context, args: Args.GetEndpointRequestFunctionName): string {
    const { endpoint } = args;
    return toCasing(`${this.getEndpointFunctionName(ctx, { endpoint })}_request`, ctx.config.functionNameCasing);
  }

  protected getEndpointRequestFunction(ctx: Context, args: Args.GetEndpointRequestFunction): kt.Function<Builder> {
    const { endpoint, parameters, responseSchema } = args;
    const functionName = this.getEndpointRequestFunctionName(ctx, { endpoint });

    return kt.function(functionName, {
      doc: kt.doc(endpoint.description),
      receiverType: kt.refs.springReactive.webClient(),
      parameters: parameters.map((parameter) =>
        kt.parameter(
          toCasing(parameter.name, ctx.config.parameterNameCasing),
          this.getParameterType(ctx, { endpoint, parameter }),
          { default: this.getParameterDefaultValue(ctx, { endpoint, parameter }) },
        )
      ),
      returnType: kt.refs.springReactive.requestHeadersSpec(['*']),
      body: this.getEndpointRequestFunctionBody(ctx, { endpoint, parameters, responseSchema }),
    });
  }

  protected getEndpointRequestFunctionBody(
    ctx: Context,
    args: Args.GetEndpointRequestFunctionBody,
  ): AppendValueGroup<Builder> {
    const { endpoint, parameters, responseSchema } = args;
    const result = appendValueGroup<Builder>([], '\n');

    const callChain: KtValue<Builder>[] = [];
    callChain.push(
      s`return this.method(${kt.refs.spring.httpMethod()}.${endpoint.method.toUpperCase()})`,
      kt.call('uri', [kt.call(
        [this.getEndpointUriFunctionName(ctx, { endpoint })],
        parameters.filter((p) => p.target === 'path' || p.target === 'query').map((p) =>
          toCasing(p.name, ctx.config.parameterNameCasing)
        ),
      )]),
    );

    if (responseSchema) {
      callChain.push(s`accept(${kt.refs.spring.mediaType()}.APPLICATION_JSON)`);
    }

    if (endpoint.requestBody?.content[0] !== undefined) {
      callChain.push(
        s`contentType(${kt.refs.spring.mediaType()}.parseMediaType(${
          kt.string(endpoint.requestBody.content[0].type)
        }))`,
      );
    }

    if (endpoint.requestBody?.content[0]) {
      if (endpoint.requestBody.content[0].type === 'multipart/form-data') {
        callChain.push(
          kt.call('body', [
            kt.call([kt.refs.springReactive.bodyInserters(), 'fromMultipartData'], [
              kt.call([
                kt.call(kt.refs.spring.multipartBodyBuilder(), []),
                kt.call('apply', [
                  kt.lambda(
                    [],
                    appendValueGroup(
                      parameters.filter((x) => x.multipart).map((p) => {
                        const parameterName = toCasing(p.name, ctx.config.parameterNameCasing);
                        if (p.multipart?.isFile) {
                          return kt.call([
                            p.required && !p.schema?.nullable ? parameterName : `${parameterName}?`,
                            'addToBuilder',
                          ], ['this']);
                        } else {
                          const call = kt.call([
                            kt.call('part', [kt.string(p.multipart!.name), parameterName]),
                            kt.call('contentType', [
                              kt.call([
                                kt.refs.spring.mediaType(),
                                'APPLICATION_JSON',
                              ]),
                            ]),
                          ]);
                          return p.required && !p.schema?.nullable ? call : kt.call([`${parameterName}?`, 'also'], [
                            kt.lambda([parameterName], call, { singleline: true }),
                          ]);
                        }
                      }),
                      '\n',
                    ),
                  ),
                ]),
                'build',
              ], []),
            ]),
          ]),
        );
      } else {
        const bodySchema = endpoint.requestBody.content[0].schema;
        const parameterName = this.getRequestBodyParamName(ctx, { endpoint });
        const call = kt.call('bodyValue', [
          toCasing(parameterName, ctx.config.parameterNameCasing),
        ]);
        callChain.push(
          endpoint.requestBody.required && !bodySchema?.nullable ? call : kt.call('apply', [
            kt.lambda(
              [],
              kt.call([`${parameterName}?`, 'also'], [kt.lambda([parameterName], call, { singleline: true })]),
              { singleline: true },
            ),
          ]),
        );
      }
    }

    if (parameters.some((x) => x.target === 'header')) {
      callChain.push(
        kt.call('headers', [
          kt.lambda(
            ['headers'],
            appendValueGroup(
              parameters.filter((x) => x.target === 'header').map((p) => {
                const parameterName = toCasing(p.name, ctx.config.parameterNameCasing);
                const toString = this.getParameterToString(ctx, { endpoint, parameter: p });
                return p.required && !p.schema?.nullable
                  ? kt.call(['headers', 'add'], [kt.string(p.name), parameterName + toString])
                  : kt.call([`${parameterName}?`, 'also'], [
                    kt.lambda([], kt.call(['headers', 'add'], [kt.string(p.name), 'it' + toString]), {
                      singleline: true,
                    }),
                  ]);
              }),
              '\n',
            ),
          ),
        ]),
      );
    }

    result.values.push(kt.call(callChain));
    return result;
  }

  protected getEndpointUriFunctionName(ctx: Context, args: Args.GetEndpointUriFunctionName): string {
    const { endpoint } = args;
    return toCasing(`${this.getEndpointFunctionName(ctx, { endpoint })}_uri`, ctx.config.functionNameCasing);
  }

  protected getEndpointUriFunction(ctx: Context, args: Args.GetEndpointUriFunction): kt.Function<Builder> {
    const { endpoint, parameters } = args;
    const functionName = this.getEndpointUriFunctionName(ctx, { endpoint });

    return kt.function(functionName, {
      parameters: parameters.filter((p) => p.target === 'path' || p.target === 'query').map((parameter) =>
        kt.parameter(
          toCasing(parameter.name, ctx.config.parameterNameCasing),
          this.getParameterType(ctx, { endpoint, parameter }),
          { default: this.getParameterDefaultValue(ctx, { endpoint, parameter }) },
        )
      ),
      returnType: kt.refs.string(),
      body: this.getEndpointUriFunctionBody(ctx, { endpoint, parameters }),
    });
  }

  protected getEndpointUriFunctionBody(ctx: Context, args: Args.GetEndpointUriFunctionBody): AppendValueGroup<Builder> {
    const { endpoint } = args;
    const result = appendValueGroup<Builder>([], '\n');

    const callChain: KtValue<Builder>[] = [];
    callChain.push(
      s`${kt.refs.spring.uriComponentsBuilder()}.fromPath(${kt.string(this.getEndpointPath(ctx, { endpoint }))})`,
    );

    if (endpoint.parameters.some((x) => x.target === 'query')) {
      callChain.push(
        kt.call('apply', [kt.lambda(
          [],
          appendValueGroup(
            endpoint.parameters.filter((x) => x.target === 'query').map((p) => {
              const parameterName = toCasing(p.name, ctx.config.parameterNameCasing);
              const toString = this.getParameterToString(ctx, { endpoint, parameter: p });
              return p.required && !p.schema?.nullable
                ? kt.call('queryParam', [kt.string(p.name), parameterName + toString])
                : kt.call([`${parameterName}?`, 'also'], [
                  kt.lambda([], kt.call('queryParam', [kt.string(p.name), 'it' + toString]), { singleline: true }),
                ]);
            }),
            '\n',
          ),
        )]),
      );
    }

    if (endpoint.parameters.some((x) => x.target === 'path')) {
      callChain.push(kt.call('buildAndExpand', [
        kt.call(
          [kt.refs.mapOf.infer()],
          endpoint.parameters.filter((p) => p.target === 'path').map((p) =>
            s`${kt.string(p.name)} to ${toCasing(p.name, ctx.config.parameterNameCasing)}${
              this.getParameterToString(ctx, { endpoint, parameter: p })
            }`
          ),
        ),
      ]));
    } else {
      callChain.push(kt.call('build', []));
    }

    callChain.push('toUriString');
    result.values.push(s`return ${kt.call(callChain, [])}`);
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

  protected getParameterType(ctx: Context, args: Args.GetParameterType): kt.Type<Builder> {
    const { parameter } = args;
    if (parameter.multipart?.isFile) {
      return ctx.refs.apiRequestFile();
    }
    return this.getTypeUsage(ctx, {
      schema: parameter.schema,
      nullable: !parameter.required,
    });
  }

  protected getParameterDefaultValue(ctx: Context, args: Args.GetParameterDefaultValue): kt.Value<Builder> | null {
    const { parameter } = args;

    return !parameter.required
      ? parameter.schema?.kind === 'string' && parameter.schema.enum && parameter.schema.default
        ? s`${this.getTypeUsage(ctx, { schema: parameter.schema, nullable: false })}.${
          toCasing(String(parameter.schema.default), ctx.config.enumValueNameCasing)
        }`
        : kt.toNode(parameter.schema?.default)
      : null;
  }

  protected getTypeUsage(ctx: Context, args: Args.GetTypeUsage<Builder>): kt.Type<Builder> {
    const { schema, nullable, fallback } = args;
    const type = this.getSchemaType(ctx, { schema });
    return type
      ? createOverwriteProxy(type, { nullable: nullable ?? type.nullable })
      : (fallback ?? kt.refs.any({ nullable }));
  }

  // deno-lint-ignore no-unused-vars
  protected getPackageName(ctx: Context, args: Args.GetPackageName): string {
    const packageSuffix = typeof ctx.config.packageSuffix === 'string'
      ? ctx.config.packageSuffix
      : ctx.config.packageSuffix(ctx.service);
    return ctx.config.packageName + packageSuffix;
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
    return modifyString(endpoint.path.replace(/^\/*/, ''), ctx.config.pathModifier, endpoint);
  }

  protected getFilePath(ctx: Context, args: Args.GetFilePath): string {
    const { packageName } = args;
    return `${ctx.config.outputDir}/${packageName.replace(/\./g, '/')}/${this.getRequestsObjectName(ctx, {})}.kt`;
  }

  // deno-lint-ignore no-unused-vars
  protected getRequestsObjectName(ctx: Context, args: Args.GetRequestsObjectName): string {
    return toCasing(`${ctx.service.name}_Requests`, ctx.config.typeNameCasing);
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
