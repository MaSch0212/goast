import {
  type ApiContent,
  type ApiEndpoint,
  type ApiSchema,
  type ApiService,
  createOverwriteProxy,
  notNullish,
  SourceBuilder,
  toCasing,
} from '@goast/core';

import { cs } from '../../../ast/index.ts';
import { getSourceDocLine, modifyString, toCSharpPropertyName } from '../../../utils.ts';
import type { CSharpServerContext } from './server-config.ts';

/** The reason phrases of the HTTP status codes a factory or case type can be named after. */
const reasonPhrases: Record<number, string> = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  103: 'Early Hints',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi Status',
  208: 'Already Reported',
  226: 'IM Used',
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'Uri Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: 'Im A Teapot',
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'Http Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  510: 'Not Extended',
  511: 'Network Authentication Required',
};

/**
 * The PascalCase name of a response key: `200` -> `Ok`, `404` -> `NotFound`, `2XX` -> `Status2XX`,
 * `default` -> `Default`. Unknown codes are named `Status<code>`.
 */
export function getStatusName(statusKey: string): string {
  const key = statusKey.trim();
  if (key.toLowerCase() === 'default') return 'Default';
  if (/^[1-5][xX]{2}$/.test(key)) return `Status${key.toUpperCase()}`;
  const phrase = reasonPhrases[Number(key)];
  return phrase ? toCasing(phrase, 'pascal') : `Status${key.replace(/[^A-Za-z0-9]/g, '')}`;
}

/** Whether a media type carries JSON: `application/json`, `text/json` and every `+json` structured syntax. */
export function isJsonMediaType(mediaType: string): boolean {
  const type = mediaType.split(';')[0].trim().toLowerCase();
  return type === 'application/json' || type === 'text/json' || type.endsWith('+json');
}

/** Whether a media type is `multipart/*`. */
export function isMultipartMediaType(mediaType: string): boolean {
  return mediaType.split(';')[0].trim().toLowerCase().startsWith('multipart/');
}

/**
 * Hands out identifiers that are unique among everything handed out so far (and an optional list of reserved
 * names): the second use of `id` becomes `id_2`, then `id_3`, ...
 */
export class UniqueNames {
  private readonly used = new Set<string>();

  constructor(reserved: Iterable<string> = []) {
    for (const name of reserved) this.used.add(name.replace(/^@/, ''));
  }

  public next(base: string): string {
    const plain = base.replace(/^@/, '');
    let name = plain;
    for (let i = 2; this.used.has(name); i++) name = `${plain}_${i}`;
    this.used.add(name);
    return name === plain ? base : name;
  }
}

/** A C# identifier for a name that has been cased already: invalid characters are dropped, a leading digit or keyword is made valid. */
export function toIdentifier(name: string, fallback: string): string {
  const identifier = name.replace(/[^\p{L}\p{Nd}_]/gu, '');
  if (identifier === '') return fallback;
  return toCSharpPropertyName(identifier);
}

// #region Naming
/** The name of the generated result type of an endpoint: `GetPet` -> `GetPetResult`. */
export function getResultTypeName(ctx: CSharpServerContext, endpoint: ApiEndpoint): string {
  return toIdentifier(toCasing(`${endpoint.name}_Result`, ctx.config.typeNameCasing), 'EndpointResult');
}

/** The name of the abstract handler method of an endpoint: `GetPet` -> `GetPetAsync`. */
export function getHandlerMethodName(ctx: CSharpServerContext, endpoint: ApiEndpoint): string {
  return toIdentifier(toCasing(`${endpoint.name}_Async`, ctx.config.methodNameCasing), 'HandleAsync');
}

/** The namespace of generated server code of a service. */
export function getServerNamespace(ctx: CSharpServerContext, service: ApiService | null): string {
  const suffix =
    typeof ctx.config.namespaceSuffix === 'string' ? ctx.config.namespaceSuffix : ctx.config.namespaceSuffix(service);
  return ctx.config.rootNamespace + suffix;
}
// #endregion

