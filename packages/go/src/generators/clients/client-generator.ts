import {
  type ApiParameter,
  type ApiResponse,
  type ApiSchema,
  type AppendValue,
  appendValueGroup,
  type AppendValueGroup,
  builderTemplate as s,
  type MaybePromise,
  notNullish,
  SourceBuilder,
} from '@goast/core';

import { go } from '../../ast/index.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import {
  getSourceDocLine,
  isJsonMediaType,
  modifyString,
  toGoComment,
  toGoFileName,
  toGoStringLiteral,
} from '../../utils.ts';
import { GoFileGenerator } from '../file-generator.ts';
import { getGoBodyKind, getGoObjectSchema, isGoFileSchema, resolveGoSchema } from '../schema-utils.ts';
import type { DefaultGoClientGeneratorArgs as Args } from './index.ts';
import type { GoClientGeneratorContext, GoClientGeneratorOutput } from './models.ts';
import type {
  GoClientBody,
  GoClientErrorResponse,
  GoClientFormField,
  GoClientOperation,
  GoClientParameter,
  GoClientSuccess,
  GoClientSuccessBody,
} from './operation.ts';

type Context = GoClientGeneratorContext;
type Output = GoClientGeneratorOutput;
type Builder = GoFileBuilder;
type Type = go.Type<SourceBuilder>;

const urlValues = go.reference.factory('Values', 'net/url');
const multipartWriter = go.reference.factory('Writer', 'mime/multipart');
const errorsNew = go.reference.factory('New', 'errors');

/** The kinds of request body, in the order the client prefers them when an operation declares several. */
const bodyKindPreference: GoClientBody['kind'][] = ['json', 'form', 'multipart', 'text', 'raw'];

/** Names the generated method bodies use for themselves, so no parameter may be named like one of them. */
const reservedLocalNames = [
  'ctx',
  'body',
  'params',
  'opts',
  'c',
  'r',
  'resp',
  'err',
  'values',
  'value',
  'w',
  'v',
  'status',
  // Predeclared identifiers and packages that the code of a method refers to.
  'string',
  'any',
  'error',
  'nil',
  'true',
  'false',
  'new',
  'len',
  'url',
  'multipart',
  'context',
  'http',
  'io',
  'errors',
  'fmt',
  'json',
  'time',
];

/** The qualifiers of the packages the models use, by the models of a run. */
const modelQualifiers = new WeakMap<object, Set<string>>();

/**
 * Builds a block: the header, a space, and the statements between braces, one level indented. Without a header it is a
 * bare block, which scopes the variables of its statements.
 * @param header What comes before the opening brace, e.g. `if err != nil`.
 * @param statements The statements of the block.
 * @returns The value to append.
 */
function block(header: AppendValue<Builder>, statements: AppendValue<Builder>[]): AppendValue<Builder> {
  return (b: Builder) => {
    if (header !== '') b.append(header, ' ');
    b.parenthesize('{}', appendValueGroup<Builder>(statements, '\n'), { multiline: true });
  };
}

/**
 * Builds a `switch`: the header, and the cases between braces. Like `gofmt` writes it, the labels are not indented
 * relative to the `switch`, and their statements are.
 * @param header What comes before the opening brace, e.g. `switch resp.StatusCode`.
 * @param cases The cases, with their labels (e.g. `case 200:`) and statements.
 * @returns The value to append.
 */
function switchBlock(
  header: AppendValue<Builder>,
  cases: { label: string; statements: AppendValue<Builder>[] }[],
): AppendValue<Builder> {
  return (b: Builder) => {
    b.appendLine(header, ' {');
    for (const { label, statements } of cases) {
      b.appendLine(label);
      b.indent(appendValueGroup<Builder>(statements, '\n'));
      b.ensureCurrentLineEmpty();
    }
    b.append('}');
  };
}

/**
 * Generates the client code of one service. Implement it to replace the generation of a service's client code.
 * @template TOutput The type of the result, which describes the file that was written.
 * @see DefaultGoClientGenerator
 */
export interface GoClientGenerator<TOutput extends Output = Output> {
  /**
   * Writes the client file of the service and describes it.
   * @param ctx The context of the service to generate.
   * @returns The output that describes the written file, or a promise that resolves to it.
   */
  generate(ctx: Context): MaybePromise<TOutput>;
}

/**
 * The default generator of the client code of one service (tag). It writes a single Go file into the package directory
 * of the service, named after the service with a `_client.go` suffix. The file declares a `<Name>Client` type with a
 * method per operation, a `New<Name>Client` constructor, and the constant `<Name>ClientDefaultBaseURL`. For an operation
 * with optional parameters it declares a `<Operation>Params` struct, and for a multipart body a `<Operation>Form`
 * struct. An operation with several tags has a method in each client, but its structs are declared only by the first
 * service that has it.
 *
 * Each part is built by a protected method, so subclasses can change one part at a time.
 * @see GoClientGenerator
 */
export class DefaultGoClientGenerator extends GoFileGenerator<Context, Output> implements GoClientGenerator {
  /**
   * Writes the client file of the service, and returns references to its client type and constructor.
   * @param ctx The context of the service to generate.
   * @returns The references to the client type as `client`, and to the constructor as `constructor`.
   */
  public generate(ctx: Context): MaybePromise<Output> {
    const pkg = ctx.package;
    const registry = this.getIdentifierRegistry(ctx, pkg);
    const serviceName = this.toExportedName(ctx, ctx.service.name, 'Default');
    const clientName = registry.reserve(`${serviceName}Client`, `client:${ctx.service.id}`);
    const constructorName = registry.reserve(`New${clientName}`, `client-constructor:${ctx.service.id}`);
    const baseUrlName = registry.reserve(`${clientName}DefaultBaseURL`, `client-base-url:${ctx.service.id}`);

    const files = this.getIdentifierRegistry(ctx, { ...pkg, importPath: `${pkg.importPath}\u0000files` });
    const fileName = `${files.reserve(toGoFileName(`${ctx.service.name}_client`).replace(/\.go$/, ''), `client:${ctx.service.id}`)}.go`;
    const filePath = `${pkg.dir}/${fileName}`;

    console.log(`Generating client ${ctx.service.id} [${clientName}] to ${filePath}...`);
    const operations = ctx.service.endpoints.map((endpoint) => this.getOperation(ctx, { endpoint }));

    const builder = new GoFileBuilder(pkg.name, pkg.importPath, ctx.config);
    builder.append(this.getFileContent(ctx, { clientName, constructorName, baseUrlName, operations }));
    builder.writeToFile(filePath);

    return {
      client: go.reference(clientName, pkg.importPath, { packageName: pkg.name }),
      constructor: go.reference(constructorName, pkg.importPath, { packageName: pkg.name }),
    };
  }

