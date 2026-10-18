import {
  type ApiContent,
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
import { getSourceDocLine, isJsonMediaType, modifyString, toGoFileName, toGoStringLiteral } from '../../utils.ts';
import { GoFileGenerator } from '../file-generator.ts';
import { getGoBodyKind, getGoObjectSchema, isGoFileSchema, resolveGoSchema } from '../schema-utils.ts';
import type { DefaultGoServerGeneratorArgs as Args } from './index.ts';
import type { GoServerGeneratorContext, GoServerGeneratorOutput } from './models.ts';
import type {
  GoBodyField,
  GoOperation,
  GoOperationBody,
  GoOperationParameter,
  GoOperationResponse,
  GoOperationRoute,
  GoValueDecoding,
} from './operation.ts';

type Context = GoServerGeneratorContext;
type Output = GoServerGeneratorOutput;
type Builder = GoFileBuilder;
type Type = go.Type<SourceBuilder>;

const httpRequest = go.refs.net.httpRequest;
const httpResponseWriter = go.refs.net.httpResponseWriter;
const httpHeader = go.refs.net.httpHeader;
const multipartFileHeader = go.refs.mime.multipartFileHeader;
const multipartForm = go.reference.factory('Form', 'mime/multipart');
const urlValues = go.reference.factory('Values', 'net/url');
const mustCompile = go.reference.factory('MustCompile', 'regexp');

/**
 * Generates the server code of one service. Implement it to replace the generation of a service's server code.
 * @template TOutput The type of the result, which describes the file that was written.
 * @see DefaultGoServerGenerator
 */
export interface GoServerGenerator<TOutput extends Output = Output> {
  /**
   * Writes the server file of the service and describes it.
   * @param ctx The context of the service to generate.
   * @returns The output that describes the written file, or a promise that resolves to it.
   */
  generate(ctx: Context): MaybePromise<TOutput>;
}

/**
 * The default generator of the server code of one service (tag). It writes a single Go file into the package directory
 * of the service, named after the service with a `_service.go` suffix. The file declares a `<Name>Service` interface
 * with a method per operation, and a `Register<Name>Routes` function that registers a handler per operation on a
 * `*http.ServeMux`. For each operation it declares a request struct, a decode function, a response interface, and a
 * struct and a write method per declared response. An operation with several tags is declared only by the first service
 * that has it.
 *
 * Each part is built by a protected method, so subclasses can change one part at a time.
 * @see GoServerGenerator
 */
export class DefaultGoServerGenerator extends GoFileGenerator<Context, Output> implements GoServerGenerator {
  /**
   * Writes the server file of the service, and returns references to its service interface and register function.
   * @param ctx The context of the service to generate.
   * @returns The references to the service interface as `serviceInterface`, and to the register function as
   *   `registerFunction`.
   */
  public generate(ctx: Context): MaybePromise<Output> {
    const pkg = ctx.package;
    const registry = this.getIdentifierRegistry(ctx, pkg);
    const serviceName = this.toExportedName(ctx, ctx.service.name, 'Default');
    const interfaceName = registry.reserve(`${serviceName}Service`, `service:${ctx.service.id}`);
    const registerFunctionName = registry.reserve(`Register${serviceName}Routes`, `register:${ctx.service.id}`);

    const files = this.getIdentifierRegistry(ctx, { ...pkg, importPath: `${pkg.importPath}\u0000files` });
    const fileName = `${files.reserve(toGoFileName(`${ctx.service.name}_service`).replace(/\.go$/, ''), `service:${ctx.service.id}`)}.go`;
    const filePath = `${pkg.dir}/${fileName}`;

    console.log(`Generating service ${ctx.service.id} [${interfaceName}] to ${filePath}...`);
    const operations = ctx.service.endpoints.map((endpoint) => this.getOperation(ctx, { endpoint }));

    const builder = new GoFileBuilder(pkg.name, pkg.importPath, ctx.config);
    builder.append(this.getFileContent(ctx, { interfaceName, registerFunctionName, operations }));
    builder.writeToFile(filePath);

    return {
      serviceInterface: go.reference(interfaceName, pkg.importPath, { packageName: pkg.name }),
      registerFunction: go.reference(registerFunctionName, pkg.importPath, { packageName: pkg.name }),
    };
  }

  /**
   * Builds the content of the service file: the service interface, the register function, and the declarations of each
   * operation that no earlier service has declared. The operations are marked as declared, so each one is declared
   * once.
   * @param ctx The context of the service to generate.
   * @param args The name of the interface, the name of the register function and the operations of the service.
   * @returns The content of the file.
   */
  protected getFileContent(ctx: Context, args: Args.GetFileContent): AppendValueGroup<Builder> {
    const { interfaceName, registerFunctionName, operations } = args;

    // An operation with several tags is declared by the file of the first service only.
    const undeclared = operations.filter((x) => !x.declared);
    undeclared.forEach((x) => (x.declared = true));

    return appendValueGroup<Builder>(
      [
        this.getServiceInterface(ctx, { interfaceName, operations }),
        this.getRegisterFunction(ctx, { interfaceName, registerFunctionName, operations }),
        ...undeclared.flatMap((operation) => this.getOperationDeclarations(ctx, { operation })),
      ],
      '\n',
    );
  }

  // #region Service
  /**
   * Builds the interface of the service, with a method per operation. Its documentation names the service, followed by
   * the description of the service if it has one.
   * @param ctx The context of the service to generate.
   * @param args The name of the interface and the operations of the service.
   * @returns The declaration of the interface.
   */
  protected getServiceInterface(ctx: Context, args: Args.GetServiceInterface): go.TypeDeclaration<Builder> {
    const { interfaceName, operations } = args;

    return go.typeDeclaration(
      interfaceName,
      go.interface(operations.map((operation) => this.getServiceMethod(ctx, { operation }))),
      {
        doc: go.doc(
          [
            `${interfaceName} implements the operations of the ${ctx.service.name} API.`,
            ctx.service.description?.trim(),
          ]
            .filter(Boolean)
            .join('\n\n'),
        ),
      },
    );
  }

  /**
   * Builds the method of an operation in the service interface. The method takes the context and the request, and
   * returns the response and an error. Its documentation is the summary and description of the endpoint, and it is
   * marked deprecated if the endpoint is.
   * @param ctx The context of the service to generate.
   * @param args The operation of the method.
   * @returns The declaration of the method.
   */
  protected getServiceMethod(ctx: Context, args: Args.GetServiceMethod): go.Method<Builder> {
    const { operation } = args;

    return go.method(operation.name, {
      doc: go.doc(this.getEndpointDocText(ctx, { endpoint: operation.endpoint }), {
        deprecated: operation.endpoint.deprecated,
      }),
      parameters: [go.parameter('ctx', go.refs.context.context()), go.parameter('req', operation.requestTypeName)],
      results: [go.parameter(null, operation.responseTypeName), go.parameter(null, go.refs.error())],
    });
  }

  /**
   * Builds the function registering the operations of the service on a mux. The body creates the server options from
   * the base path of the service and the options passed in, and then calls `handle` once per operation with its method,
   * its route pattern and a `serve` wrapper around its decode function, the service method and the write method of its
   * responses. The function has no body if the service has no operations.
   * @param ctx The context of the service to generate.
   * @param args The name of the interface and of the function, and the operations to register.
   * @returns The declaration of the register function.
   */
  protected getRegisterFunction(ctx: Context, args: Args.GetRegisterFunction): go.Function<Builder> {
    const { interfaceName, registerFunctionName, operations } = args;
    const body =
      operations.length === 0
        ? null
        : appendValueGroup<Builder>(
            [
              s<Builder>`o := newServerOptions(${toGoStringLiteral(this.getBasePath(ctx, {}))}, opts)`,
              ...operations.map(
                (x) =>
                  s<Builder>`o.handle(mux, ${toGoStringLiteral(x.endpoint.method.toUpperCase())}, ${toGoStringLiteral(x.route.pattern)}, serve(o, ${x.decodeFunctionName}, svc.${x.name}, ${x.responseTypeName}.${x.writeMethodName}))`,
              ),
            ],
            '\n',
          );

    return go.function(registerFunctionName, {
      doc: go.doc(
        `${registerFunctionName} registers a handler for each operation of ${interfaceName} on the mux. The handlers decode the requests, call the service and write its responses.`,
      ),
      parameters: [
        go.parameter('mux', go.pointer(go.refs.net.httpServeMux())),
        go.parameter('svc', interfaceName),
        go.parameter('opts', ctx.runtimeNames.ServerOption, { variadic: true }),
      ],
      body,
    });
  }
  // #endregion

  // #region Operation
  /**
   * Plans an operation of an endpoint: its names, route, parameters, bodies and responses. The plan is computed once
   * per run and cached in the context, so that every service the endpoint belongs to agrees on its names. Parameters
   * whose schema cannot be decoded are kept as skipped, so the request struct can still document them.
   * @param ctx The context of the service to generate.
   * @param args The endpoint of the operation.
   * @returns The plan of the operation.
   */
  protected getOperation(ctx: Context, args: Args.GetOperation): GoOperation {
    const { endpoint } = args;
    const existing = ctx.operations.get(endpoint.id);
    if (existing) return existing;

    const registry = this.getIdentifierRegistry(ctx, ctx.package);
    const name = registry.reserve(this.toExportedName(ctx, endpoint.name, 'Operation'), `operation:${endpoint.id}`);
    // A schema named like the request or response (e.g. `CreatePetRequest`) is common, so these fall back to a
    // longer name before a counter.
    const requestTypeName = registry.reserveFirst([`${name}Request`, `${name}RequestObject`]);
    const responseTypeName = registry.reserveFirst([`${name}Response`, `${name}ResponseObject`]);
    const decodeFunctionName = registry.reserve(`decode${name}Request`);
    const route = this.getRoute(ctx, { endpoint, name });

    const parameters: GoOperationParameter[] = [];
    const skippedParameters: ApiParameter[] = [];
    const fieldNames = this.toUniqueNames(
      ctx,
      [...this.getParameters(ctx, { endpoint }).map((x) => this.toExportedName(ctx, x.name, 'Param')), 'HTTPRequest'],
      [],
    );
    this.getParameters(ctx, { endpoint }).forEach((parameter, i) => {
      const decoding = this.getParameterDecoding(ctx, { parameter });
      if (decoding) {
        parameters.push({
          parameter,
          fieldName: fieldNames[i],
          decoding,
          values: this.getParameterValues(ctx, { parameter, route, decoding }),
        });
      } else {
        skippedParameters.push(parameter);
      }
    });

    const operation: GoOperation = {
      endpoint,
      name,
      requestTypeName,
      responseTypeName,
      decodeFunctionName,
      writeMethodName: `write${responseTypeName}`,
      route,
      parameters,
      skippedParameters,
      bodies: this.getBodies(ctx, { endpoint, name, reservedFieldNames: [...fieldNames] }),
      bodyRequired: endpoint.requestBody?.required ?? false,
      responses: this.getResponses(ctx, { endpoint, name }),
      declared: false,
    };
    ctx.operations.set(endpoint.id, operation);
    return operation;
  }

  /**
   * Builds the declarations of an operation, in order: a variable with a compiled regular expression for each route
   * segment that needs one, the request struct, the structs of the declared bodies, the decode function, the response
   * interface, and a struct and a write method for each response.
   * @param ctx The context of the service to generate.
   * @param args The operation to declare.
   * @returns The declarations, each as one value to append to the file.
   */
  protected getOperationDeclarations(ctx: Context, args: Args.GetOperationDeclarations): AppendValue<Builder>[] {
    const { operation } = args;

    return [
      ...operation.route.segmentPatterns.map(
        (x) => s<Builder>`var ${x.variable} = ${mustCompile()}(${toGoStringLiteral(x.regex)})\n`,
      ),
      this.getRequestStruct(ctx, { operation }),
      ...operation.bodies
        .filter((x) => x.declaredStructName !== null)
        .map((body) => this.getBodyStruct(ctx, { operation, body })),
      this.getDecodeFunction(ctx, { operation }),
      this.getResponseInterface(ctx, { operation }),
      ...operation.responses.flatMap((response) => [
        this.getResponseStruct(ctx, { operation, response }),
        this.getResponseWriteMethod(ctx, { operation, response }),
      ]),
    ];
  }

  /**
   * Gets the parameters the request struct can hold: those in the path, the query, a header or a cookie. Parameters of
   * other locations are not considered.
   * @param _ctx The context of the service to generate.
   * @param args The endpoint whose parameters are taken.
   * @returns The parameters of the endpoint in those locations.
   */
  protected getParameters(_ctx: Context, args: Args.GetParameters): ApiParameter[] {
    return args.endpoint.parameters.filter(
      (x) => x.target === 'path' || x.target === 'query' || x.target === 'header' || x.target === 'cookie',
    );
  }
  // #endregion

  // #region Route
  /**
   * Builds the route of an endpoint: its `http.ServeMux` pattern, the wildcards of its path parameters, and the regular
   * expressions for segments that hold text beside a parameter. A path parameter that is a whole segment becomes a
   * wildcard named after it. A segment holding a parameter and other text (`{id}.json`) becomes a wildcard for the
   * whole segment, because a `http.ServeMux` wildcard always spans a whole segment. The parameter is then taken from
   * that segment by a regular expression with a group per parameter, which is stored as a segment pattern. A pattern
   * ending in a slash gets `{$}` appended, so that it matches only that path and not the paths below it.
   * @param ctx The context of the service to generate.
   * @param args The endpoint of the route and the name of its operation.
   * @returns The route of the endpoint.
   */
  protected getRoute(ctx: Context, args: Args.GetRoute): GoOperationRoute {
    const { endpoint, name } = args;
    const path = modifyString(endpoint.path, ctx.config.pathModifier, endpoint);
    const segments = path.split('/').filter((x, i) => i > 0 || x !== '');
    const route: GoOperationRoute = { pattern: '', parameters: new Map(), segmentPatterns: [] };
    const wildcards = new Set<string>();
    const reserveWildcard = (base: string) => {
      let wildcard = base;
      for (let i = 2; wildcards.has(wildcard); i++) wildcard = `${base}${i}`;
      wildcards.add(wildcard);
      return wildcard;
    };

    const patternSegments = segments.map((segment, index) => {
      const whole = /^\{([^{}]+)\}$/.exec(segment);
      if (whole) {
        const wildcard = reserveWildcard(this.toUnexportedName(ctx, whole[1], 'param'));
        route.parameters.set(whole[1], { wildcard });
        return `{${wildcard}}`;
      }
      if (!segment.includes('{')) {
        return this.escapePathSegment(segment);
      }

      const wildcard = reserveWildcard(`segment${index + 1}`);
      const variable = this.getIdentifierRegistry(ctx, ctx.package).reserve(
        `${this.toUnexportedName(ctx, name)}Segment${index + 1}`,
      );
      let regex = '^';
      let group = 0;
      for (const part of segment.split(/(\{[^{}]+\})/)) {
        const parameter = /^\{([^{}]+)\}$/.exec(part);
        if (parameter) {
          route.parameters.set(parameter[1], { wildcard, patternVariable: variable, group: ++group });
          regex += '(.*?)';
        } else {
          regex += part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
      }
      route.segmentPatterns.push({ variable, regex: `${regex}$` });
      return `{${wildcard}}`;
    });

    route.pattern = `/${patternSegments.join('/')}`;
    // A pattern ending in a slash matches every path below it, and `{$}` restricts it to the path itself.
    if (route.pattern.endsWith('/')) route.pattern += '{$}';
    return route;
  }

  /**
   * Percent-encodes the characters of a literal path segment that a `http.ServeMux` pattern cannot contain as they are.
   * Other characters, including the sub-delimiters, are kept.
   * @param segment The literal segment of the path.
   * @returns The segment, safe to use in a pattern.
   */
  protected escapePathSegment(segment: string): string {
    return segment.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@%]/g, (x) => encodeURIComponent(x));
  }

  /**
   * Gets the base path the routes are registered below: the path of the first server URL of the service, or of its
   * first endpoint, after the base path modifier. The scheme and host are removed and trailing slashes are dropped. A
   * URL with a server variable has no known path, so the base path is empty.
   * @param ctx The context of the service to generate.
   * @param _args The arguments of the call, none of which are used.
   * @returns The base path, or an empty string if there is none.
   */
  protected getBasePath(ctx: Context, _args: Args.GetBasePath): string {
    const url = (ctx.service.$src ?? ctx.service.endpoints[0]?.$src)?.document.servers?.[0]?.url ?? '/';
    let path = modifyString(url, ctx.config.basePath, ctx.service);
    path = path.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, '');
    // A server variable cannot be resolved here.
    if (path.includes('{')) return '';
    return path.replace(/\/+$/, '');
  }
  // #endregion

  // #region Request
  /**
   * Builds the request struct of an operation. It has a field for each decoded parameter and for each body, and an
   * `HTTPRequest` field with the request as received. Its documentation lists the parameters that were skipped because
   * their schema is not supported, which are read from `HTTPRequest` instead.
   * @param ctx The context of the service to generate.
   * @param args The operation whose request struct is built.
   * @returns The declaration of the request struct.
   */
  protected getRequestStruct(ctx: Context, args: Args.GetRequestStruct): go.TypeDeclaration<Builder> {
    const { operation } = args;
    const docLines = [`${operation.requestTypeName} is the request of ${operation.name}.`];
    for (const parameter of operation.skippedParameters) {
      docLines.push(
        `The ${parameter.target} parameter ${toGoStringLiteral(parameter.name)} is not decoded, because its schema is not supported. Read it from HTTPRequest.`,
      );
    }

    const bodyFields = new Map(operation.bodies.map((x) => [x.fieldName, x]));
    return go.typeDeclaration(
      operation.requestTypeName,
      go.struct([
        ...operation.parameters.map((x) =>
          go.field(x.fieldName, x.decoding.fieldType, {
            doc: go.doc(x.parameter.description, { deprecated: x.parameter.deprecated }),
          }),
        ),
        ...[...bodyFields.values()].map((x) =>
          go.field(x.fieldName, x.fieldType, {
            doc: go.doc(
              operation.bodies.length > 1
                ? `${x.fieldName} is the body, if its content type is ${operation.bodies
                    .filter((y) => y.fieldName === x.fieldName)
                    .map((y) => y.content.type)
                    .join(' or ')}.`
                : operation.endpoint.requestBody?.description,
            ),
          }),
        ),
        go.field('HTTPRequest', go.pointer(httpRequest()), {
          doc: go.doc('HTTPRequest is the request as received, e.g. to read what is not declared.'),
        }),
      ]),
      { doc: go.doc(docLines.join('\n\n')) },
    );
  }

  /**
   * Builds the struct of a body that is declared as its own type, which is the case for a multipart body. It has a
   * field for each decoded field of the body.
   * @param _ctx The context of the service to generate.
   * @param args The operation and the body whose struct is built.
   * @returns The declaration of the body struct.
   */
  protected getBodyStruct(_ctx: Context, args: Args.GetBodyStruct): go.TypeDeclaration<Builder> {
    const { operation, body } = args;
    const name = body.declaredStructName!;

    return go.typeDeclaration(
      name,
      go.struct(
        (body.fields ?? []).map((x) =>
          go.field(x.fieldName, x.decoding.fieldType, {
            doc: go.doc(x.description, { deprecated: x.deprecated }),
          }),
        ),
      ),
      { doc: go.doc(`${name} is the ${body.content.type} body of ${operation.name}.`) },
    );
  }

  /**
   * Builds the decode function of an operation. It takes the HTTP request and the server options, and returns the
   * request struct. The function stores the request as `HTTPRequest`, decodes each parameter, and then decodes the body
   * by its media type if the operation has bodies. It returns the first error it gets.
   * @param ctx The context of the service to generate.
   * @param args The operation whose decode function is built.
   * @returns The declaration of the decode function.
   */
  protected getDecodeFunction(ctx: Context, args: Args.GetDecodeFunction): go.Function<Builder> {
    const { operation } = args;
    const statements: AppendValue<Builder>[] = [s<Builder>`req.HTTPRequest = r`];

    for (const x of operation.parameters) {
      statements.push(
        this.getDecodeStatement(ctx, {
          target: `req.${x.fieldName}`,
          call: this.getDecodeCall(ctx, {
            decoding: x.decoding,
            location: x.parameter.target,
            name: x.parameter.name,
            values: x.values,
          }),
        }),
      );
    }

    if (operation.bodies.length > 0) {
      statements.push(this.getBodyDecoding(ctx, { operation }));
    }
    statements.push('return req, nil');

    return go.function(operation.decodeFunctionName, {
      parameters: [
        go.parameter('r', go.pointer(httpRequest())),
        go.parameter('o', go.pointer(ctx.runtimeNames.ServerOptions)),
      ],
      results: [go.parameter('req', operation.requestTypeName), go.parameter('err', go.refs.error())],
      body: appendValueGroup(statements, '\n'),
    });
  }

  /**
   * Builds the statement assigning the result of a decode call to a field of the request, and returning on its error.
   * It is `if <target>, err = <call>; err != nil { return req, err }`.
   * @param _ctx The context of the service to generate.
   * @param args The field to assign to, and the call producing its value.
   * @returns The statement.
   */
  protected getDecodeStatement(_ctx: Context, args: Args.GetDecodeStatement): AppendValue<Builder> {
    return s<Builder>`if ${args.target}, err = ${args.call}; err != nil {
      \treturn req, err
      }`;
  }

  /**
   * Builds the call decoding the raw values of a parameter or a form field. The call depends on the decoding mode:
   * `requiredValue` and `optionalValue` decode a single value, `valueOrDefault` decodes a single value and falls back
   * to the default value, and `arrayValues` decodes a list of values.
   * @param _ctx The context of the service to generate.
   * @param args The location, the name, the raw values and the decoding of the value.
   * @returns The decode call.
   */
  protected getDecodeCall(_ctx: Context, args: Args.GetDecodeCall): AppendValue<Builder> {
    const { decoding, location, name, values } = args;
    const prefix = s<Builder>`${toGoStringLiteral(location)}, ${toGoStringLiteral(name)}, ${values}, ${decoding.parse}`;
    switch (decoding.mode) {
      case 'required':
        return s<Builder>`requiredValue(${prefix})`;
      case 'optional':
        return s<Builder>`optionalValue(${prefix})`;
      case 'default':
        return s<Builder>`valueOrDefault(${prefix}, ${decoding.defaultValue ?? 'nil'})`;
      case 'array':
        return s<Builder>`arrayValues(${prefix}, ${String(decoding.required)})`;
    }
  }

  /**
   * Builds the expression for the raw values of a parameter, as the runtime functions of its location return them. A
   * path parameter is read from its wildcard, or from the regular expression of its segment if it shares the segment
   * with other text. A parameter the path does not contain is always absent, so its values are `nil`. The style
   * defaults to `simple` for a path parameter and to `form` for a query parameter, and `explode` defaults to whether
   * the style is `form`.
   * @param _ctx The context of the service to generate.
   * @param args The parameter, its route and its decoding.
   * @returns The expression for the raw values.
   */
  protected getParameterValues(_ctx: Context, args: Args.GetParameterValues): AppendValue<Builder> {
    const { parameter, route, decoding } = args;
    const name = toGoStringLiteral(parameter.name);
    const array = String(decoding.mode === 'array');
    const explode = (style: string) => String(parameter.explode ?? style === 'form');

    switch (parameter.target) {
      case 'path': {
        const source = route.parameters.get(parameter.name);
        if (source === undefined) {
          // The path does not contain the parameter, so it is never present.
          return 'nil';
        }
        if ('patternVariable' in source) {
          return `pathSegmentParamValues(r, ${toGoStringLiteral(source.wildcard)}, ${source.patternVariable}, ${source.group}, ${array})`;
        }
        const style = parameter.style ?? 'simple';
        return `pathParamValues(r, ${toGoStringLiteral(source.wildcard)}, ${name}, ${toGoStringLiteral(style)}, ${explode(style)}, ${array})`;
      }
      case 'query': {
        const style = parameter.style ?? 'form';
        return `queryParamValues(r, ${name}, ${toGoStringLiteral(style)}, ${explode(style)}, ${array})`;
      }
      case 'header':
        return `headerParamValues(r, ${name}, ${array})`;
      default:
        return `cookieParamValues(r, ${name}, ${array})`;
    }
  }

  /**
   * Gets how a parameter is decoded, or `null` if its schema cannot be decoded. A path parameter is always required. A
   * parameter cannot hold JSON, so its schema must be a primitive, an enum of one, or a list of primitives.
   * @param ctx The context of the service to generate.
   * @param args The parameter to decode.
   * @returns The decoding of the parameter, or `null` if it is not supported.
   */
  protected getParameterDecoding(ctx: Context, args: Args.GetParameterDecoding): GoValueDecoding | null {
    const { parameter } = args;
    return this.getValueDecoding(ctx, {
      schema: parameter.schema,
      required: parameter.required || parameter.target === 'path',
      allowJson: false,
    });
  }

  /**
   * Gets how a value is decoded, or `null` if it cannot be. A primitive, or an enum of one, is parsed from its text, as
   * is each item of an array of primitives. With `allowJson`, anything else is parsed as JSON, as a form field holding
   * an object can only be.
   *
   * If the type of the field the value is decoded into is given, the decoding matches that type: a slice decodes a
   * list, a pointer is optional, and a nilable type defaults to `nil` unless the value is required. Otherwise, a value
   * whose schema is an array is a list. Any other value is required if it is required, uses its default value if it has
   * one, defaults to `nil` if its type is nilable, and is optional behind a pointer in all other cases.
   * @param ctx The context of the service to generate.
   * @param args The schema of the value, whether it is required, whether it may be JSON, and the type of the field it
   *   is decoded into, if any.
   * @returns The decoding of the value, or `null` if it cannot be decoded.
   */
  protected getValueDecoding(ctx: Context, args: Args.GetValueDecoding): GoValueDecoding | null {
    const { required, allowJson, fieldType } = args;
    const schema = this.resolveSchema(ctx, { schema: args.schema });
    const isArray = schema?.kind === 'array';
    const itemSchema = isArray ? this.resolveSchema(ctx, { schema: schema.items }) : schema;
    const itemType = itemSchema ? this.getSchemaType(ctx, { schema: itemSchema }) : go.refs.string();
    const parse =
      this.getParseFunction(ctx, { schema: itemSchema, type: itemType }) ??
      (allowJson ? s<Builder>`parseJSON[${itemType}]` : null);
    if (parse === null) return null;

    // The type of a model's field is given, so the value matches it.
    if (fieldType !== undefined) {
      if (isArray && fieldType instanceof go.Slice) return { mode: 'array', fieldType, parse, required };
      if (fieldType instanceof go.Pointer) return { mode: 'optional', fieldType, parse, required };
      if (go.isNilable(fieldType) && !required) {
        return { mode: 'default', fieldType, parse, defaultValue: 'nil', required };
      }
      return { mode: 'required', fieldType, parse, required };
    }

    if (isArray) return { mode: 'array', fieldType: go.slice(itemType), parse, required };
    if (required) return { mode: 'required', fieldType: itemType, parse, required };
    const defaultValue = this.getDefaultValue(ctx, { schema: itemSchema });
    if (defaultValue !== null) return { mode: 'default', fieldType: itemType, parse, defaultValue, required };
    if (go.isNilable(itemType)) return { mode: 'default', fieldType: itemType, parse, defaultValue: 'nil', required };
    return { mode: 'optional', fieldType: go.pointer(itemType), parse, required };
  }

  /**
   * Gets the runtime function parsing the text of a primitive value: `parseTime` for a string held in a `time.Time`,
   * `parseBytes` for a string held in a byte slice, `parseString` for other strings, and `parseInt`, `parseFloat` or
   * `parseBool` for integers, numbers and booleans. A value without a schema is parsed as a string.
   * @param _ctx The context of the service to generate.
   * @param args The schema of the value, and the type the value is parsed into.
   * @returns The call of the parse function, or `null` if the schema is not a primitive.
   */
  protected getParseFunction(_ctx: Context, args: Args.GetParseFunction): AppendValue<Builder> | null {
    const { schema, type } = args;
    if (!schema) return s<Builder>`parseString[${type}]`;

    switch (schema.kind) {
      case 'string':
        if (go.refs.time.time.matches(type)) return 'parseTime';
        if (type instanceof go.Slice) return 'parseBytes';
        return s<Builder>`parseString[${type}]`;
      case 'integer':
        return s<Builder>`parseInt[${type}]`;
      case 'number':
        return s<Builder>`parseFloat[${type}]`;
      case 'boolean':
        return s<Builder>`parseBool[${type}]`;
      default:
        return null;
    }
  }

  /**
   * Gets the Go literal of the default value of a primitive schema, or `null` if the schema has no default or the
   * default has no literal. A string with a date-time, byte or binary format has no literal, and a default that does
   * not match the kind of the schema is ignored.
   * @param _ctx The context of the service to generate.
   * @param args The schema whose default value is taken.
   * @returns The literal of the default value, or `null`.
   */
  protected getDefaultValue(_ctx: Context, args: Args.GetDefaultValue): string | null {
    const { schema } = args;
    const value = schema?.default;
    if (value === undefined || value === null) return null;

    switch (schema?.kind) {
      case 'string':
        return schema.format === 'date-time' || schema.format === 'byte' || schema.format === 'binary'
          ? null
          : toGoStringLiteral(String(value));
      case 'integer':
        return typeof value === 'number' && Number.isInteger(value) ? String(value) : null;
      case 'number':
        return typeof value === 'number' && Number.isFinite(value) ? String(value) : null;
      case 'boolean':
        return typeof value === 'boolean' ? String(value) : null;
      default:
        return null;
    }
  }
  // #endregion

  // #region Request body
  /**
   * Gets the request bodies of an operation, one for each media type of its request body. Media types decoded into the
   * same type share one field. If all bodies share one type, the field is named `Body`. Otherwise a field is named
   * after the kind of its first body, such as `JSONBody`. A body field is a pointer unless its type is nilable, or all
   * bodies share one type and the request body is required.
   * @param ctx The context of the service to generate.
   * @param args The endpoint and name of the operation, and the field names already reserved for its parameters.
   * @returns The bodies of the operation.
   */
  protected getBodies(ctx: Context, args: Args.GetBodies): GoOperationBody[] {
    const { endpoint, name, reservedFieldNames } = args;
    const contents = endpoint.requestBody?.content ?? [];
    const required = endpoint.requestBody?.required ?? false;

    const bodies = contents.map((content) => {
      const kind = this.getBodyKind(ctx, { content });
      const { type, fields, declaredStructName } = this.getBodyType(ctx, { content, kind, name });
      return { content, kind, type, fields, declaredStructName };
    });

    // Media types decoded into the same type share one field.
    const typeKeys = bodies.map((x) => SourceBuilder.build((b) => go.writeNode(b, x.type)));
    const shared = new Set(typeKeys).size === 1;
    const kindNames = { json: 'JSON', form: 'Form', multipart: 'Multipart', text: 'Text', raw: 'Raw' };
    const fieldNames = this.toUniqueNames(
      ctx,
      bodies.map((x) => (shared ? 'Body' : `${kindNames[x.kind]}Body`)),
      reservedFieldNames,
    );
    const firstFieldByType = new Map<string, string>();

    return bodies.map((body, i) => {
      const fieldName = shared ? fieldNames[0] : (firstFieldByType.get(typeKeys[i]) ?? fieldNames[i]);
      firstFieldByType.set(typeKeys[i], fieldName);
      const optional = !shared || !required;
      return {
        ...body,
        fieldName,
        fieldType: optional && !go.isNilable(body.type) ? go.pointer(body.type) : body.type,
      };
    });
  }

  /**
   * Gets the kind of a body by its media type: `json` for JSON, `form` for URL-encoded forms, `multipart` for
   * multipart, `text` for `text/*`, and `raw` for anything else, which is read as a stream.
   * @param _ctx The context of the service to generate.
   * @param args The content of the body, with its media type.
   * @returns The kind of the body.
   */
  protected getBodyKind(_ctx: Context, args: Args.GetBodyKind): GoOperationBody['kind'] {
    return getGoBodyKind(args.content.type);
  }

  /**
   * Gets the Go type of a body, by its kind. A JSON body has the type of its schema, or `any` without one. A text body
   * is a string, and a raw body is an `io.Reader`. A form body has the type of the model of its schema, with the form
   * fields that can be decoded, or `url.Values` if the schema has no such model. A multipart body is declared as its
   * own struct with a field for each part, or is a pointer to a `multipart.Form` if its schema has no properties.
   * @param ctx The context of the service to generate.
   * @param args The content of the body, its kind, and the name of the operation.
   * @returns The type of the body, its decoded fields, and the name of the struct it is declared as, if any.
   */
  protected getBodyType(
    ctx: Context,
    args: Args.GetBodyType,
  ): Pick<GoOperationBody, 'type' | 'fields' | 'declaredStructName'> {
    const { content, kind, name } = args;
    const none = { fields: null, declaredStructName: null };

    switch (kind) {
      case 'json':
        return { type: content.schema ? this.getSchemaType(ctx, { schema: content.schema }) : go.refs.any(), ...none };
      case 'text':
        return { type: go.refs.string(), ...none };
      case 'raw':
        return { type: go.refs.io.reader(), ...none };
      case 'form': {
        const model = content.schema ? ctx.input.go.models[content.schema.id] : undefined;
        const object = this.getObjectSchema(ctx, { schema: content.schema });
        if (!model?.fields || !object) return { type: urlValues(), ...none };
        const fields = [...object.properties.values()]
          .map((property): GoBodyField | null => {
            const field = model.fields?.[property.name];
            const decoding =
              field &&
              this.getValueDecoding(ctx, {
                schema: property.schema,
                required: object.required.has(property.name),
                allowJson: true,
                fieldType: field.type,
              });
            return field && decoding
              ? {
                  name: property.name,
                  fieldName: field.name,
                  decoding,
                  description: property.schema.description,
                  deprecated: property.schema.deprecated,
                }
              : null;
          })
          .filter(notNullish);
        return { type: model.type, fields, declaredStructName: null };
      }
      case 'multipart': {
        const object = this.getObjectSchema(ctx, { schema: content.schema });
        if (!object || object.properties.size === 0) return { type: go.pointer(multipartForm()), ...none };

        const structName = this.getIdentifierRegistry(ctx, ctx.package).reserveFirst([
          `${name}Body`,
          `${name}RequestBody`,
        ]);
        const properties = [...object.properties.values()];
        const fieldNames = this.toUniqueNames(
          ctx,
          properties.map((x) => this.toExportedName(ctx, x.name, 'Field')),
        );
        const fields = properties
          .map((property, i): GoBodyField | null => {
            const required = object.required.has(property.name);
            const decoding = this.getMultipartFieldDecoding(ctx, { schema: property.schema, required });
            return decoding
              ? {
                  name: property.name,
                  fieldName: fieldNames[i],
                  decoding,
                  description: property.schema.description,
                  deprecated: property.schema.deprecated,
                }
              : null;
          })
          .filter(notNullish);
        return { type: go.reference(structName), fields, declaredStructName: structName };
      }
    }
  }

  /**
   * Gets how a part of a multipart body is decoded. A binary string is a file, and an array of binary strings is a list
   * of files. Any other part is decoded like a form field, with JSON allowed.
   * @param ctx The context of the service to generate.
   * @param args The schema of the part and whether it is required.
   * @returns The decoding of the part, or `null` if it cannot be decoded, in which case the part is skipped.
   */
  protected getMultipartFieldDecoding(
    ctx: Context,
    args: Args.GetMultipartFieldDecoding,
  ): GoBodyField['decoding'] | null {
    const { required } = args;
    const schema = this.resolveSchema(ctx, { schema: args.schema });
    if (isGoFileSchema(schema)) {
      return { mode: 'file', fieldType: go.pointer(multipartFileHeader()), required };
    }
    if (schema?.kind === 'array' && isGoFileSchema(schema.items)) {
      return { mode: 'files', fieldType: go.slice(go.pointer(multipartFileHeader())), required };
    }
    return this.getValueDecoding(ctx, { schema: args.schema, required, allowJson: true });
  }

  /**
   * Builds the statements decoding the body by its media type, as a `switch` on the media type of the request. A
   * request without a `Content-Type` is decoded as the first media type of the API description. A request with an
   * undeclared media type is rejected with 415 Unsupported Media Type. A required body is rejected with a missing body
   * error if the request has none. An optional body is decoded only if the request has one.
   * @param ctx The context of the service to generate.
   * @param args The operation whose body is decoded.
   * @returns The statements decoding the body.
   */
  protected getBodyDecoding(ctx: Context, args: Args.GetBodyDecoding): AppendValue<Builder> {
    const { operation } = args;
    const cases = operation.bodies.map(
      (body, i) =>
        s<Builder>`case ${i === 0 ? 'mediaType == "" || ' : ''}mediaTypeMatches(mediaType, ${toGoStringLiteral(body.content.type)}):
          ${s.indent<Builder>`${this.getBodyCaseStatements(ctx, { operation, body })}`}`,
    );
    const switchStatement = s<Builder>`switch mediaType := requestMediaType(r); {
      ${appendValueGroup(cases, '\n')}
      default:
      \treturn req, unsupportedMediaType(mediaType)
      }`;

    return operation.bodyRequired
      ? s<Builder>`if !hasBody(r) {
          \treturn req, missingBody()
          }
          ${switchStatement}`
      : s<Builder>`if hasBody(r) {
          ${s.indent<Builder>`${switchStatement}`}
          }`;
  }

  /**
   * Builds the statements of the `case` for a body, which decode it and store it in its field of the request. A JSON,
   * text or form body is decoded by its runtime function, and a raw body is stored as the request's body stream. A form
   * or multipart body with fields is decoded into a local `body` variable, field by field, and then stored. The value
   * is stored as a pointer if the field is a pointer and the body is not.
   * @param ctx The context of the service to generate.
   * @param args The operation and the body whose statements are built.
   * @returns The statements of the case.
   */
  protected getBodyCaseStatements(ctx: Context, args: Args.GetBodyCaseStatements): AppendValue<Builder> {
    const { body } = args;
    const assign = (value: string) =>
      `req.${body.fieldName} = ${body.fieldType instanceof go.Pointer && !(body.type instanceof go.Pointer) ? '&' : ''}${value}`;
    const checked = (declaration: AppendValue<Builder>) =>
      s<Builder>`${declaration}
        if err != nil {
        \treturn req, err
        }`;

    switch (body.kind) {
      case 'json':
        return appendValueGroup<Builder>(
          [checked(s<Builder>`body, err := decodeJSONBody[${body.type}](r)`), assign('body')],
          '\n',
        );
      case 'text':
        return appendValueGroup<Builder>([checked('body, err := decodeTextBody(r)'), assign('body')], '\n');
      case 'raw':
        return assign('r.Body');
      case 'form':
      case 'multipart': {
        const form = body.kind === 'form' ? 'form, err := decodeFormBody(r)' : 'form, err := decodeMultipartBody(r, o)';
        if (body.fields === null) {
          return appendValueGroup<Builder>([checked(form), assign('form')], '\n');
        }
        return appendValueGroup<Builder>(
          [
            checked(form),
            s<Builder>`var body ${body.type instanceof go.Pointer ? body.type.type : body.type}`,
            ...body.fields.map((field) => this.getBodyFieldStatement(ctx, { body, field })),
            assign('body'),
          ],
          '\n',
        );
      }
    }
  }

  /**
   * Builds the statement decoding one field of a form or multipart body into the local `body` variable. A file or a
   * list of files is taken from the multipart form. Any other field is decoded from the form values by its decode call.
   * @param ctx The context of the service to generate.
   * @param args The body and the field to decode.
   * @returns The statement decoding the field.
   */
  protected getBodyFieldStatement(ctx: Context, args: Args.GetBodyFieldStatement): AppendValue<Builder> {
    const { body, field } = args;
    const name = toGoStringLiteral(field.name);
    const target = `body.${field.fieldName}`;
    const decoding = field.decoding;

    if (!('parse' in decoding)) {
      const fn = decoding.mode === 'file' ? 'multipartFile' : 'multipartFiles';
      return this.getDecodeStatement(ctx, {
        target,
        call: `${fn}(form, ${name}, ${String(decoding.required)})`,
      });
    }
    return this.getDecodeStatement(ctx, {
      target,
      call: this.getDecodeCall(ctx, {
        decoding,
        location: 'body',
        name: field.name,
        values: `formValues(${body.kind === 'multipart' ? 'form.Value' : 'form'}, ${name})`,
      }),
    });
  }
  // #endregion

  // #region Responses
  /**
   * Gets the responses of an operation: one for each declared response, or a single one for the default response if
   * none is declared. Each response has a type named after the operation and its status, such as
   * `CreatePet201Response`, where the status is a code, a class such as `2XX`, or `Default`. A fixed status is written
   * as its code. A status class or the default is variable: its status is the `StatusCode` field of the response if
   * that is set, and otherwise a fallback. The fallback of a class is its first code, so `2XX` falls back to 200, and
   * the fallback of the default is 500 if the operation has a successful response, and 200 if not. Headers other than
   * `Content-Type` become fields, which are pointers unless they are required or nilable.
   * @param ctx The context of the service to generate.
   * @param args The endpoint and name of the operation.
   * @returns The responses of the operation.
   */
  protected getResponses(ctx: Context, args: Args.GetResponses): GoOperationResponse[] {
    const { endpoint, name } = args;
    const registry = this.getIdentifierRegistry(ctx, ctx.package);
    const hasSuccess = endpoint.responses.some((x) => x.statusKey.startsWith('2'));
    const responses: (ApiResponse | null)[] = endpoint.responses.length > 0 ? endpoint.responses : [null];

    return responses.map((response) => {
      const statusKey = response?.statusKey ?? 'default';
      const code = /^[1-5][0-9][0-9]$/.test(statusKey) ? Number(statusKey) : undefined;
      const range = /^([1-5])XX$/i.exec(statusKey);
      const statusName = code !== undefined ? statusKey : range ? `${range[1]}XX` : 'Default';
      const typeName = registry.reserve(`${name}${statusName}Response`);

      const status: GoOperationResponse['status'] =
        code !== undefined
          ? { kind: 'fixed', code }
          : { kind: 'variable', fallback: range ? Number(range[1]) * 100 : hasSuccess ? 500 : 200 };
      const reserved = ['Body', 'Headers', ...(status.kind === 'variable' ? ['StatusCode'] : [])];
      const headers = (response?.headers ?? []).filter((x) => x.name.toLowerCase() !== 'content-type');
      const headerFieldNames = this.toUniqueNames(
        ctx,
        headers.map((x) => this.toExportedName(ctx, x.name, 'Header')),
        reserved,
      );

      return {
        response,
        typeName,
        status,
        body: response ? this.getResponseBody(ctx, { response }) : null,
        headers: headers.map((header, i) => {
          const type = header.schema ? this.getSchemaType(ctx, { schema: header.schema }) : go.refs.string();
          return {
            header,
            fieldName: headerFieldNames[i],
            type: header.required || go.isNilable(type) ? type : go.pointer(type),
          };
        }),
      };
    });
  }

  /**
   * Gets the body of a response, from its first JSON media type if it has one, and otherwise from its first media type.
   * A JSON body has the type of its schema, or `any` without one. A text body is a string. Any other body is an
   * `io.Reader`, and its content type is empty if its media type is a wildcard.
   * @param ctx The context of the service to generate.
   * @param args The response whose body is taken.
   * @returns The body, or `null` if the response has no content.
   */
  protected getResponseBody(ctx: Context, args: Args.GetResponseBody): GoOperationResponse['body'] {
    const { response } = args;
    const content: ApiContent | undefined =
      response.contentOptions.find((x) => isJsonMediaType(x.type)) ?? response.contentOptions[0];
    if (!content) return null;

    const type = content.type.toLowerCase();
    if (isJsonMediaType(type)) {
      return {
        kind: 'json',
        type: content.schema ? this.getSchemaType(ctx, { schema: content.schema }) : go.refs.any(),
        contentType: content.type,
      };
    }
    if (type.startsWith('text/')) {
      return { kind: 'text', type: go.refs.string(), contentType: content.type };
    }
    return { kind: 'raw', type: go.refs.io.reader(), contentType: content.type.includes('*') ? '' : content.type };
  }

  /**
   * Builds the interface of the response of an operation, which the handler writes with its write method. Its
   * documentation lists the response types it can be.
   * @param _ctx The context of the service to generate.
   * @param args The operation whose response interface is built.
   * @returns The declaration of the response interface.
   */
  protected getResponseInterface(_ctx: Context, args: Args.GetResponseInterface): go.TypeDeclaration<Builder> {
    const { operation } = args;

    return go.typeDeclaration(
      operation.responseTypeName,
      go.interface([
        go.method(operation.writeMethodName, {
          parameters: [go.parameter('w', httpResponseWriter())],
          results: [go.parameter(null, go.refs.error())],
        }),
      ]),
      {
        doc: go.doc(
          `${operation.responseTypeName} is the response of ${operation.name}, one of ${operation.responses
            .map((x) => x.typeName)
            .join(', ')}.`,
        ),
      },
    );
  }

  /**
   * Builds the struct of one response. It has a `StatusCode` field if its status is variable, a `Body` field if the
   * response has a body, a field for each header, and the `Headers` of the response. Its documentation states the
   * status the response is for, followed by the description of the response.
   * @param _ctx The context of the service to generate.
   * @param args The response whose struct is built.
   * @returns The declaration of the response struct.
   */
  protected getResponseStruct(_ctx: Context, args: Args.GetResponseStruct): go.TypeDeclaration<Builder> {
    const { response } = args;
    const description = response.response?.description?.trim();
    const statusText =
      response.status.kind === 'fixed'
        ? `with status ${response.status.code}`
        : response.response?.statusKey && response.response.statusKey !== 'default'
          ? `with a status of ${response.response.statusKey}`
          : 'with any other status';

    return go.typeDeclaration(
      response.typeName,
      go.struct([
        response.status.kind === 'variable'
          ? go.field('StatusCode', go.refs.int(), {
              doc: go.doc(`StatusCode is the status of the response, ${response.status.fallback} if it is not set.`),
            })
          : null,
        response.body ? go.field('Body', response.body.type) : null,
        ...response.headers.map((x) =>
          go.field(x.fieldName, x.type, {
            doc: go.doc(
              [`${x.fieldName} is the ${x.header.name} header.`, x.header.description?.trim()]
                .filter(Boolean)
                .join(' '),
              { deprecated: x.header.deprecated },
            ),
          }),
        ),
        go.field('Headers', httpHeader(), {
          doc: go.doc('Headers are additional headers of the response.'),
        }),
      ]),
      {
        doc: go.doc(`${response.typeName} is the response ${statusText}.${description ? `\n\n${description}` : ''}`),
      },
    );
  }

  /**
   * Builds the method writing a response. It marshals a JSON body with `marshalJSON`, sets the headers, and then writes
   * the status and the body. A text body is written as bytes, and a raw body is streamed. A response without a body is
   * written with an empty content type. The status is the code of the response or, for a variable status, the
   * `StatusCode` field or its fallback.
   * @param _ctx The context of the service to generate.
   * @param args The operation and the response whose write method is built.
   * @returns The declaration of the write method.
   */
  protected getResponseWriteMethod(_ctx: Context, args: Args.GetResponseWriteMethod): go.Function<Builder> {
    const { operation, response } = args;
    const status =
      response.status.kind === 'fixed'
        ? String(response.status.code)
        : `statusOrDefault(v.StatusCode, ${response.status.fallback})`;
    const contentType = toGoStringLiteral(response.body?.contentType ?? '');
    const statements: AppendValue<Builder>[] = [];

    if (response.body?.kind === 'json') {
      statements.push(s<Builder>`body, err := marshalJSON(v.Body)
        if err != nil {
        \treturn err
        }`);
    }

    let headers = 'responseHeaders(v.Headers)';
    if (response.headers.length > 0) {
      statements.push(`headers := ${headers}`);
      for (const x of response.headers) {
        const name = toGoStringLiteral(x.header.name);
        if (x.type instanceof go.Slice && !go.refs.byte.matches(x.type.elementType)) {
          statements.push(`setHeaderValues(headers, ${name}, v.${x.fieldName})`);
        } else {
          statements.push(
            `setHeaderValue(headers, ${name}, ${x.type instanceof go.Pointer ? '' : '&'}v.${x.fieldName})`,
          );
        }
      }
      headers = 'headers';
    }

    switch (response.body?.kind) {
      case 'json':
        statements.push(`return writeResponse(w, ${status}, ${headers}, ${contentType}, body)`);
        break;
      case 'text':
        statements.push(`return writeResponse(w, ${status}, ${headers}, ${contentType}, []byte(v.Body))`);
        break;
      case 'raw':
        statements.push(`return writeStreamResponse(w, ${status}, ${headers}, ${contentType}, v.Body)`);
        break;
      default:
        statements.push(`return writeResponse(w, ${status}, ${headers}, "", nil)`);
    }

    return go.function(operation.writeMethodName, {
      receiver: go.parameter('v', response.typeName),
      parameters: [go.parameter('w', httpResponseWriter())],
      results: [go.parameter(null, go.refs.error())],
      body: appendValueGroup(statements, '\n'),
    });
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