// #region Paths
/**
 * The base path of a service, without leading or trailing slashes: the path of the first server of the spec
 * (`https://api.example.com/v1` -> `v1`), modified by the `basePath` config.
 */
export function getBasePath(ctx: CSharpServerContext, service: ApiService): string {
  const serverUrl = (service.$src ?? service.endpoints[0]?.$src)?.document.servers?.[0]?.url ?? '/';
  const modified = modifyString(serverPathOf(serverUrl), ctx.config.basePath, service);
  return modified.replace(/^\/+|\/+$/g, '');
}

function serverPathOf(url: string): string {
  const withoutOrigin = url.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/]*/, '');
  // A server variable (`{version}`) cannot be a route constant, and neither can a relative url.
  return withoutOrigin.includes('{') ? '/' : withoutOrigin;
}

/** The path of an endpoint (`pathModifier` applied), without a leading slash. */
export function getEndpointPath(ctx: CSharpServerContext, endpoint: ApiEndpoint): string {
  return modifyString(endpoint.path, ctx.config.pathModifier, endpoint).replace(/^\/+/, '');
}

/**
 * Makes a path usable as an ASP.NET Core route template: `[` and `]` are replacement tokens there and are doubled
 * to be literal. `{name}` parameters are kept; their binding name is the wire name.
 */
export function toRouteTemplate(path: string): string {
  return path.replace(/\[/g, '[[').replace(/\]/g, ']]');
}
// #endregion

// #region Types
/** The type the models generator declared for a schema. */
export function getSchemaType(
  ctx: CSharpServerContext,
  schema: ApiSchema | undefined,
): cs.Reference<SourceBuilder> | undefined {
  return schema ? ctx.input.csharp.models[schema.id]?.type : undefined;
}

/**
 * The type of a schema with the given nullability applied (`undefined` keeps the schema's own nullability).
 * `fallback` is used when the schema has no type.
 */
export function getTypeUsage(
  ctx: CSharpServerContext,
  schema: ApiSchema | undefined,
  nullable?: boolean,
  fallback?: cs.Reference<SourceBuilder>,
): cs.Reference<SourceBuilder> {
  const type = getSchemaType(ctx, schema);
  return type
    ? createOverwriteProxy(type, { nullable: nullable ?? type.nullable })
    : (fallback ?? cs.refs.system.object({ nullable }));
}

/** The type of a content option: its schema's type, or `JsonElement` (JSON) / `Stream` (anything else) without one. */
export function getContentBodyType(ctx: CSharpServerContext, content: ApiContent): cs.Reference<SourceBuilder> {
  const type = getSchemaType(ctx, content.schema);
  if (type) return type;
  return isJsonMediaType(content.type) ? cs.refs.systemTextJson.jsonElement() : cs.refs.system.stream();
}

/** A key that is equal for equal types (name, namespace, generic arguments and nullability). */
export function getTypeKey(type: cs.Reference<SourceBuilder>): string {
  return SourceBuilder.build((b) => cs.reference.write(b, type)) + `@${type.namespace ?? ''}`;
}

/** The same type with its nullability set. */
export function withNullable(type: cs.Reference<SourceBuilder>, nullable: boolean): cs.Reference<SourceBuilder> {
  return createOverwriteProxy(type, { nullable });
}
// #endregion

// #region Docs
/** The doc description of an endpoint: its summary and description plus, if configured, the source location. */
export function getEndpointDocDescription(ctx: CSharpServerContext, endpoint: ApiEndpoint): string {
  const segments = [endpoint.summary?.trim(), endpoint.description?.trim()].filter(notNullish).filter((x) => x !== '');
  const unique = segments.filter((x, i) => segments.indexOf(x) === i);
  if (ctx.config.includeSourceInDocs) unique.push(getSourceDocLine(endpoint));
  return unique.join('\n\n');
}
// #endregion