  /**
   * Builds the content of the client file: the default base URL, the client type, its constructor, and for each
   * operation the structs that no earlier service has declared, followed by its method. The operations are marked as
   * declared, so each one's structs are declared once.
   * @param ctx The context of the service to generate.
   * @param args The names of the client type, its constructor and the base URL constant, and the operations.
   * @returns The content of the file.
   */
  protected getFileContent(ctx: Context, args: Args.GetFileContent): AppendValueGroup<Builder> {
    const { clientName, constructorName, baseUrlName, operations } = args;

    // An operation with several tags has a method in every client, but its structs are declared by the first one only.
    const undeclared = new Set(operations.filter((x) => !x.declared));
    undeclared.forEach((x) => (x.declared = true));

    return appendValueGroup<Builder>(
      [
        this.getBaseUrlConstant(ctx, { clientName, constructorName, baseUrlName }),
        this.getClientStruct(ctx, { clientName }),
        this.getConstructor(ctx, { clientName, constructorName, baseUrlName }),
        ...operations.flatMap((operation) => [
          ...(undeclared.has(operation) ? this.getOperationDeclarations(ctx, { operation }) : []),
          this.getMethod(ctx, { clientName, operation }),
        ]),
      ],
      '\n',
    );
  }

  // #region Client
  /**
   * Builds the constant holding the base URL a client uses when its constructor gets none.
   * @param ctx The context of the service to generate.
   * @param args The names of the client type, its constructor and the constant.
   * @returns The declaration of the constant.
   */
  protected getBaseUrlConstant(ctx: Context, args: Args.GetBaseUrlConstant): AppendValue<Builder> {
    const { clientName, constructorName, baseUrlName } = args;
    const doc = `${baseUrlName} is the base URL a ${clientName} uses when ${constructorName} gets none.`;
    return `${toGoComment(doc)}\nconst ${baseUrlName} = ${toGoStringLiteral(this.getBaseUrl(ctx, {}))}\n`;
  }

  /**
   * Gets the default base URL of the service: the first server URL of the API description, with the variables of the
   * URL replaced by their default values (a variable without a default is kept as it is), after the `baseUrl` option.
   * It is empty when the description has no server and the option does not set one.
   * @param ctx The context of the service to generate.
   * @param _args The arguments of the call, none of which are used.
   * @returns The base URL, or an empty string if there is none.
   */
  protected getBaseUrl(ctx: Context, _args: Args.GetBaseUrl): string {
    const server = (ctx.service.$src ?? ctx.service.endpoints[0]?.$src)?.document.servers?.[0];
    const url = (server?.url ?? '').replace(
      /\{([^{}]+)\}/g,
      (variable, name: string) => server?.variables?.[name]?.default ?? variable,
    );
    return modifyString(url, ctx.config.baseUrl, ctx.service);
  }

  /**
   * Builds the declaration of the client type, which holds the runtime client.
   * @param ctx The context of the service to generate.
   * @param args The name of the client type.
   * @returns The declaration of the client type.
   */
  protected getClientStruct(ctx: Context, args: Args.GetClientStruct): go.TypeDeclaration<Builder> {
    const { clientName } = args;
    return go.typeDeclaration(clientName, go.struct([go.field('c', go.pointer(ctx.runtimeNames.client))]), {
      doc: go.doc(
        [`${clientName} calls the operations of the ${ctx.service.name} API.`, ctx.service.description?.trim()]
          .filter(Boolean)
          .join('\n\n'),
      ),
    });
  }

  /**
   * Builds the constructor of the client. It takes the base URL, which defaults to the constant when empty, and the
   * options of the client.
   * @param ctx The context of the service to generate.
   * @param args The names of the client type, the constructor and the base URL constant.
   * @returns The declaration of the constructor.
   */
  protected getConstructor(ctx: Context, args: Args.GetConstructor): go.Function<Builder> {
    const { clientName, constructorName, baseUrlName } = args;
    return go.function(constructorName, {
      doc: go.doc(
        `${constructorName} creates a client for the ${ctx.service.name} API. baseURL is prepended to the path of every operation; when it is\nempty, ${baseUrlName} is used.`,
      ),
      parameters: [
        go.parameter('baseURL', go.refs.string()),
        go.parameter('opts', ctx.runtimeNames.ClientOption, { variadic: true }),
      ],
      results: [go.parameter(null, go.pointer(clientName))],
      body: `return &${clientName}{c: ${ctx.runtimeNames.newClient}(baseURL, ${baseUrlName}, opts)}`,
    });
  }
  // #endregion

  // #region Operation
  /**
   * Plans an operation of an endpoint: its method name, the parameters the client sends and how, its body, its success
   * and error responses. The plan is computed once per run and cached in the context, so that every service the endpoint
   * belongs to agrees on its names. Parameters whose schema cannot be encoded are kept as skipped, so the method can
   * still document them.
   * @param ctx The context of the service to generate.
   * @param args The endpoint of the operation.
   * @returns The plan of the operation.
   */
  protected getOperation(ctx: Context, args: Args.GetOperation): GoClientOperation {
    const { endpoint } = args;
    const existing = ctx.operations.get(endpoint.id);
    if (existing) return existing;

    const registry = this.getIdentifierRegistry(ctx, ctx.package);
    const name = this.toExportedName(ctx, endpoint.name, 'Operation');

    // The parameters the client can send, and the ones it cannot.
    const skippedParameters: ApiParameter[] = [];
    const supported = new Map<ApiParameter, Omit<GoClientParameter, 'name'>>();
    for (const parameter of this.getParameters(ctx, { endpoint })) {
      const encoding = this.getParameterEncoding(ctx, { parameter });
      if (encoding) supported.set(parameter, { parameter, ...encoding });
      else skippedParameters.push(parameter);
    }

    const path = modifyString(endpoint.path, ctx.config.pathModifier, endpoint);
    const pathNames = [...path.matchAll(/\{([^{}]+)\}/g)].map((x) => x[1]);
    // A path parameter the path does not contain can never be sent, and a variable of the path without a parameter
    // stays literal text.
    const pathParameters = [...new Set(pathNames)]
      .map((x) => [...supported.keys()].find((p) => p.target === 'path' && p.name === x))
      .filter(notNullish);
    const required = [...supported.keys()].filter((x) => x.target !== 'path' && x.required);
    const optional = [...supported.keys()].filter((x) => x.target !== 'path' && !x.required);

    const positional = [...pathParameters, ...required];
    const positionalNames = this.toUniqueNames(
      ctx,
      positional.map((x) => this.toUnexportedName(ctx, x.name, 'param')),
      this.getReservedNames(ctx),
    );
    const fieldNames = this.toUniqueNames(
      ctx,
      optional.map((x) => this.toExportedName(ctx, x.name, 'Param')),
    );
    const named = new Map<ApiParameter, GoClientParameter>();
    positional.forEach((x, i) => named.set(x, { ...supported.get(x)!, name: positionalNames[i] }));
    optional.forEach((x, i) => named.set(x, { ...supported.get(x)!, name: fieldNames[i] }));

    const { body, formTypeName } = this.getBody(ctx, { endpoint, name });

    const operation: GoClientOperation = {
      endpoint,
      name,
      paramsTypeName:
        optional.length > 0
          ? registry.reserveFirst([`${name}Params`, `${name}Parameters`], `client-params:${endpoint.id}`)
          : null,
      formTypeName,
      pathParts: this.getPathParts(ctx, { path, parameters: [...named.values()] }),
      positional: positional.map((x) => named.get(x)!),
      optional: optional.map((x) => named.get(x)!),
      skippedParameters,
      body,
      success: this.getSuccess(ctx, { endpoint }),
      errors: this.getErrorResponses(ctx, { endpoint }),
      declared: false,
    };
    ctx.operations.set(endpoint.id, operation);
    return operation;
  }

