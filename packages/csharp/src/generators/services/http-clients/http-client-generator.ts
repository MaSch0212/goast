import {
  type ApiSchema,
  type AppendValue,
  appendValueGroup,
  type AppendValueGroup,
  builderTemplate as s,
  createOverwriteProxy,
  DEFAULT_IGNORED_SCHEMA_PROPERTIES,
  getSchemaReference,
  getSourceDisplayName,
  type MaybePromise,
  notNullish,
  resolveAnyOfAndAllOf,
  type SourceBuilder,
  toCasing,
} from '@goast/core';

import { cs } from '../../../ast/index.ts';
import { CSharpFileBuilder } from '../../../file-builder.ts';
import {
  escapeCSharpKeyword,
  escapeCSharpString,
  getSourceDocLine,
  modifyString,
  toCSharpStringLiteral,
} from '../../../utils.ts';
import { CSharpFileGenerator } from '../../file-generator.ts';
import type { DefaultCSharpHttpClientGeneratorArgs as Args } from './index.ts';
import type {
  CSharpClientBody,
  CSharpClientContentKind,
  CSharpClientEndpoint,
  CSharpClientError,
  CSharpClientParameter,
  CSharpClientResponseBody,
  CSharpHttpClientGeneratorContext,
  CSharpHttpClientGeneratorOutput,
} from './models.ts';

type Context = CSharpHttpClientGeneratorContext;
type Output = CSharpHttpClientGeneratorOutput;
type Builder = CSharpFileBuilder;

/** The names of `HttpStatusCode`, for the exception types of documented error responses. */
const statusNames: Record<number, string> = {
  300: 'MultipleChoices',
  301: 'MovedPermanently',
  302: 'Found',
  303: 'SeeOther',
  304: 'NotModified',
  305: 'UseProxy',
  307: 'TemporaryRedirect',
  308: 'PermanentRedirect',
  400: 'BadRequest',
  401: 'Unauthorized',
  402: 'PaymentRequired',
  403: 'Forbidden',
  404: 'NotFound',
  405: 'MethodNotAllowed',
  406: 'NotAcceptable',
  407: 'ProxyAuthenticationRequired',
  408: 'RequestTimeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'LengthRequired',
  412: 'PreconditionFailed',
  413: 'PayloadTooLarge',
  414: 'UriTooLong',
  415: 'UnsupportedMediaType',
  416: 'RangeNotSatisfiable',
  417: 'ExpectationFailed',
  421: 'MisdirectedRequest',
  422: 'UnprocessableEntity',
  423: 'Locked',
  424: 'FailedDependency',
  426: 'UpgradeRequired',
  428: 'PreconditionRequired',
  429: 'TooManyRequests',
  431: 'RequestHeaderFieldsTooLarge',
  451: 'UnavailableForLegalReasons',
  500: 'InternalServerError',
  501: 'NotImplemented',
  502: 'BadGateway',
  503: 'ServiceUnavailable',
  504: 'GatewayTimeout',
  505: 'HttpVersionNotSupported',
  506: 'VariantAlsoNegotiates',
  507: 'InsufficientStorage',
  508: 'LoopDetected',
  510: 'NotExtended',
  511: 'NetworkAuthenticationRequired',
};

const httpMethods: Record<string, string> = {
  get: 'Get',
  put: 'Put',
  post: 'Post',
  delete: 'Delete',
  options: 'Options',
  head: 'Head',
  patch: 'Patch',
  trace: 'Trace',
};

/** Media types that are binary whatever the schema of their body says. */
const binaryMediaType = /^(image|audio|video|font)\/|^application\/(octet-stream|pdf|zip|gzip|x-.*)$/;

const successKey = /^2(\d\d|XX)$/i;
const errorKey = /^([1-5]\d\d|[1-5]XX|default)$/i;

/** Parameters that OpenAPI says to ignore when declared as a header parameter. */
const ignoredHeaderParameters = new Set(['accept', 'content-type', 'authorization']);

export interface CSharpHttpClientGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): MaybePromise<TOutput>;
}

