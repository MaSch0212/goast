import {
  type ApiContent,
  type ApiParameter,
  type ApiResponse,
  type ApiSchema,
  type AppendValue,
  appendValueGroup,
  type AppendValueGroup,
  builderTemplate as s,
  DEFAULT_IGNORED_SCHEMA_PROPERTIES,
  getSchemaReference,
  getSourceDisplayName,
  type MaybePromise,
  notNullish,
  type Nullable,
  resolveAnyOfAndAllOf,
  SourceBuilder,
} from '@goast/core';

import { go } from '../../ast/index.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import { getSourceDocLine, isJsonMediaType, modifyString, toGoFileName, toGoStringLiteral } from '../../utils.ts';
import { GoFileGenerator } from '../file-generator.ts';
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

export interface GoServerGenerator<TOutput extends Output = Output> {
  generate(ctx: Context): MaybePromise<TOutput>;
}

/**
 * Generates the server code of one service (tag): an interface with a method per operation, the types of their
 * requests and responses, and a function registering a handler per operation on a `*http.ServeMux`.
 */
export class DefaultGoServerGenerator extends GoFileGenerator<Context, Output> implements GoServerGenerator {
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
    const operations = ctx.service.endpoints.map((endpoint) => {
      console.log(`  - ${getSourceDisplayName(ctx.data, endpoint)}`);
      return this.getOperation(ctx, { endpoint });
    });

    const builder = new GoFileBuilder(pkg.name, pkg.importPath, ctx.config);
    builder.append(this.getFileContent(ctx, { interfaceName, registerFunctionName, operations }));
    builder.writeToFile(filePath);

    return {
      serviceInterface: go.reference(interfaceName, pkg.importPath, { packageName: pkg.name }),
      registerFunction: go.reference(registerFunctionName, pkg.importPath, { packageName: pkg.name }),
    };
  }

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
  /** The plan for an endpoint, computed once per run, so every service it belongs to agrees on its names. */
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

  /** The parameters the request struct can hold: those in the path, query, headers and cookies. */
  protected getParameters(_ctx: Context, args: Args.GetParameters): ApiParameter[] {
    return args.endpoint.parameters.filter(
      (x) => x.target === 'path' || x.target === 'query' || x.target === 'header' || x.target === 'cookie',
    );
  }
  // #endregion

  // #region Route
  /**
   * The route pattern of the endpoint. A path parameter that is a whole segment becomes a wildcard. A segment holding
   * a parameter and other text (`{id}.json`) becomes a wildcard for the whole segment, and the parameter is taken from
   * it with a regular expression, because a `http.ServeMux` wildcard always spans a whole segment.
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

  /** Percent-encodes the characters a literal segment of a `http.ServeMux` pattern cannot contain as they are. */
  protected escapePathSegment(segment: string): string {
    return segment.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@%]/g, (x) => encodeURIComponent(x));
  }

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

  /** `if <target>, err = <call>; err != nil { return req, err }` */
  protected getDecodeStatement(_ctx: Context, args: Args.GetDecodeStatement): AppendValue<Builder> {
    return s<Builder>`if ${args.target}, err = ${args.call}; err != nil {
      \treturn req, err
      }`;
  }

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

  /** The expression for the raw values of a parameter, as the runtime functions for its location return them. */
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

  protected getParameterDecoding(ctx: Context, args: Args.GetParameterDecoding): GoValueDecoding | null {
    const { parameter } = args;
    return this.getValueDecoding(ctx, {
      schema: parameter.schema,
      required: parameter.required || parameter.target === 'path',
      allowJson: false,
    });
  }

  /**
   * How a value is decoded, or `null` if it cannot be: a primitive (or an enum of one) is parsed from its text, as is
   * each item of an array of primitives. With `allowJson`, anything else is parsed as JSON, as a form field holding
   * an object can only be.
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

  /** The runtime function parsing the text of a primitive value, `null` if the schema is not a primitive. */
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

  /** The literal of the default value of a primitive, `null` if there is none or it has no literal. */
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

  protected getBodyKind(_ctx: Context, args: Args.GetBodyKind): GoOperationBody['kind'] {
    const type = args.content.type.toLowerCase();
    if (isJsonMediaType(type)) return 'json';
    if (type === 'application/x-www-form-urlencoded') return 'form';
    if (type.startsWith('multipart/')) return 'multipart';
    if (type.startsWith('text/')) return 'text';
    return 'raw';
  }

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

  protected getMultipartFieldDecoding(
    ctx: Context,
    args: Args.GetMultipartFieldDecoding,
  ): GoBodyField['decoding'] | null {
    const { required } = args;
    const schema = this.resolveSchema(ctx, { schema: args.schema });
    const isFile = (x: Nullable<ApiSchema>) => x?.kind === 'string' && x.format === 'binary';
    if (isFile(schema)) {
      return { mode: 'file', fieldType: go.pointer(multipartFileHeader()), required };
    }
    if (schema?.kind === 'array' && isFile(this.resolveSchema(ctx, { schema: schema.items }))) {
      return { mode: 'files', fieldType: go.slice(go.pointer(multipartFileHeader())), required };
    }
    return this.getValueDecoding(ctx, { schema: args.schema, required, allowJson: true });
  }

  /**
   * Decodes the body by its media type. A request without a `Content-Type` is decoded as the first media type of the
   * API description; one with an undeclared media type is rejected with 415 Unsupported Media Type.
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

  /** The body of a response: of its first JSON media type if it has one, otherwise of its first media type. */
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
  /** The type the models generator generated for the schema. */
  protected getSchemaType(ctx: Context, args: Args.GetSchemaType): Type {
    return ctx.input.go.models[args.schema.id]?.type ?? go.refs.any();
  }

  /** The schema a schema refers to, without a `oneOf` that only makes it nullable. */
  protected resolveSchema(_ctx: Context, args: Args.ResolveSchema): ApiSchema | undefined {
    let { schema } = args;
    if (!schema) return undefined;
    schema = getSchemaReference(schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
    if (schema.kind === 'oneOf' && schema.oneOf.length === 2 && schema.oneOf.some((x) => x.kind === 'null')) {
      schema = getSchemaReference(
        schema.oneOf.find((x) => x.kind !== 'null')!,
        DEFAULT_IGNORED_SCHEMA_PROPERTIES,
      );
    }
    return schema;
  }

  /** The object a schema describes, with the properties of its compositions merged, `null` if it is no object. */
  protected getObjectSchema(ctx: Context, args: Args.GetObjectSchema): ApiSchema<'object'> | null {
    const schema = this.resolveSchema(ctx, { schema: args.schema });
    if (!schema || (schema.kind !== 'object' && schema.kind !== 'combined')) return null;
    const merged = resolveAnyOfAndAllOf(schema, true);
    if (merged) return merged;
    return schema.kind === 'object' ? schema : null;
  }

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