  /**
   * Builds the declarations of an operation, in order: the params struct if it has optional parameters, and the struct
   * of a multipart body.
   * @param ctx The context of the service to generate.
   * @param args The operation to declare.
   * @returns The declarations, each as one value to append to the file.
   */
  protected getOperationDeclarations(ctx: Context, args: Args.GetOperationDeclarations): AppendValue<Builder>[] {
    const { operation } = args;
    return [
      operation.paramsTypeName !== null ? this.getParamsStruct(ctx, { operation }) : null,
      operation.formTypeName !== null ? this.getFormStruct(ctx, { operation }) : null,
    ].filter(notNullish);
  }

  /**
   * Gets the parameters the client can send: those in the path, the query, a header or a cookie. Parameters of other
   * locations are not considered.
   * @param _ctx The context of the service to generate.
   * @param args The endpoint whose parameters are taken.
   * @returns The parameters of the endpoint in those locations.
   */
  protected getParameters(_ctx: Context, args: Args.GetParameters): ApiParameter[] {
    return args.endpoint.parameters.filter(
      (x) => x.target === 'path' || x.target === 'query' || x.target === 'header' || x.target === 'cookie',
    );
  }

  /**
   * Gets how a parameter is encoded, or `null` if its schema cannot be encoded. It accepts what the server decodes: a
   * parameter cannot hold JSON, so its schema must be a primitive, an enum of one, or a list of primitives.
   * @param ctx The context of the service to generate.
   * @param args The parameter to encode.
   * @returns The type of the parameter, how its values are formatted, and whether it is an array, or `null` if the
   *   parameter is not supported.
   */
  protected getParameterEncoding(
    ctx: Context,
    args: Args.GetParameterEncoding,
  ): Pick<GoClientParameter, 'type' | 'format' | 'itemFormat' | 'array'> | null {
    const schema = this.resolveSchema(ctx, { schema: args.parameter.schema });
    const array = schema?.kind === 'array';
    const itemSchema = array ? this.resolveSchema(ctx, { schema: schema.items }) : schema;
    const itemType = itemSchema ? this.getSchemaType(ctx, { schema: itemSchema }) : go.refs.string();
    const formats = this.getFormatFunction(ctx, { schema: itemSchema, type: itemType });
    if (!formats) return null;
    return { type: array ? go.slice(itemType) : itemType, ...formats, array };
  }

  /**
   * Gets the runtime function formatting the value of a primitive schema as text: `formatTime` for a string held in a
   * `time.Time`, `formatBytes` for a string held in a byte slice, `formatString` for other strings, and `formatInt`,
   * `formatFloat` or `formatBool` for integers, numbers and booleans. A value without a schema is a string.
   * @param ctx The context of the service to generate.
   * @param args The schema of the value, and the type it is held in.
   * @returns The function, as it is called and as it is passed to `formatAll` (with type arguments), or `null` if the
   *   schema is not a primitive.
   */
  protected getFormatFunction(
    ctx: Context,
    args: Args.GetFormatFunction,
  ): { format: AppendValue<Builder>; itemFormat: AppendValue<Builder> } | null {
    const { schema, type } = args;
    const names = ctx.runtimeNames;
    const generic = (name: string) => ({ format: name, itemFormat: s<Builder>`${name}[${type}]` });

    if (!schema) return generic(names.formatString);
    switch (schema.kind) {
      case 'string':
        if (go.refs.time.time.matches(type)) return { format: names.formatTime, itemFormat: names.formatTime };
        if (type instanceof go.Slice) return { format: names.formatBytes, itemFormat: names.formatBytes };
        return generic(names.formatString);
      case 'integer':
        return generic(names.formatInt);
      case 'number':
        return generic(names.formatFloat);
      case 'boolean':
        return generic(names.formatBool);
      default:
        return null;
    }
  }