export class DefaultCSharpHttpClientGenerator
  extends CSharpFileGenerator<Context, Output>
  implements CSharpHttpClientGenerator
{
  public generate(ctx: Context): MaybePromise<Output> {
    const clientName = this.getClientName(ctx, {});
    const interfaceName = this.getInterfaceName(ctx, {});
    const endpoints = this.getEndpoints(ctx, {});

    console.log(`Generating client for service ${ctx.service.name} [${ctx.namespace}.${clientName}]...`);
    for (const { endpoint, methodName } of endpoints) {
      console.log(`  ${getSourceDisplayName(ctx.data, endpoint)} [${methodName}]`);
    }

    this.writeFile(ctx, interfaceName, this.getInterfaceFileContent(ctx, { endpoints }));
    this.writeFile(ctx, clientName, this.getClientFileContent(ctx, { endpoints }));
    this.writeFile(ctx, this.getExtensionsName(ctx, {}), this.getExtensionsFileContent(ctx, {}));
    for (const endpoint of endpoints) {
      for (const error of endpoint.errors) {
        const filePath = this.getFilePath(ctx, { name: error.className });
        if (ctx.writtenFiles.has(filePath)) continue;
        this.writeFile(ctx, error.className, this.getExceptionFileContent(ctx, { endpoint, error }));
      }
    }

    return {
      type: cs.reference(clientName, ctx.namespace),
      interfaceType: cs.reference(interfaceName, ctx.namespace),
    };
  }

  private writeFile(ctx: Context, name: string, content: AppendValue<Builder>): void {
    const filePath = this.getFilePath(ctx, { name });
    ctx.writtenFiles.add(filePath);
    const builder = new CSharpFileBuilder(ctx.namespace, ctx.config);
    builder.append(content);
    builder.writeToFile(filePath);
  }

  // #region Files
  protected getInterfaceFileContent(ctx: Context, args: Args.GetInterfaceFileContent): AppendValueGroup<Builder> {
    const { endpoints } = args;
    return this.withDeprecationPragma(ctx, {
      schemas: endpoints.flatMap((x) => this.getEndpointSchemas(ctx, { endpoint: x.endpoint })),
      content: this.getClientInterface(ctx, { endpoints }),
    });
  }

  protected getClientFileContent(ctx: Context, args: Args.GetClientFileContent): AppendValueGroup<Builder> {
    const { endpoints } = args;
    return this.withDeprecationPragma(ctx, {
      schemas: endpoints.flatMap((x) => this.getEndpointSchemas(ctx, { endpoint: x.endpoint })),
      content: this.getClientClass(ctx, { endpoints }),
    });
  }

  protected getExtensionsFileContent(ctx: Context, _args: Args.GetExtensionsFileContent): AppendValueGroup<Builder> {
    return appendValueGroup([this.getExtensionsClass(ctx, {})]);
  }

  protected getExceptionFileContent(ctx: Context, args: Args.GetExceptionFileContent): AppendValueGroup<Builder> {
    return this.withDeprecationPragma(ctx, {
      schemas: [args.error.body?.schema],
      content: this.getExceptionClass(ctx, args),
    });
  }

  /**
   * Referencing an `[Obsolete]` model is a warning (an error under `TreatWarningsAsErrors`), even in generated code
   * that merely mirrors the structure of the specification.
   */
  private withDeprecationPragma(
    ctx: Context,
    args: { schemas: (ApiSchema | undefined)[]; content: AppendValue<Builder> },
  ): AppendValueGroup<Builder> {
    return appendValueGroup<Builder>(
      [
        this.referencesDeprecatedType(ctx, { schemas: args.schemas }) ? '#pragma warning disable CS0612, CS0618' : null,
        args.content,
      ].filter(notNullish),
      '\n',
    );
  }

  protected referencesDeprecatedType(_ctx: Context, args: Args.ReferencesDeprecatedType): boolean {
    const seen = new Set<ApiSchema>();
    const isDeprecated = (schema: ApiSchema | undefined): boolean => {
      if (!schema || seen.has(schema)) return false;
      seen.add(schema);
      const reference = getSchemaReference(schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
      if (schema.deprecated || reference.deprecated) return true;
      return [
        reference.kind === 'array' ? reference.items : undefined,
        ...(reference.kind === 'oneOf' ? reference.oneOf : []),
        ...('allOf' in reference ? reference.allOf : []),
        ...('anyOf' in reference ? reference.anyOf : []),
      ].some(isDeprecated);
    };
    return args.schemas.some(isDeprecated);
  }

  protected getEndpointSchemas(_ctx: Context, args: Args.GetEndpointSchemas): (ApiSchema | undefined)[] {
    const { endpoint } = args;
    return [
      ...endpoint.parameters.map((x) => x.schema),
      ...(endpoint.requestBody?.content.map((x) => x.schema) ?? []),
      ...endpoint.responses.flatMap((x) => x.contentOptions.map((y) => y.schema)),
    ];
  }
  // #endregion

  // #region Declarations
  protected getClientInterface(ctx: Context, args: Args.GetClientInterface): cs.Interface<Builder> {
    const { endpoints } = args;
    return cs.interface(this.getInterfaceName(ctx, {}), {
      doc: cs.doc(this.getServiceDocDescription(ctx, {})),
      attributes: [this.isServiceDeprecated(endpoints) ? cs.attribute(cs.refs.system.obsolete()) : null],
      accessModifier: 'public',
      members: endpoints.map((endpoint) => this.getEndpointMethod(ctx, { endpoint, declaration: true })),
    });
  }

  protected getClientClass(ctx: Context, args: Args.GetClientClass): cs.Class<Builder> {
    const { endpoints } = args;
    return cs.class(this.getClientName(ctx, {}), {
      doc: cs.doc(this.getServiceDocDescription(ctx, {})),
      attributes: [this.isServiceDeprecated(endpoints) ? cs.attribute(cs.refs.system.obsolete()) : null],
      accessModifier: 'public',
      implements: [cs.reference(this.getInterfaceName(ctx, {}), ctx.namespace)],
      members: [
        cs.field('_httpClient', {
          type: cs.refs.systemNetHttp.httpClient(),
          accessModifier: 'private',
          readonly: true,
        }),
        this.getClientConstructor(ctx, {}),
        ...endpoints.map((endpoint) => this.getEndpointMethod(ctx, { endpoint, declaration: false })),
      ],
    });
  }

  protected getClientConstructor(_ctx: Context, _args: Args.GetClientConstructor): cs.Constructor<Builder> {
    return cs.constructor(
      [
        cs.parameter('httpClient', cs.refs.systemNetHttp.httpClient(), {
          description: 'The client requests are sent with.',
        }),
      ],
      appendValueGroup(
        [s<Builder>`${cs.refs.system.argumentNullException()}.ThrowIfNull(httpClient);`, '_httpClient = httpClient;'],
        '\n',
      ),
      {
        accessModifier: 'public',
        doc: cs.doc('Creates the client.'),
      },
    );
  }

  protected getExtensionsClass(ctx: Context, _args: Args.GetExtensionsClass): cs.Class<Builder> {
    const clientName = this.getClientName(ctx, {});
    const interfaceName = this.getInterfaceName(ctx, {});
    const baseAddress = this.getBasePath(ctx, {});

    return cs.class(this.getExtensionsName(ctx, {}), {
      doc: cs.doc(`Registers the ${clientName} with dependency injection.`),
      accessModifier: 'public',
      static: true,
      members: [
        cs.method(`Add${clientName}`, {
          doc: cs.doc(`Registers ${interfaceName} and its implementation ${clientName} as a typed HttpClient.`, [
            cs.docTag.returns('The builder of the registered HttpClient, to configure it further.'),
          ]),
          accessModifier: 'public',
          static: true,
          returnType: cs.refs.extensionsDependencyInjection.iHttpClientBuilder(),
          parameters: [
            cs.parameter('services', cs.refs.extensionsDependencyInjection.iServiceCollection(), {
              this: true,
              description: 'The service collection to register the client in.',
            }),
            cs.parameter(
              'configure',
              cs.reference('Action', 'System', { generics: [cs.refs.systemNetHttp.httpClient()], nullable: true }),
              {
                default: 'null',
                description: 'Configures the HttpClient, for example its BaseAddress.',
              },
            ),
          ],
          body: appendValueGroup<Builder>(
            [
              s<Builder>`${cs.refs.system.argumentNullException()}.ThrowIfNull(services);`,
              '',
              s<Builder>`return services.AddHttpClient<${cs.reference(interfaceName, ctx.namespace)}, ${cs.reference(clientName, ctx.namespace)}>(httpClient =>`,
              this.block(
                appendValueGroup<Builder>(
                  [
                    baseAddress !== undefined
                      ? s<Builder>`httpClient.BaseAddress = new ${cs.refs.system.uri()}(${toCSharpStringLiteral(baseAddress)});`
                      : null,
                    'configure?.Invoke(httpClient);',
                  ].filter(notNullish),
                  '\n',
                ),
                ');',
              ),
            ],
            '\n',
          ),
        }),
      ],
    });
  }

  protected getExceptionClass(ctx: Context, args: Args.GetExceptionClass): cs.Class<Builder> {
    const { endpoint, error } = args;
    const headers = cs.refs.system.iReadOnlyDictionary([
      cs.refs.system.string(),
      cs.refs.system.iReadOnlyList([cs.refs.system.string()]),
    ]);
    const bodyType = error.body ? this.nullable(error.body.type, true) : undefined;

    return cs.class(error.className, {
      doc: cs.doc(
        `Thrown by ${endpoint.methodName} when the server responds with ${this.getErrorStatusText(error)}${
          error.description ? `: ${error.description.trim()}` : '.'
        }`,
      ),
      accessModifier: 'public',
      sealed: true,
      extends: ctx.refs.apiException(),
      members: [
        cs.constructor(
          [
            cs.parameter('statusCode', cs.refs.system.int(), { description: 'The HTTP status code of the response.' }),
            cs.parameter('responseHeaders', headers, { description: 'The headers of the response.' }),
            cs.parameter('responseBody', cs.refs.system.string(), { description: 'The body of the response as text.' }),
            bodyType
              ? cs.parameter('body', bodyType, {
                  description: 'The deserialized body, or null if the response has no body or it could not be read.',
                })
              : null,
          ],
          bodyType ? 'Body = body;' : null,
          {
            accessModifier: 'public',
            delegateTarget: 'base',
            delegateArguments: ['statusCode', 'responseHeaders', 'responseBody'],
          },
        ),
        bodyType
          ? cs.property('Body', {
              doc: cs.doc('The deserialized body of the response, or null if it has no body or it could not be read.'),
              type: bodyType,
              accessModifier: 'public',
              accessors: ['get'],
            })
          : null,
      ],
    });
  }

  protected getEndpointMethod(ctx: Context, args: Args.GetEndpointMethod): cs.Method<Builder> {
    const { endpoint, declaration } = args;
    return cs.method(endpoint.methodName, {
      doc: this.getEndpointMethodDoc(ctx, { endpoint }),
      attributes: [endpoint.endpoint.deprecated ? cs.attribute(cs.refs.system.obsolete()) : null],
      accessModifier: declaration ? null : 'public',
      async: !declaration,
      returnType: this.getEndpointReturnType(ctx, { endpoint }),
      parameters: [
        ...endpoint.parameters.map((parameter) =>
          cs.parameter(parameter.name, parameter.type, {
            description: parameter.description ?? this.getDefaultParameterDescription(parameter),
            default: parameter.required ? null : 'null',
          }),
        ),
        cs.parameter('cancellationToken', cs.refs.system.cancellationToken(), {
          default: 'default',
          description: 'A token to cancel the request.',
        }),
      ],
      body: declaration ? null : this.getEndpointMethodBody(ctx, { endpoint }),
    });
  }

  protected getEndpointMethodDoc(ctx: Context, args: Args.GetEndpointMethodDoc): cs.Doc<Builder> {
    const { endpoint } = args;
    const returns = endpoint.success?.body
      ? `The ${endpoint.success.body.kind === 'binary' ? 'content' : 'deserialized body'} of the response${
          endpoint.success.response.description ? `: ${endpoint.success.response.description.trim()}` : '.'
        }`
      : null;
    return cs.doc(
      this.getEndpointDocDescription(ctx, { endpoint: endpoint.endpoint }),
      [
        returns ? cs.docTag.returns(returns) : null,
        cs.docTag.exception(
          'ApiException',
          'The server responded with a status code that is not a success (2xx) status code.',
        ),
      ].filter(notNullish),
    );
  }

  protected getEndpointReturnType(_ctx: Context, args: Args.GetEndpointReturnType): cs.Type<Builder> {
    const { endpoint } = args;
    if (!endpoint.success?.body) {
      return cs.refs.system.task();
    }
    return cs.refs.system.taskOf([this.getSuccessType(endpoint)]);
  }

  private getSuccessType(endpoint: CSharpClientEndpoint): cs.Type<Builder> {
    const body = endpoint.success?.body;
    if (!body) {
      throw new Error(`The operation ${endpoint.endpoint.name} has no success body.`);
    }
    return body.kind === 'json' && endpoint.allowEmptySuccess ? this.nullable(body.type, true) : body.type;
  }
  // #endregion

  // #region Method body
  protected getEndpointMethodBody(ctx: Context, args: Args.GetEndpointMethodBody): AppendValueGroup<Builder> {
    const { endpoint } = args;
    const http = cs.refs.systemNetHttp;
    const queryParameters = endpoint.parameters.filter((x) => x.target === 'query');
    const headerParameters = endpoint.parameters.filter((x) => x.target === 'header');
    const cookieParameters = endpoint.parameters.filter((x) => x.target === 'cookie');
    const statements: AppendValue<Builder>[] = [];

    statements.push(s<Builder>`var __path = ${this.getPathExpression(ctx, { endpoint })};`);
    if (queryParameters.length > 0) {
      statements.push(s<Builder>`var __query = new ${cs.refs.system.list([cs.refs.system.string()])}();`);
      for (const parameter of queryParameters) {
        const options = [
          parameter.style !== 'form' ? `style: ${toCSharpStringLiteral(parameter.style)}` : null,
          parameter.explode !== true ? 'explode: false' : null,
          parameter.allowReserved ? 'allowReserved: true' : null,
        ].filter(notNullish);
        statements.push(
          `ApiRuntime.AddQuery(__query, ${[toCSharpStringLiteral(parameter.wireName), parameter.name, ...options].join(', ')});`,
        );
      }
    }

    const method = httpMethods[endpoint.endpoint.method] ?? 'Get';
    statements.push(
      s<Builder>`using var __request = new ${http.httpRequestMessage()}(${http.httpMethod()}.${method}, ApiRuntime.BuildUri(_httpClient, __path, ${queryParameters.length > 0 ? '__query' : 'null'}));`,
    );
    if (endpoint.accept.length > 0) {
      statements.push(`ApiRuntime.SetAccept(__request, ${endpoint.accept.map(toCSharpStringLiteral).join(', ')});`);
    }
    for (const parameter of headerParameters) {
      statements.push(
        `ApiRuntime.AddHeader(__request, ${toCSharpStringLiteral(parameter.wireName)}, ${parameter.name}${
          parameter.explode ? ', explode: true' : ''
        });`,
      );
    }
    if (cookieParameters.length > 0) {
      statements.push(s<Builder>`var __cookies = new ${cs.refs.system.list([cs.refs.system.string()])}();`);
      for (const parameter of cookieParameters) {
        statements.push(
          `ApiRuntime.AddCookie(__cookies, ${toCSharpStringLiteral(parameter.wireName)}, ${parameter.name}${
            parameter.explode ? '' : ', explode: false'
          });`,
        );
      }
      statements.push('ApiRuntime.ApplyCookies(__request, __cookies);');
    }

    if (endpoint.body) {
      statements.push(...this.getRequestBodyStatements(ctx, { endpoint, body: endpoint.body }));
    }
    if (headerParameters.length > 0) {
      // Content headers (Content-Language, Expires, ...) can only be set once the content exists.
      statements.push('ApiRuntime.ApplyContentHeaders(__request);');
    }

    statements.push('');
    statements.push(
      'using var __response = await _httpClient.SendAsync(__request, cancellationToken).ConfigureAwait(false);',
    );
    statements.push('');
    statements.push(...this.getErrorHandlingStatements(ctx, { endpoint }));
    statements.push(...this.getSuccessStatements(ctx, { endpoint }));

    return appendValueGroup(statements, '\n');
  }

  protected getPathExpression(ctx: Context, args: Args.GetPathExpression): string {
    const { endpoint } = args;
    const path = this.getEndpointPath(ctx, { endpoint: endpoint.endpoint });
    const pathParameters = new Map(endpoint.parameters.filter((x) => x.target === 'path').map((x) => [x.wireName, x]));

    let hasHoles = false;
    const parts = path.split(/(\{[^{}]+\})/).map((part) => {
      const parameter = /^\{([^{}]+)\}$/.test(part) ? pathParameters.get(part.slice(1, -1)) : undefined;
      if (parameter) {
        hasHoles = true;
        const options = [
          parameter.style !== 'simple' ? `style: ${toCSharpStringLiteral(parameter.style)}` : null,
          parameter.explode ? 'explode: true' : null,
        ].filter(notNullish);
        return {
          hole: `{ApiRuntime.EncodePath(${[toCSharpStringLiteral(parameter.wireName), parameter.name, ...options].join(', ')})}`,
        };
      }
      return { text: part };
    });

    if (!hasHoles) {
      return toCSharpStringLiteral(path);
    }
    return `$"${parts
      .map((part) => ('hole' in part ? part.hole : escapeCSharpString(part.text).replace(/[{}]/g, (c) => c + c)))
      .join('')}"`;
  }

  protected getRequestBodyStatements(_ctx: Context, args: Args.GetRequestBodyStatements): AppendValue<Builder>[] {
    const { body } = args;
    const mediaType = toCSharpStringLiteral(body.mediaType);
    const parameter = body.parameters[0];

    if (body.kind === 'multipart') {
      return [
        s<Builder>`var __content = ApiRuntime.CreateMultipartContent();`,
        ...body.parameters.map(
          (part) => `ApiRuntime.AddPart(__content, ${toCSharpStringLiteral(part.wireName)}, ${part.name});`,
        ),
        '__request.Content = __content;',
      ];
    }

    const create = (): AppendValue<Builder> => {
      switch (body.kind) {
        case 'json':
          return s<Builder>`ApiRuntime.CreateJsonContent<${body.serializeAs ?? parameter.type}>(${parameter.name}, ${mediaType})`;
        case 'form':
          return s<Builder>`ApiRuntime.CreateFormContent<${body.serializeAs ?? parameter.type}>(${parameter.name})`;
        case 'text':
          return `ApiRuntime.CreateTextContent(${parameter.name}, ${mediaType})`;
        default:
          return `ApiRuntime.CreateBinaryContent(${parameter.name}, ${mediaType})`;
      }
    };
    const assign = s<Builder>`__request.Content = ${create()};`;
    return [parameter.required ? assign : this.block(assign, null, s<Builder>`if (${parameter.name} is not null)`)];
  }

  protected getErrorHandlingStatements(_ctx: Context, args: Args.GetErrorHandlingStatements): AppendValue<Builder>[] {
    const { endpoint } = args;

    const exact = endpoint.errors
      .filter((x) => x.statusCode !== undefined)
      .sort((a, b) => (a.statusCode ?? 0) - (b.statusCode ?? 0));
    const ranges = endpoint.errors
      .filter((x) => x.range !== undefined)
      .sort((a, b) => (a.range?.[0] ?? 0) - (b.range?.[0] ?? 0));
    const fallback = endpoint.errors.find((x) => x.statusKey.toLowerCase() === 'default');

    const create = (error: CSharpClientError | undefined): AppendValue<Builder> => {
      if (!error) return 'new ApiException(__status, __headers, __errorBody)';
      if (!error.body) return `new ${error.className}(__status, __headers, __errorBody)`;
      return error.body.kind === 'text'
        ? `new ${error.className}(__status, __headers, __errorBody, __errorBody.Length == 0 ? null : __errorBody)`
        : s<Builder>`new ${error.className}(__status, __headers, __errorBody, ApiRuntime.TryDeserialize<${this.nullable(error.body.type, true)}>(__errorBody))`;
    };

    const arms: AppendValue<Builder>[] = [
      ...exact.map((x) => s<Builder>`${String(x.statusCode)} => ${create(x)},`),
      ...ranges.map((x) => {
        const [min, max] = x.range ?? [0, 0];
        return s<Builder>`>= ${min} and <= ${max} => ${create(x)},`;
      }),
      s<Builder>`_ => ${create(fallback)},`,
    ];

    const body: AppendValue<Builder>[] = [
      'var __status = (int)__response.StatusCode;',
      'var __headers = ApiRuntime.GetHeaders(__response);',
      'var __errorBody = await ApiRuntime.ReadErrorBodyAsync(__response, cancellationToken).ConfigureAwait(false);',
      arms.length === 1
        ? s<Builder>`throw ${create(fallback)};`
        : appendValueGroup<Builder>(
            [
              'ApiException __exception = __status switch',
              this.block(appendValueGroup<Builder>(arms, '\n'), ';'),
              'throw __exception;',
            ],
            '\n',
          ),
    ];

    return [this.block(appendValueGroup<Builder>(body, '\n'), null, 'if (!__response.IsSuccessStatusCode)'), ''];
  }

  protected getSuccessStatements(_ctx: Context, args: Args.GetSuccessStatements): AppendValue<Builder>[] {
    const { endpoint } = args;
    const body = endpoint.success?.body;
    if (!body) return [];

    switch (body.kind) {
      case 'json':
        return [
          s<Builder>`return await ApiRuntime.ReadJsonAsync<${this.getSuccessType(endpoint)}>(__response, ${
            endpoint.allowEmptySuccess ? 'true' : 'false'
          }, cancellationToken).ConfigureAwait(false);`,
        ];
      case 'text':
        return ['return await ApiRuntime.ReadTextAsync(__response, cancellationToken).ConfigureAwait(false);'];
      default:
        return ['return await ApiRuntime.ReadStreamAsync(__response, cancellationToken).ConfigureAwait(false);'];
    }
  }

  /** `{ body }` with an optional header line before the opening brace and a suffix after the closing one. */
  private block(
    body: AppendValue<Builder>,
    suffix: string | null,
    header?: AppendValue<Builder>,
  ): AppendValue<Builder> {
    return (builder) => {
      if (header !== undefined) {
        builder.append(header);
      }
      builder.ensureCurrentLineEmpty().parenthesize('{}', body, { multiline: true });
      if (suffix) {
        builder.append(suffix);
      }
    };
  }
  // #endregion

  // #region Endpoint model
  protected getEndpoints(ctx: Context, _args: Args.GetEndpoints): CSharpClientEndpoint[] {
    const names = new Set<string>();
    return ctx.service.endpoints.map((endpoint) => {
      const methodBaseName = this.getMethodBaseName(ctx, { endpoint, names });
      return this.getEndpoint(ctx, { endpoint, methodBaseName });
    });
  }

  protected getEndpoint(ctx: Context, args: Args.GetEndpoint): CSharpClientEndpoint {
    const { endpoint, methodBaseName } = args;
    const names = new Set<string>(['cancellationToken']);
    const parameters = this.getParameters(ctx, { endpoint, names });
    const body = this.getBody(ctx, { endpoint, names });

    const successResponses = endpoint.responses.filter((x) => successKey.test(x.statusKey));
    const first = successResponses[0];
    const firstBody = first
      ? this.getResponseBody(ctx, { response: first, kinds: ['json', 'text', 'binary'] })
      : undefined;
    const errors = this.getErrors(ctx, { endpoint, methodBaseName });

    const accept = [
      ...new Set(
        [
          firstBody?.mediaType,
          ...successResponses
            .slice(1)
            .map((x) => this.getResponseBody(ctx, { response: x, kinds: ['json', 'text', 'binary'] })?.mediaType),
          ...errors.map((x) => x.body?.mediaType),
        ].filter(notNullish),
      ),
    ];

    return {
      endpoint,
      methodBaseName,
      methodName: `${methodBaseName}Async`,
      parameters: [...parameters, ...(body?.parameters ?? [])].sort((a, b) =>
        a.required === b.required ? 0 : a.required ? -1 : 1,
      ),
      body,
      success: first ? { response: first, body: firstBody } : undefined,
      allowEmptySuccess: successResponses.slice(1).some((x) => x.contentOptions.length === 0),
      errors,
      accept,
    };
  }

  protected getMethodBaseName(ctx: Context, args: Args.GetMethodBaseName): string {
    const { endpoint, names } = args;
    let base = toCasing(endpoint.name, ctx.config.methodNameCasing);
    if (base === '') base = 'Operation';
    if (/^[0-9]/.test(base)) base = `_${base}`;
    let name = base;
    for (let i = 2; names.has(name); i++) name = `${base}${i}`;
    names.add(name);
    return name;
  }

  protected getParameters(ctx: Context, args: Args.GetParameters): CSharpClientParameter[] {
    const { endpoint, names } = args;
    const result: CSharpClientParameter[] = [];
    for (const parameter of endpoint.parameters) {
      if (
        parameter.target !== 'path' &&
        parameter.target !== 'query' &&
        parameter.target !== 'header' &&
        parameter.target !== 'cookie'
      ) {
        continue;
      }
      if (parameter.target === 'header' && ignoredHeaderParameters.has(parameter.name.toLowerCase())) {
        continue;
      }

      const style = this.getParameterStyle(ctx, { parameter });
      result.push({
        name: this.getParameterName(ctx, { name: parameter.name, names }),
        wireName: parameter.name,
        target: parameter.target,
        type: this.getParameterType(ctx, { parameter }),
        required: parameter.required || parameter.target === 'path',
        description: parameter.description?.trim() || undefined,
        style,
        explode: parameter.explode ?? style === 'form',
        allowReserved: parameter.allowReserved ?? false,
      });
    }
    return result;
  }

  protected getParameterStyle(_ctx: Context, args: Args.GetParameterStyle): string {
    const { parameter } = args;
    if (parameter.target === 'header') return 'simple';
    return parameter.style ?? (parameter.target === 'query' || parameter.target === 'cookie' ? 'form' : 'simple');
  }

  protected getParameterType(ctx: Context, args: Args.GetParameterType): cs.Type<Builder> {
    const { parameter } = args;
    const required = parameter.required || parameter.target === 'path';
    return this.getTypeUsage(ctx, {
      schema: parameter.schema,
      nullable: required ? undefined : true,
      fallback: cs.refs.system.object({ nullable: !required }),
    });
  }

  protected getParameterName(ctx: Context, args: Args.GetParameterName): string {
    const { name, names } = args;
    let base = toCasing(name, ctx.config.parameterNameCasing);
    if (base === '') base = 'parameter';
    if (/^[0-9]/.test(base)) base = `_${base}`;
    let unique = base;
    for (let i = 2; names.has(unique); i++) unique = `${base}${i}`;
    names.add(unique);
    return escapeCSharpKeyword(unique);
  }

  protected getBody(ctx: Context, args: Args.GetBody): CSharpClientBody | undefined {
    const { endpoint, names } = args;
    const requestBody = endpoint.requestBody;
    if (!requestBody || requestBody.content.length === 0) return undefined;

    const content =
      requestBody.content.find((x) => this.getContentKind(x.type, x.schema) === 'json') ?? requestBody.content[0];
    const kind = this.getContentKind(content.type, content.schema);
    const mediaType = this.getRequestMediaType(content.type, kind);

    if (kind === 'multipart') {
      let schema = content.schema;
      const parts: CSharpClientParameter[] = [];
      if (schema?.kind === 'object') {
        schema = resolveAnyOfAndAllOf(schema, true) ?? schema;
        const objectSchema = schema as ApiSchema<'object'>;
        for (const [name, property] of objectSchema.properties?.entries() ?? []) {
          const required = objectSchema.required.has(name);
          parts.push({
            name: this.getParameterName(ctx, { name, names }),
            wireName: name,
            target: 'part',
            type: this.getPartType(ctx, { schema: property.schema, required }),
            required,
            description: property.schema.description?.trim() || undefined,
            style: 'form',
            explode: true,
            allowReserved: false,
          });
        }
      }
      return { kind, mediaType, parameters: parts, serializeAs: undefined };
    }

    const required = requestBody.required;
    const type: cs.Type<Builder> =
      kind === 'text'
        ? cs.refs.system.string({ nullable: !required })
        : kind === 'binary'
          ? cs.refs.system.stream({ nullable: !required })
          : this.getTypeUsage(ctx, {
              schema: content.schema,
              nullable: required ? undefined : true,
              fallback: cs.refs.systemTextJson.jsonElement({ nullable: !required }),
            });

    const parameter: CSharpClientParameter = {
      name: this.getParameterName(ctx, { name: 'body', names }),
      wireName: 'body',
      target: 'body',
      type,
      required,
      description: requestBody.description?.trim() || undefined,
      style: 'form',
      explode: true,
      allowReserved: false,
    };

    let serializeAs: cs.Type<Builder> | undefined;
    if (kind === 'json' || kind === 'form') {
      const base = this.getPolymorphicBaseType(ctx, { schema: content.schema });
      serializeAs = base ? this.nullable(base, !required || this.isNullable(type)) : type;
    }
    return { kind, mediaType, parameters: [parameter], serializeAs };
  }

  /** The type of a multipart part: files are `ApiFile` (a `Stream` converts implicitly), everything else is its model type. */
  protected getPartType(ctx: Context, args: { schema: ApiSchema; required: boolean }): cs.Type<Builder> {
    const { schema, required } = args;
    const isFile = (x: ApiSchema | undefined) => x?.kind === 'string' && x.format === 'binary';
    if (isFile(schema)) {
      return ctx.refs.apiFile({ nullable: !required });
    }
    if (schema.kind === 'array' && isFile(schema.items)) {
      return cs.refs.system.iReadOnlyList([ctx.refs.apiFile()], { nullable: !required });
    }
    return this.getTypeUsage(ctx, { schema, nullable: required ? undefined : true });
  }

  /**
   * The `[JsonPolymorphic]` base a body type derives from, if its discriminator maps the body's schema. Such a body
   * must be serialized as the base, because `System.Text.Json` only writes the discriminator when the static type is
   * the base.
   */
  protected getPolymorphicBaseType(ctx: Context, args: Args.GetPolymorphicBaseType): cs.Type<Builder> | undefined {
    const { schema } = args;
    if (!schema) return undefined;
    const reference = getSchemaReference(schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
    for (const base of reference.inheritedSchemas) {
      if (base.isNameGenerated) continue;
      const maps = Object.values(base.discriminator.mapping).some(
        (mapped) => mapped.id === reference.id || mapped.id === schema.id,
      );
      const type = maps ? this.getSchemaType(ctx, { schema: base }) : undefined;
      if (type && type.namespace !== null && type.name !== 'JsonElement') {
        return type;
      }
    }
    return undefined;
  }

  protected getResponseBody(ctx: Context, args: Args.GetResponseBody): CSharpClientResponseBody | undefined {
    const { response, kinds } = args;
    const options = response.contentOptions;
    if (options.length === 0) return undefined;

    const content = options.find((x) => this.getContentKind(x.type, x.schema) === 'json') ?? options[0];
    let kind = this.getContentKind(content.type, content.schema);
    if (kind === 'form') kind = 'text';
    if (kind === 'multipart') kind = 'binary';
    if (!kinds.includes(kind as CSharpClientResponseBody['kind'])) return undefined;

    const type: cs.Type<Builder> =
      kind === 'text'
        ? cs.refs.system.string()
        : kind === 'binary'
          ? cs.refs.system.stream()
          : this.getTypeUsage(ctx, {
              schema: content.schema,
              nullable: false,
              fallback: cs.refs.systemTextJson.jsonElement(),
            });
    return {
      kind: kind as CSharpClientResponseBody['kind'],
      mediaType: this.getResponseMediaType(content.type, kind),
      type,
      schema: content.schema,
    };
  }

  protected getErrors(ctx: Context, args: Args.GetErrors): CSharpClientError[] {
    const { endpoint, methodBaseName } = args;
    const classNames = new Set<string>();
    const errors: CSharpClientError[] = [];

    for (const response of endpoint.responses) {
      const key = response.statusKey;
      if (successKey.test(key) || !errorKey.test(key)) continue;

      let className = this.getErrorClassName(ctx, { methodBaseName, response });
      for (let i = 2; classNames.has(className); i++) className = `${className}${i}`;
      classNames.add(className);

      const rangeMatch = /^([1-5])XX$/i.exec(key);
      errors.push({
        statusKey: key,
        statusCode: /^\d{3}$/.test(key) ? Number(key) : undefined,
        range: rangeMatch ? [Number(rangeMatch[1]) * 100, Number(rangeMatch[1]) * 100 + 99] : undefined,
        className,
        description: response.description?.trim() || undefined,
        body: this.getResponseBody(ctx, { response, kinds: ['json', 'text'] }),
      });
    }

    return errors;
  }

  protected getErrorClassName(_ctx: Context, args: Args.GetErrorClassName): string {
    const { methodBaseName, response } = args;
    const key = response.statusKey;
    const status = /^default$/i.test(key)
      ? 'Default'
      : /^[1-5]XX$/i.test(key)
        ? `Status${key.toUpperCase()}`
        : (statusNames[Number(key)] ?? `Status${key}`);
    return `${methodBaseName}${status}Exception`;
  }

  protected getErrorStatusText(error: CSharpClientError): string {
    if (error.statusCode !== undefined) return `status code ${error.statusCode}`;
    if (error.range) return `a status code in the range ${error.statusKey.toUpperCase()}`;
    return 'a status code the operation does not document otherwise';
  }

  protected getContentKind(mediaType: string, schema: ApiSchema | undefined): CSharpClientContentKind {
    const type = mediaType.split(';')[0].trim().toLowerCase();
    if (type === '*/*' || type === 'application/*' || /^(application|text)\/([\w.-]+\+)?json$/.test(type)) {
      return 'json';
    }
    if (type === 'application/x-www-form-urlencoded') return 'form';
    if (type.startsWith('multipart/')) return 'multipart';
    if (type.startsWith('text/')) return 'text';
    if ((schema?.kind === 'string' && schema.format === 'binary') || binaryMediaType.test(type)) return 'binary';
    return schema?.kind === 'string' ? 'text' : 'binary';
  }

  /** The `Content-Type` of a request body: the declared media type, except for wildcards. */
  protected getRequestMediaType(mediaType: string, kind: CSharpClientContentKind): string {
    const type = mediaType.split(';')[0].trim();
    if (type === '*/*' || type === 'application/*') {
      return kind === 'binary' ? 'application/octet-stream' : 'application/json';
    }
    return kind === 'multipart' ? 'multipart/form-data' : type;
  }

  protected getResponseMediaType(mediaType: string, kind: CSharpClientContentKind): string {
    const type = mediaType.split(';')[0].trim();
    return type === '*/*' || type === 'application/*' ? (kind === 'json' ? 'application/json' : '*/*') : type;
  }
  // #endregion

  // #region Types
  protected getTypeUsage(ctx: Context, args: Args.GetTypeUsage<Builder>): cs.Type<Builder> {
    const { schema, nullable, fallback } = args;
    const type = this.getSchemaType(ctx, { schema });
    return type
      ? (createOverwriteProxy(type, { nullable: nullable ?? type.nullable }) as cs.Reference<Builder>)
      : (fallback ?? cs.refs.system.object({ nullable }));
  }

  protected getSchemaType(ctx: Context, args: Args.GetSchemaType): cs.Reference<SourceBuilder> | undefined {
    const { schema } = args;
    return schema && ctx.input.csharp.models[schema.id]?.type;
  }

  private nullable(type: cs.Type<Builder>, nullable: boolean): cs.Type<Builder> {
    return type instanceof cs.Reference ? (createOverwriteProxy(type, { nullable }) as cs.Reference<Builder>) : type;
  }

  private isNullable(type: cs.Type<Builder>): boolean {
    return type instanceof cs.Reference && type.nullable;
  }
  // #endregion

  // #region Names, docs and paths
  protected getClientName(ctx: Context, _args: Args.GetClientName): string {
    return `${this.getServiceTypeName(ctx)}Client`;
  }

  protected getInterfaceName(ctx: Context, _args: Args.GetInterfaceName): string {
    return `I${this.getServiceTypeName(ctx)}Client`;
  }

  protected getExtensionsName(ctx: Context, _args: Args.GetExtensionsName): string {
    return `${this.getClientName(ctx, {})}ServiceCollectionExtensions`;
  }

  private getServiceTypeName(ctx: Context): string {
    let name = toCasing(ctx.service.name, ctx.config.typeNameCasing);
    if (name === '') name = 'Default';
    return /^[0-9]/.test(name) ? `_${name}` : name;
  }

  protected getServiceDocDescription(ctx: Context, _args: Args.GetServiceDocDescription): string {
    return ctx.service.description?.trim() || `Client for the operations of the ${ctx.service.name} service.`;
  }

  private isServiceDeprecated(endpoints: CSharpClientEndpoint[]): boolean {
    return endpoints.length > 0 && endpoints.every((x) => x.endpoint.deprecated);
  }

  protected getEndpointDocDescription(ctx: Context, args: Args.GetEndpointDocDescription): string {
    const { endpoint } = args;
    const docSegments = [endpoint.summary?.trim(), endpoint.description?.trim()];

    if (ctx.config.includeSourceInDocs) {
      docSegments.push(getSourceDocLine(endpoint));
    }

    const description = docSegments
      .filter(notNullish)
      .filter((x) => x !== '')
      .join('\n\n');
    return description === '' ? `${endpoint.method.toUpperCase()} ${endpoint.path}` : description;
  }

  private getDefaultParameterDescription(parameter: CSharpClientParameter): string {
    switch (parameter.target) {
      case 'body':
        return 'The request body.';
      case 'part':
        return `The ${parameter.wireName} part of the request body.`;
      default:
        return `The ${parameter.wireName} ${parameter.target} parameter.`;
    }
  }

  protected getNamespace(ctx: Context): string {
    return ctx.namespace;
  }

  protected getFilePath(ctx: Context, args: Args.GetFilePath): string {
    return `${ctx.config.outputDir}/${ctx.config.clientsDir}/${args.name}.cs`;
  }

  /** The default base address: the first server URL of the specification, if it is an absolute URL without variables. */
  protected getBasePath(ctx: Context, _args: Args.GetBasePath): string | undefined {
    const url = modifyString(
      (ctx.service.$src ?? ctx.service.endpoints[0]?.$src)?.document.servers?.[0]?.url ?? '/',
      ctx.config.basePath,
      ctx.service,
    );
    return /^https?:\/\/[^{}\s]+$/i.test(url) ? url : undefined;
  }

  protected getEndpointPath(ctx: Context, args: Args.GetEndpointPath): string {
    const { endpoint } = args;
    return modifyString(endpoint.path, ctx.config.pathModifier, endpoint);
  }
  // #endregion
}