  /**
   * Splits the path of an operation into literal text and path parameters. Text is made safe for a URL path with the
   * rule the servers use for the literal segments of a route: characters other than the unreserved ones, the
   * sub-delimiters, `:`, `@`, `%` and `/` are percent-encoded. A variable without a supported parameter stays text.
   * @param _ctx The context of the service to generate.
   * @param args The path after the path modifier, and the named parameters of the operation.
   * @returns The parts of the path, in order.
   */
  protected getPathParts(_ctx: Context, args: Args.GetPathParts): GoClientOperation['pathParts'] {
    const parts: GoClientOperation['pathParts'] = [];
    const text = (value: string) => {
      const escaped = value.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@%/]/g, (x) => encodeURIComponent(x));
      if (typeof parts.at(-1) === 'string') parts[parts.length - 1] += escaped;
      else if (escaped) parts.push(escaped);
    };

    for (const part of args.path.split(/(\{[^{}]+\})/)) {
      const variable = /^\{([^{}]+)\}$/.exec(part);
      const parameter = variable
        ? args.parameters.find((x) => x.parameter.target === 'path' && x.parameter.name === variable[1])
        : undefined;
      if (parameter) parts.push(parameter);
      else text(part);
    }
    return parts;
  }

  /**
   * Gets the names that no parameter of a method may have, because the generated code uses them itself: the locals and
   * arguments of the method, the identifiers of the runtime, and the names of the packages the code refers to, which
   * include those of the models.
   * @param ctx The context of the service to generate.
   * @returns The reserved names.
   */
  protected getReservedNames(ctx: Context): Set<string> {
    let qualifiers = modelQualifiers.get(ctx.input);
    if (!qualifiers) {
      qualifiers = new Set<string>();
      for (const model of Object.values(ctx.input.go.models)) {
        const code = SourceBuilder.build((b) => go.writeNode(b, model.type));
        for (const [, qualifier] of code.matchAll(/\b([a-z][A-Za-z0-9_]*)\.[A-Z]/g)) qualifiers.add(qualifier);
      }
      modelQualifiers.set(ctx.input, qualifiers);
    }
    return new Set([...reservedLocalNames, ...Object.values(ctx.runtimeNames), ...qualifiers]);
  }
  // #endregion

  // #region Method
  /**
   * Builds the params struct of an operation, with a field for each optional query, header and cookie parameter. A
   * field is a pointer, so that `nil` means the parameter is not sent, unless its type is nilable already (a slice).
   * @param _ctx The context of the service to generate.
   * @param args The operation whose params struct is built.
   * @returns The declaration of the params struct.
   */
  protected getParamsStruct(_ctx: Context, args: Args.GetParamsStruct): go.TypeDeclaration<Builder> {
    const { operation } = args;
    const name = operation.paramsTypeName!;
    return go.typeDeclaration(
      name,
      go.struct(
        operation.optional.map((x) =>
          go.field(x.name, this.isNilable(x.type) ? x.type : go.pointer(x.type), {
            doc: go.doc(x.parameter.description, { deprecated: x.parameter.deprecated }),
          }),
        ),
      ),
      { doc: go.doc(`${name} holds the optional parameters of ${operation.name}. A nil field is not sent.`) },
    );
  }

  /**
   * Builds the method of an operation. Its documentation is the summary and description of the endpoint, followed by a
   * line for each parameter that is not sent.
   * @param ctx The context of the service to generate.
   * @param args The name of the client type and the operation.
   * @returns The declaration of the method.
   */
  protected getMethod(ctx: Context, args: Args.GetMethod): go.Function<Builder> {
    const { clientName, operation } = args;
    return go.function(operation.name, {
      doc: go.doc(this.getMethodDocText(ctx, { operation }), { deprecated: operation.endpoint.deprecated }),
      receiver: go.parameter('c', go.pointer(clientName)),
      ...this.getMethodSignature(ctx, { operation }),
      body: this.getMethodBody(ctx, { operation }),
    });
  }

  /**
   * Gets the parameters and results of the method of an operation. The parameters are the context, the path
   * parameters, the required query, header and cookie parameters, the body, the params struct and the request options.
   * The results are the body of the success response and an error, or only an error when no success response has a
   * body.
   * @param ctx The context of the service to generate.
   * @param args The operation of the method.
   * @returns The parameters and the results.
   */
  protected getMethodSignature(
    ctx: Context,
    args: Args.GetMethodSignature,
  ): { parameters: go.Parameter<Builder>[]; results: go.Parameter<Builder>[] } {
    const { operation } = args;
    return {
      parameters: [
        go.parameter('ctx', go.refs.context.context()),
        ...operation.positional.map((x) => go.parameter(x.name, x.type)),
        operation.body
          ? go.parameter(
              'body',
              operation.body.optional && !this.isNilable(operation.body.type)
                ? go.pointer(operation.body.type)
                : operation.body.type,
            )
          : null,
        operation.paramsTypeName !== null ? go.parameter('params', go.pointer(operation.paramsTypeName)) : null,
        go.parameter('opts', ctx.runtimeNames.RequestOption, { variadic: true }),
      ].filter(notNullish),
      results: [
        operation.success.type ? go.parameter(null, operation.success.type) : null,
        go.parameter(null, go.refs.error()),
      ].filter(notNullish),
    };
  }

  /**
   * Builds the documentation of the method of an operation: the summary and description of the endpoint (or a line
   * naming the request if it has neither), and a line for each parameter that is not sent, because its schema is not
   * supported.
   * @param ctx The context of the service to generate.
   * @param args The operation of the method.
   * @returns The documentation text.
   */
  protected getMethodDocText(ctx: Context, args: Args.GetMethodDocText): string {
    const { operation } = args;
    const skipped = operation.skippedParameters.map(
      (x) =>
        `The ${x.target} parameter ${toGoStringLiteral(x.name)} is not sent, because its schema is not supported. Set it with a RequestOption.`,
    );
    return [
      this.getEndpointDocText(ctx, { endpoint: operation.endpoint }) ||
        `${operation.name} sends ${operation.endpoint.method.toUpperCase()} ${operation.endpoint.path}.`,
      skipped.join('\n'),
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  /**
   * Builds the body of the method of an operation: the statements building the request, followed by the statements
   * sending it and decoding the response.
   * @param ctx The context of the service to generate.
   * @param args The operation of the method.
   * @returns The statements of the method.
   */
  protected getMethodBody(ctx: Context, args: Args.GetMethodBody): AppendValue<Builder> {
    const { operation } = args;
    return appendValueGroup<Builder>(
      [...this.getRequestStatements(ctx, { operation }), ...this.getResponseStatements(ctx, { operation })],
      '\n',
    );
  }

  /**
   * Gets the values a method returns: the zero value of the success type, if there is one, and the error.
   * @param ctx The context of the service to generate.
   * @param args The operation of the method, and the expression of the error.
   * @returns The comma-separated values of a return statement.
   */
  protected getZeroValues(ctx: Context, args: Args.GetZeroValues): AppendValue<Builder> {
    const { operation, error } = args;
    return operation.success.type
      ? s<Builder>`${this.getZeroValue(ctx, { type: operation.success.type, schema: operation.success.byStatus[0]?.schema })}, ${error}`
      : error;
  }

  /**
   * Gets the zero value of a type as Go code: `nil` for a pointer, slice, map, interface or `url.Values`, a literal for
   * strings, booleans and numbers, `time.Time{}` for a time, and for any other type a literal if its schema is a
   * primitive (the type is an enum then), or else `*new(T)`, e.g. for a model.
   * @param ctx The context of the service to generate.
   * @param args The type, and its schema if there is one.
   * @returns The zero value.
   */
  protected getZeroValue(ctx: Context, args: Args.GetZeroValue): AppendValue<Builder> {
    const { type } = args;
    if (this.isNilable(type)) return 'nil';
    if (go.refs.string.matches(type)) return '""';
    if (go.refs.bool.matches(type)) return 'false';
    const numbers = [go.refs.int, go.refs.int32, go.refs.int64, go.refs.float32, go.refs.float64, go.refs.byte];
    if (numbers.some((x) => x.matches(type))) return '0';
    if (go.refs.time.time.matches(type)) return s<Builder>`${type}{}`;

    switch (this.resolveSchema(ctx, { schema: args.schema })?.kind) {
      case 'string':
        return '""';
      case 'integer':
      case 'number':
        return '0';
      case 'boolean':
        return 'false';
      default:
        return s<Builder>`*new(${type})`;
    }
  }

  /**
   * Checks whether `nil` is a value of a type. Besides the types `go.isNilable` knows, `url.Values` is a map.
   * @param type The type to check.
   * @returns `true` if the type is nilable.
   */
  protected isNilable(type: Type): boolean {
    return go.isNilable(type) || urlValues.matches(type);
  }
  // #endregion

  // #region Request
  /**
   * Builds the statements creating the request of an operation: `newRequest` with the method and the path, a statement
   * for each required query, header and cookie parameter, one block for the optional parameters that are set in the
   * params struct, and the body.
   * @param ctx The context of the service to generate.
   * @param args The operation of the request.
   * @returns The statements.
   */
  protected getRequestStatements(ctx: Context, args: Args.GetRequestStatements): AppendValue<Builder>[] {
    const { operation } = args;
    const statements: AppendValue<Builder>[] = [
      s<Builder>`r := c.c.newRequest(${toGoStringLiteral(operation.endpoint.method.toUpperCase())}, ${this.getPathExpression(ctx, { operation })})`,
    ];

    for (const parameter of operation.positional.filter((x) => x.parameter.target !== 'path')) {
      statements.push(this.getParameterStatement(ctx, { parameter, expression: parameter.name }));
    }
    if (operation.optional.length > 0) {
      statements.push(
        block(
          'if params != nil',
          operation.optional.map((parameter) => {
            const field = `params.${parameter.name}`;
            return block(`if ${field} != nil`, [
              this.getParameterStatement(ctx, {
                parameter,
                expression: this.isNilable(parameter.type) ? field : `*${field}`,
              }),
            ]);
          }),
        ),
      );
    }
    if (operation.body) statements.push(this.getBodyStatement(ctx, { operation }));
    return statements;
  }

  /**
   * Builds the expression for the path of an operation: its literal text and the calls of `pathParam` for its path
   * parameters, joined with `+`.
   * @param ctx The context of the service to generate.
   * @param args The operation whose path is built.
   * @returns The expression of the path.
   */
  protected getPathExpression(ctx: Context, args: Args.GetPathExpression): AppendValue<Builder> {
    const parts = args.operation.pathParts.map((part) => {
      if (typeof part === 'string') return toGoStringLiteral(part);
      const style = part.parameter.style ?? 'simple';
      const explode = part.parameter.explode ?? style === 'form';
      return s<Builder>`${ctx.runtimeNames.pathParam}(${toGoStringLiteral(part.parameter.name)}, ${toGoStringLiteral(style)}, ${String(explode)}, ${String(part.array)}, ${this.getParameterValues(ctx, { parameter: part, expression: part.name })})`;
    });
    return parts.length > 0 ? appendValueGroup<Builder>(parts, '+') : '""';
  }

  /**
   * Builds the expression for the values of a parameter, as the runtime functions take them: a `[]string`. An array is
   * formatted with `formatAll`, and any other value is the only item of the slice.
   * @param ctx The context of the service to generate.
   * @param args The parameter, and the expression of its Go value.
   * @returns The expression of the values.
   */
  protected getParameterValues(ctx: Context, args: Args.GetParameterValues): AppendValue<Builder> {
    const { parameter, expression } = args;
    return parameter.array
      ? s<Builder>`${ctx.runtimeNames.formatAll}(${expression}, ${parameter.itemFormat})`
      : s<Builder>`[]string{${parameter.format}(${expression})}`;
  }

  /**
   * Builds the statement adding a query, header or cookie parameter to the request. The style of a query parameter is
   * `form` by default, and `explode` is on by default for that style only.
   * @param ctx The context of the service to generate.
   * @param args The parameter, and the expression of its Go value.
   * @returns The statement.
   */
  protected getParameterStatement(ctx: Context, args: Args.GetParameterStatement): AppendValue<Builder> {
    const { parameter, expression } = args;
    const name = toGoStringLiteral(parameter.parameter.name);
    const values = this.getParameterValues(ctx, { parameter, expression });

    switch (parameter.parameter.target) {
      case 'query': {
        const style = parameter.parameter.style ?? 'form';
        const explode = parameter.parameter.explode ?? style === 'form';
        return s<Builder>`r.query(${name}, ${toGoStringLiteral(style)}, ${String(explode)}, ${String(parameter.array)}, ${values})`;
      }
      case 'header':
        return s<Builder>`r.header(${name}, ${values})`;
      case 'cookie':
        return s<Builder>`r.cookie(${name}, ${values})`;
      default:
        return '';
    }
  }

  /**
   * Builds the statement setting the body of the request, by the kind of the body. An optional body is set only when
   * the argument is not `nil`.
   * @param ctx The context of the service to generate.
   * @param args The operation whose body is set.
   * @returns The statement.
   */
  protected getBodyStatement(ctx: Context, args: Args.GetBodyStatement): AppendValue<Builder> {
    const { operation } = args;
    const body = operation.body!;
    const fail = s<Builder>`return ${this.getZeroValues(ctx, { operation, error: 'err' })}`;
    const dereferenced = body.optional && !this.isNilable(body.type) ? '*body' : 'body';

    let statement: AppendValue<Builder>;
    switch (body.kind) {
      case 'json':
        statement = block('if err := r.jsonBody(body); err != nil', [fail]);
        break;
      case 'text':
        statement = s<Builder>`r.textBody(${toGoStringLiteral(body.content.type)}, ${dereferenced})`;
        break;
      case 'raw': {
        const mediaType = body.content.type.includes('*') ? 'application/octet-stream' : body.content.type;
        statement = s<Builder>`r.rawBody(${toGoStringLiteral(mediaType)}, body)`;
        break;
      }
      case 'form':
        statement =
          body.fields === null
            ? s<Builder>`r.formBody(body)`
            : appendValueGroup<Builder>(
                [
                  s<Builder>`values := ${urlValues()}{}`,
                  ...body.fields.map((field) =>
                    this.getFormFieldStatement(ctx, { operation, field, multipart: false }),
                  ),
                  s<Builder>`r.formBody(values)`,
                ],
                '\n',
              );
        break;
      case 'multipart':
        statement = this.getMultipartStatement(ctx, { operation });
        break;
    }
    return body.optional ? block('if body != nil', [statement]) : statement;
  }

  /**
   * Builds the statement writing a multipart body: a call of `multipartBody` with a function that writes each field of
   * the struct as a part. A body without a struct is a `url.Values`, of which every value is written as a part.
   * @param ctx The context of the service to generate.
   * @param args The operation whose multipart body is written.
   * @returns The statement.
   */
  protected getMultipartStatement(ctx: Context, args: Args.GetMultipartStatement): AppendValue<Builder> {
    const { operation } = args;
    const fields = operation.body?.fields ?? null;
    const statements: AppendValue<Builder>[] =
      fields === null
        ? [
            block('for name, vs := range body', [
              block('for _, v := range vs', [
                block(s<Builder>`if err := ${ctx.runtimeNames.writeFormField}(w, name, v); err != nil`, ['return err']),
              ]),
            ]),
          ]
        : fields.map((field) => this.getFormFieldStatement(ctx, { operation, field, multipart: true }));

    return (b: Builder) => {
      b.append('if err := r.multipartBody(func(w ', go.pointer(multipartWriter()), ') error ');
      b.parenthesize('{}', appendValueGroup<Builder>([...statements, 'return nil'], '\n'), { multiline: true });
      b.append('); err != nil ');
      b.parenthesize('{}', s<Builder>`return ${this.getZeroValues(ctx, { operation, error: 'err' })}`, {
        multiline: true,
      });
    };
  }

  /**
   * Builds the statement adding one field of a form or multipart body, which is read from the struct `body`. A field
   * that is a pointer or nilable is added only when it is set, and a required file that is missing is an error. A
   * value that is sent as JSON text is formatted first, which can fail.
   * @param ctx The context of the service to generate.
   * @param args The operation, the field, and whether the field is written as a part of a multipart body, or else added
   *   to the `values` of a form.
   * @returns The statement.
   */
  protected getFormFieldStatement(ctx: Context, args: Args.GetFormFieldStatement): AppendValue<Builder> {
    const { operation, field, multipart } = args;
    const names = ctx.runtimeNames;
    const name = toGoStringLiteral(field.name);
    const ref = `body.${field.fieldName}`;
    const pointer = field.type instanceof go.Pointer;
    const nilable = pointer || this.isNilable(field.type);
    const fail = multipart ? 'return err' : s<Builder>`return ${this.getZeroValues(ctx, { operation, error: 'err' })}`;
    const add = (value: AppendValue<Builder>, method: 'Set' | 'Add') =>
      multipart
        ? block(s<Builder>`if err := ${names.writeFormField}(w, ${name}, ${value}); err != nil`, [fail])
        : s<Builder>`values.${method}(${name}, ${value})`;
    const guarded = (statements: AppendValue<Builder>[]) =>
      nilable ? block(`if ${ref} != nil`, statements) : block('', statements);

    switch (field.kind) {
      case 'file': {
        const write = block(s<Builder>`if err := ${names.writeFormFile}(w, ${name}, *${ref}); err != nil`, [fail]);
        return field.required
          ? appendValueGroup<Builder>(
              [
                block(`if ${ref} == nil`, [
                  s<Builder>`return ${errorsNew()}(${toGoStringLiteral(`missing required file "${field.name}"`)})`,
                ]),
                write,
              ],
              '\n',
            )
          : block(`if ${ref} != nil`, [write]);
      }
      case 'files':
        return block(`for _, f := range ${ref}`, [
          block(s<Builder>`if err := ${names.writeFormFile}(w, ${name}, f); err != nil`, [fail]),
        ]);
      case 'value': {
        const statement = add(s<Builder>`${field.format}(${pointer ? '*' : ''}${ref})`, 'Set');
        return nilable ? block(`if ${ref} != nil`, [statement]) : statement;
      }
      case 'array':
        return block(s<Builder>`for _, v := range ${names.formatAll}(${ref}, ${field.itemFormat})`, [add('v', 'Add')]);
      case 'json':
        return guarded([
          s<Builder>`value, err := ${names.formatJSON}(${ref})`,
          block('if err != nil', [fail]),
          add('value', 'Set'),
        ]);
      case 'jsons':
        return block(`for _, item := range ${ref}`, [
          s<Builder>`value, err := ${names.formatJSON}(item)`,
          block('if err != nil', [fail]),
          add('value', 'Add'),
        ]);
    }
  }
  // #endregion

  // #region Request body
  /**
   * Gets the request body the client sends: of the media types the request body declares, the first one in the order
   * JSON, URL-encoded form, multipart, text, other. The body is optional unless the API description requires it.
   * @param ctx The context of the service to generate.
   * @param args The endpoint and name of the operation.
   * @returns The body, or `null` if the endpoint has none, and the name of the struct of a multipart body, or `null`.
   */
  protected getBody(ctx: Context, args: Args.GetBody): { body: GoClientBody | null; formTypeName: string | null } {
    const { endpoint, name } = args;
    const candidates = (endpoint.requestBody?.content ?? [])
      .map((content) => ({ content, kind: getGoBodyKind(content.type) }))
      .sort((a, b) => bodyKindPreference.indexOf(a.kind) - bodyKindPreference.indexOf(b.kind));
    if (candidates.length === 0) return { body: null, formTypeName: null };

    const { content, kind } = candidates[0];
    const optional = !(endpoint.requestBody?.required ?? false);

    switch (kind) {
      case 'json':
        return {
          body: {
            content,
            kind,
            type: content.schema ? this.getSchemaType(ctx, { schema: content.schema }) : go.refs.any(),
            optional,
            fields: null,
          },
          formTypeName: null,
        };
      case 'text':
        return { body: { content, kind, type: go.refs.string(), optional, fields: null }, formTypeName: null };
      case 'raw':
        return { body: { content, kind, type: go.refs.io.reader(), optional, fields: null }, formTypeName: null };
      case 'form': {
        const { type, fields } = this.getFormBody(ctx, { content });
        return { body: { content, kind, type, optional, fields }, formTypeName: null };
      }
      case 'multipart': {
        const object = this.getObjectSchema(ctx, { schema: content.schema });
        if (!object || object.properties.size === 0) {
          return { body: { content, kind, type: urlValues(), optional, fields: null }, formTypeName: null };
        }
        const formTypeName = this.getIdentifierRegistry(ctx, ctx.package).reserveFirst(
          [`${name}Form`, `${name}FormBody`],
          `client-form:${endpoint.id}`,
        );
        return {
          body: {
            content,
            kind,
            type: go.reference(formTypeName),
            optional,
            fields: this.getMultipartFields(ctx, { object }),
          },
          formTypeName,
        };
      }
    }
  }

  /**
   * Gets the type and fields of a URL-encoded form body. A schema with a model that is a struct gives that type, with a
   * field for each property of the schema the model has. Without such a model, the body is a `url.Values`.
   * @param ctx The context of the service to generate.
   * @param args The content of the body.
   * @returns The type of the body, and its fields, or `null` if the body is sent as a whole.
   */
  protected getFormBody(ctx: Context, args: Args.GetFormBody): { type: Type; fields: GoClientFormField[] | null } {
    const { content } = args;
    const model = content.schema ? ctx.input.go.models[content.schema.id] : undefined;
    const object = this.getObjectSchema(ctx, { schema: content.schema });
    if (!model?.fields || !object) return { type: urlValues(), fields: null };

    const fields = [...object.properties.values()]
      .map((property): GoClientFormField | null => {
        const field = model.fields?.[property.name];
        if (!field) return null;
        return this.getFormField(ctx, {
          name: property.name,
          fieldName: field.name,
          fieldType: field.type,
          schema: property.schema,
          required: object.required.has(property.name),
        });
      })
      .filter(notNullish);
    return { type: model.type, fields };
  }

  /**
   * Gets the fields of a multipart body: a file or a list of files for each binary string or array of binary strings, and
   * a field like in a form for any other property.
   * @param ctx The context of the service to generate.
   * @param args The object schema of the body.
   * @returns The fields of the body.
   */
  protected getMultipartFields(ctx: Context, args: Args.GetMultipartFields): GoClientFormField[] {
    const { object } = args;
    const properties = [...object.properties.values()];
    const fieldNames = this.toUniqueNames(
      ctx,
      properties.map((x) => this.toExportedName(ctx, x.name, 'Field')),
    );
    return properties.map((property, i): GoClientFormField => {
      const required = object.required.has(property.name);
      const schema = this.resolveSchema(ctx, { schema: property.schema });
      const file = {
        name: property.name,
        fieldName: fieldNames[i],
        format: '',
        itemFormat: '',
        required,
        description: property.schema.description,
        deprecated: property.schema.deprecated,
      };
      if (isGoFileSchema(schema)) {
        return { ...file, kind: 'file', type: go.pointer(ctx.runtimeNames.File) };
      }
      if (schema?.kind === 'array' && isGoFileSchema(schema.items)) {
        return { ...file, kind: 'files', type: go.slice(ctx.runtimeNames.File) };
      }
      return this.getFormField(ctx, {
        name: property.name,
        fieldName: fieldNames[i],
        schema: property.schema,
        required,
      });
    });
  }

  /**
   * Gets how one field of a form or multipart body is sent. A primitive value is formatted as text, a list of them is
   * sent as one field per value, and anything else is sent as JSON text (a list of them as one field per item). When
   * the type of the field is not given, as for the struct of a multipart body, the field gets the type the server
   * decodes the part into: a slice for a list, the type itself for a required value, and a pointer for an optional one
   * unless the type is nilable.
   * @param ctx The context of the service to generate.
   * @param args The name of the field in the form, the name and type of the field it is read from, its schema, and
   *   whether it is required.
   * @returns The field.
   */
  protected getFormField(ctx: Context, args: Args.GetFormField): GoClientFormField {
    const { name, fieldName, fieldType, required } = args;
    const schema = this.resolveSchema(ctx, { schema: args.schema });
    const array = schema?.kind === 'array';
    const itemSchema = array ? this.resolveSchema(ctx, { schema: schema.items }) : schema;
    const itemType = itemSchema ? this.getSchemaType(ctx, { schema: itemSchema }) : go.refs.string();
    const formats = this.getFormatFunction(ctx, { schema: itemSchema, type: itemType });

    // A list is only sent as one field per value when the field holds a slice.
    const isList = array && (fieldType === undefined || fieldType instanceof go.Slice);
    const kind: GoClientFormField['kind'] = isList
      ? formats
        ? 'array'
        : 'jsons'
      : !array && formats
        ? 'value'
        : 'json';
    const valueType = array ? go.slice(itemType) : itemType;
    const type = fieldType ?? (array || required || this.isNilable(valueType) ? valueType : go.pointer(valueType));

    return {
      name,
      fieldName,
      type,
      kind,
      format: formats?.format ?? '',
      itemFormat: formats?.itemFormat ?? '',
      required,
      description: args.schema.description,
      deprecated: args.schema.deprecated,
    };
  }

  /**
   * Builds the struct of a multipart body, with a field for each part. A file is a `*File`, a list of files a
   * `[]File`, and any other part is typed like the field of a form.
   * @param _ctx The context of the service to generate.
   * @param args The operation whose multipart struct is built.
   * @returns The declaration of the struct.
   */
  protected getFormStruct(_ctx: Context, args: Args.GetFormStruct): go.TypeDeclaration<Builder> {
    const { operation } = args;
    const name = operation.formTypeName!;
    return go.typeDeclaration(
      name,
      go.struct(
        (operation.body?.fields ?? []).map((x) =>
          go.field(x.fieldName, x.type, { doc: go.doc(x.description, { deprecated: x.deprecated }) }),
        ),
      ),
      { doc: go.doc(`${name} is the ${operation.body?.content.type} body of ${operation.name}.`) },
    );
  }
  // #endregion

  // #region Responses
  /**
   * Gets the success response of an operation: the responses with a 2xx status or a `2XX` range, or the `default`
   * response if none is declared. The body of each is read from its first JSON media type or else its first media
   * type, as JSON, as text for `text/*`, and as bytes otherwise. The method returns the type all bodies share, which
   * is a pointer for a struct, and `any` if they differ.
   * @param ctx The context of the service to generate.
   * @param args The endpoint of the operation.
   * @returns The success response.
   */
  protected getSuccess(ctx: Context, args: Args.GetSuccess): GoClientSuccess {
    const byStatus = this.getSuccessResponses(ctx, args)
      .map((response): GoClientSuccessBody | null => {
        const content = response.contentOptions.find((x) => isJsonMediaType(x.type)) ?? response.contentOptions[0];
        if (!content) return null;
        const status = this.getStatus(response) as GoClientSuccessBody['status'];
        const mediaType = content.type.toLowerCase();
        if (isJsonMediaType(mediaType)) {
          const type = content.schema ? this.getSchemaType(ctx, { schema: content.schema }) : go.refs.any();
          const isStruct = !!content.schema && !!ctx.input.go.models[content.schema.id]?.fields;
          return { status, kind: 'json', type: isStruct ? go.pointer(type) : type, schema: content.schema };
        }
        if (mediaType.startsWith('text/')) return { status, kind: 'text', type: go.refs.string(), schema: undefined };
        return { status, kind: 'raw', type: go.slice(go.refs.byte()), schema: undefined };
      })
      .filter(notNullish);

    if (byStatus.length === 0) return { type: null, pointer: false, byStatus };
    const keys = new Set(byStatus.map((x) => SourceBuilder.build((b) => go.writeNode(b, x.type))));
    if (keys.size > 1) return { type: go.refs.any(), pointer: false, byStatus };
    return { type: byStatus[0].type, pointer: byStatus[0].type instanceof go.Pointer, byStatus };
  }

  /**
   * Gets the responses the client treats as success: those with a 2xx status or a `2XX` range, or else the `default`
   * response.
   * @param _ctx The context of the service to generate.
   * @param args The endpoint of the operation.
   * @returns The success responses, empty if there are none.
   */
  protected getSuccessResponses(_ctx: Context, args: Args.GetSuccess): ApiResponse[] {
    const { endpoint } = args;
    const success = endpoint.responses.filter((x) => /^2([0-9][0-9]|XX)$/i.test(x.statusKey));
    return success.length > 0 ? success : endpoint.responses.filter((x) => x.statusKey === 'default');
  }

  /**
   * Gets the status of a response: its code, `range2` for `2XX`, `default`, or an object with the class (the first
   * digit) of another range such as `4XX`.
   * @param response The response.
   * @returns The status.
   */
  private getStatus(response: ApiResponse): number | 'range2' | 'default' | { range: number } {
    if (/^[1-5][0-9][0-9]$/.test(response.statusKey)) return Number(response.statusKey);
    const range = /^([1-5])XX$/i.exec(response.statusKey);
    if (!range) return 'default';
    return range[1] === '2' ? 'range2' : { range: Number(range[1]) };
  }

  /**
   * Gets the responses whose JSON body is decoded into the `Value` of the `ResponseError`: every response that is not
   * a success response and has a JSON body with a schema. A code comes first, then a range, then `default`.
   * @param ctx The context of the service to generate.
   * @param args The endpoint of the operation.
   * @returns The error responses in the order they are matched.
   */
  protected getErrorResponses(ctx: Context, args: Args.GetErrorResponses): GoClientErrorResponse[] {
    const success = new Set(this.getSuccessResponses(ctx, args));
    const rank = (x: GoClientErrorResponse) => (typeof x.status === 'number' ? 0 : x.status === 'default' ? 2 : 1);
    return args.endpoint.responses
      .filter((x) => !success.has(x))
      .map((response): GoClientErrorResponse | null => {
        const content = response.contentOptions.find((x) => isJsonMediaType(x.type));
        if (!content?.schema) return null;
        return {
          status: this.getStatus(response) as GoClientErrorResponse['status'],
          type: this.getSchemaType(ctx, { schema: content.schema }),
        };
      })
      .filter(notNullish)
      .sort((a, b) => rank(a) - rank(b));
  }
  // #endregion

  // #region Response
  /**
   * Builds the statements sending the request and handling the response: the call of `do`, the deferred close of the
   * body, a `ResponseError` for a status that is not a success, and the decoding of a success body.
   * @param ctx The context of the service to generate.
   * @param args The operation of the method.
   * @returns The statements.
   */
  protected getResponseStatements(ctx: Context, args: Args.GetResponseStatements): AppendValue<Builder>[] {
    const { operation } = args;
    const names = ctx.runtimeNames;
    return [
      s<Builder>`resp, err := c.c.do(ctx, r, opts)`,
      block('if err != nil', [s<Builder>`return ${this.getZeroValues(ctx, { operation, error: 'err' })}`]),
      'defer resp.Body.Close()',
      block(s<Builder>`if !${names.isSuccess}(resp)`, [
        s<Builder>`return ${this.getZeroValues(ctx, { operation, error: s<Builder>`${names.newResponseError}(resp, ${this.getErrorValueFunction(ctx, { operation })})` })}`,
      ]),
      this.getSuccessStatement(ctx, { operation }),
    ];
  }

  /**
   * Builds the function that decodes the body of an error response into the `Value` of the `ResponseError`, which
   * matches the status against the declared error responses: codes first, then ranges, then `default`. A status without
   * a declared JSON body gets `nil`. Without any error response with a JSON body it is `nil`, and so is no function.
   * @param ctx The context of the service to generate.
   * @param args The operation of the method.
   * @returns The function, or `nil`.
   */
  protected getErrorValueFunction(ctx: Context, args: Args.GetErrorValueFunction): AppendValue<Builder> {
    const { errors } = args.operation;
    if (errors.length === 0) return 'nil';

    const decode = (type: Type) => s<Builder>`return ${ctx.runtimeNames.decodeErrorJSON}[${type}](body)`;
    const cases: { label: string; statements: AppendValue<Builder>[] }[] = errors.map((error) => ({
      label:
        error.status === 'default'
          ? 'default:'
          : typeof error.status === 'number'
            ? `case status == ${error.status}:`
            : `case status >= ${error.status.range * 100} && status < ${error.status.range * 100 + 100}:`,
      statements: [decode(error.type)],
    }));
    if (!errors.some((x) => x.status === 'default')) cases.push({ label: 'default:', statements: ['return nil'] });

    return (b: Builder) => {
      b.append('func(status int, body []byte) any ');
      b.parenthesize('{}', switchBlock('switch', cases), { multiline: true });
    };
  }

  /**
   * Builds the statement decoding the success response. Success bodies that are all decoded the same way are decoded
   * by one call of `decodeJSON`, `decodeText` or `decodeBytes`. Otherwise the call is chosen by the status: a `switch`
   * with a case per declared code, and the `2XX` or `default` response, if there is one, or else no value for any other
   * status.
   * @param ctx The context of the service to generate.
   * @param args The operation of the method.
   * @returns The statement.
   */
  protected getSuccessStatement(ctx: Context, args: Args.GetSuccessStatement): AppendValue<Builder> {
    const { operation } = args;
    const { byStatus } = operation.success;
    const names = ctx.runtimeNames;
    if (byStatus.length === 0) return 'return nil';

    const decode = (body: GoClientSuccessBody) =>
      body.kind === 'json'
        ? s<Builder>`return ${names.decodeJSON}[${body.type}](resp)`
        : body.kind === 'text'
          ? s<Builder>`return ${names.decodeText}(resp)`
          : s<Builder>`return ${names.decodeBytes}(resp)`;
    const keys = new Set(byStatus.map((x) => `${x.kind} ${SourceBuilder.build((b) => go.writeNode(b, x.type))}`));
    if (keys.size === 1) return decode(byStatus[0]);

    const fixed = byStatus.filter((x) => typeof x.status === 'number');
    const fallback = byStatus.find((x) => typeof x.status !== 'number');
    return switchBlock('switch resp.StatusCode', [
      ...fixed.map((x) => ({ label: `case ${x.status}:`, statements: [decode(x)] })),
      {
        label: 'default:',
        statements: [
          fallback ? decode(fallback) : s<Builder>`return ${this.getZeroValues(ctx, { operation, error: 'nil' })}`,
        ],
      },
    ]);
  }
  // #endregion

  // #region Schemas
  /**
   * Gets the Go type the models generator generated for a schema, or `any` if it generated none.
   * @param ctx The context of the service to generate.
   * @param args The schema whose type is taken.
   * @returns The type of the schema.
   */
  protected getSchemaType(ctx: Context, args: Args.GetSchemaType): Type {
    return ctx.input.go.models[args.schema.id]?.type ?? go.refs.any();
  }

  /**
   * Resolves a schema to the schema it refers to. A `oneOf` of exactly two schemas, one of them `null`, is unwrapped to
   * the other schema, because it only makes the schema nullable.
   * @param _ctx The context of the service to generate.
   * @param args The schema to resolve.
   * @returns The resolved schema, or `undefined` if no schema is given.
   */
  protected resolveSchema(_ctx: Context, args: Args.ResolveSchema): ApiSchema | undefined {
    return resolveGoSchema(args.schema);
  }

  /**
   * Gets the object a schema describes, with the properties of its compositions merged in where they can be merged. The
   * schema is resolved first.
   * @param ctx The context of the service to generate.
   * @param args The schema of the object.
   * @returns The object schema, or `null` if the schema does not describe an object.
   */
  protected getObjectSchema(ctx: Context, args: Args.GetObjectSchema): ApiSchema<'object'> | null {
    return getGoObjectSchema(this.resolveSchema(ctx, { schema: args.schema }));
  }

  /**
   * Gets the documentation of an endpoint: its summary and description, and its source line if the configuration
   * includes the source in the docs.
   * @param ctx The context of the service to generate.
   * @param args The endpoint whose documentation is taken.
   * @returns The documentation text, which is empty if the endpoint has none.
   */
  protected getEndpointDocText(ctx: Context, args: Args.GetEndpointDocText): string {
    const { endpoint } = args;
    return [
      endpoint.summary?.trim(),
      endpoint.description?.trim(),
      ctx.config.includeSourceInDocs ? getSourceDocLine(endpoint) : null,
    ]
      .filter(Boolean)
      .join('\n\n');
  }
  // #endregion
}
