import { parse as parsePath } from 'node:path';
import { isOpenApiObjectProperty } from '../internal-utils.ts';
import type { OpenApiHttpMethod, OpenApiObject } from '../parse/openapi-types.ts';
import type { Deref, DerefSource } from '../parse/types.ts';
import { isNullish } from '../utils/common.utils.ts';
import { getDeepProperty } from '../utils/object.utils.ts';
import { getLineInfo } from '../utils/yaml-info.ts';
import type { ApiSchema, ApiSchemaAccessibility, ApiSchemaKind, ApiSchemaProperty } from './api-types.ts';
import type { OpenApiTransformerContext } from './types.ts';

/** Normalizes a `type` keyword to an array, so a scalar type and a 3.1 type array can be treated alike. */
export function asTypeArray(type: string | string[] | undefined | null): string[] {
  if (isNullish(type)) return [];
  return Array.isArray(type) ? type : [type];
}

// OpenAPI 3.1 allows `type: [~]`, which YAML parses to `null` rather than to the string `'null'`.
function isNullType(type: string | null): boolean {
  return type === 'null' || type === null;
}

/** The declared types with every `null` member removed. */
export function withoutNullType(types: (string | null)[]): string[] {
  return types.filter((t): t is string => !isNullType(t));
}

/** Whether the `type` keyword declares `null`, either as a scalar type or as a member of a 3.1 type array. */
export function hasNullType(type: string | string[] | undefined | null): boolean {
  return asTypeArray(type).some(isNullType);
}

/**
 * Determines the `ApiSchemaKind` of a schema from its keywords. `oneOf` is checked first, then `allOf`/`anyOf`
 * (unless the schema is typed `object`), then type arrays, then the scalar `type`. A schema with `allOf`/`anyOf`
 * is `object` if it also declares properties and `combined` otherwise.
 * @template T The schema-like object type that provides the keywords the kind is derived from.
 * @param ctx The transformer context, whose `unknownTypeBehavior` decides schemas without a recognised type.
 * @param schema The schema to classify.
 * @returns The kind of the schema.
 */
export function determineSchemaKind<
  T extends {
    oneOf?: unknown;
    allOf?: unknown;
    anyOf?: unknown;
    type?: string | string[];
    properties?: Record<string, unknown>;
    additionalProperties?: unknown;
  },
>(ctx: OpenApiTransformerContext, schema: T): ApiSchemaKind {
  // An OpenAPI 3.1 type array that reduces to at most one non-null type is normalised away by
  // `transformSchema`, which replaces `type` with the narrowed scalar (or `'null'`) and then asks this
  // function again. Such an array therefore has to reach the `multi-type` branch below *before* the
  // `allOf`/`anyOf` branch can claim it as `combined`, because a type array is 3.1's only way of expressing
  // nullability and it would otherwise never be looked at. The second pass gives the `allOf`/`anyOf` branch
  // its chance, this time with a scalar type it can judge correctly.
  //
  // A type array with two or more non-null members is *not* normalised away: nothing re-asks, so it must keep
  // falling through to the `allOf`/`anyOf` branch exactly as it always has. Its nullability is picked up by
  // `transformSchema` from the type as declared instead.
  const narrowsToSingleType = Array.isArray(schema.type) && withoutNullType(schema.type).length <= 1;

  if (schema.oneOf) {
    return 'oneOf';
  } else if (!narrowsToSingleType && schema.type !== 'object' && (schema.allOf || schema.anyOf)) {
    const hasProperties =
      (schema.properties && Object.keys(schema.properties).length > 0) || schema.additionalProperties;
    return hasProperties ? 'object' : 'combined';
  } else if (Array.isArray(schema.type)) {
    return 'multi-type';
  } else if (
    schema.type === 'object' ||
    schema.type === 'string' ||
    schema.type === 'boolean' ||
    schema.type === 'null' ||
    schema.type === 'number' ||
    schema.type === 'integer' ||
    schema.type === 'array'
  ) {
    return schema.type;
  }

  const treadAsObject =
    ctx.config.unknownTypeBehavior === 'always-object' ||
    (ctx.config.unknownTypeBehavior === 'object-if-properties' &&
      schema.properties &&
      Object.keys(schema.properties).length > 0);

  return treadAsObject ? 'object' : 'unknown';
}

/**
 * Derives the name of a schema. A `title` takes precedence. Otherwise the name comes from the schema's place in the
 * document: its component or `definitions` key, a parameter, response or request body, or its parent property.
 * @param schema The schema with its `$src` location and optional `title`.
 * @param id The generated identifier, used as the name when nothing better can be derived.
 * @returns The name, and whether it was generated rather than taken from the document.
 */
export function determineSchemaName(
  schema: {
    title?: string;
    $src: DerefSource<unknown>;
  },
  id: string,
): { name: string; isGenerated: boolean } {
  if (schema.title) return { name: schema.title, isGenerated: false };

  if (schema.$src.path === '/') return { name: parsePath(schema.$src.file).name, isGenerated: true };

  const schemaNameMatch = schema.$src.path.match(/(?<=\/components\/schemas\/|\/definitions\/)[^/]+$/i);
  if (schemaNameMatch) {
    return { name: schemaNameMatch[0], isGenerated: false };
  }

  const paramNameMatch = schema.$src.path.match(/\/components\/parameters\/([^/]+)\/schema$/i);
  if (paramNameMatch) {
    return { name: paramNameMatch[1], isGenerated: true };
  }

  const responseMatch = schema.$src.path.match(/\/paths\/(?<path>.+)\/(?<method>.+)\/responses\/(?<status>\d+)\//);
  if (responseMatch && responseMatch.groups) {
    const { path, method, status } = responseMatch.groups;
    const operation = schema.$src.document.paths?.[path]?.[method as OpenApiHttpMethod] ?? {};
    return {
      name: `${determineEndpointName({ method, path: `/${path}`, operation })}_${status}_Response`,
      isGenerated: true,
    };
  }

  const responseCompMatch = schema.$src.path.match(/\/components\/responses\/([^/]+)\/content\/.+\/schema/);
  if (responseCompMatch) {
    return {
      name: responseCompMatch[1].toLowerCase().endsWith('response')
        ? responseCompMatch[1]
        : responseCompMatch[1] + 'Response',
      isGenerated: true,
    };
  }

  const requestBodyMatch = schema.$src.path.match(/\/paths\/(?<path>.+)\/(?<method>.+)\/requestBody\//);
  if (requestBodyMatch && requestBodyMatch.groups) {
    const { path, method } = requestBodyMatch.groups;
    const operation = schema.$src.document.paths?.[path]?.[method as OpenApiHttpMethod] ?? {};
    return { name: `${determineEndpointName({ method, path: `/${path}`, operation })}_Request`, isGenerated: true };
  }

  const parentSchemaMatch = schema.$src.path.match(/(.*)\/properties\/([^/]*)(\/additionalProperties)?$/);
  if (parentSchemaMatch) {
    const parentSchema = getDeepProperty(schema.$src.document, parentSchemaMatch[1].split('/').filter(Boolean));
    const parentSchemaName = determineSchemaName(
      {
        title:
          typeof parentSchema === 'object' && parentSchema !== null && 'title' in parentSchema
            ? String(parentSchema.title)
            : undefined,
        $src: {
          file: schema.$src.file,
          pos: getLineInfo(schema.$src.document, parentSchemaMatch[1].split('/').filter(Boolean)),
          path: parentSchemaMatch[1],
          document: schema.$src.document,
          originalComponent: parentSchema,
        },
      },
      id,
    );
    // Continue the chain as long as the parent has a name of its own. Generated parent names are fine to build
    // on — that is what makes a third-level inline object `Parent_middle_inner` instead of an opaque ordinal.
    // Only the `id` fallback below is unusable, because it carries no information about the schema at all.
    if (parentSchemaName.name !== id) {
      return { name: `${parentSchemaName.name}_${parentSchemaMatch[2]}`, isGenerated: true };
    }
  }

  return { name: id, isGenerated: true };
}

/**
 * Maps the `readOnly` and `writeOnly` flags of a schema to its accessibility. Setting both flags yields `none`.
 * @param schema The schema whose flags are read.
 * @returns The accessibility of the schema.
 */
export function determineSchemaAccessibility(schema: {
  readOnly?: boolean;
  writeOnly?: boolean;
}): ApiSchemaAccessibility {
  if (schema.readOnly === true) {
    return schema.writeOnly === true ? 'none' : 'readOnly';
  } else {
    return schema.writeOnly === true ? 'writeOnly' : 'all';
  }
}

/**
 * Narrows an accessibility that is already known by the flags of another schema, such as one reached through `allOf`.
 * A flag that contradicts the current accessibility yields `none`, and `all` takes the flags of the schema.
 * @param accessibility The accessibility determined so far.
 * @param schema The schema whose flags are merged in.
 * @returns The combined accessibility.
 */
export function updateSchemaAccessibility(
  accessibility: ApiSchemaAccessibility,
  schema: {
    readOnly?: boolean;
    writeOnly?: boolean;
  },
): ApiSchemaAccessibility {
  if (accessibility === 'none') return 'none';
  if (accessibility === 'readOnly') return schema.writeOnly === true ? 'none' : 'readOnly';
  if (accessibility === 'writeOnly') return schema.readOnly === true ? 'none' : 'writeOnly';
  return determineSchemaAccessibility(schema);
}

type CustomFields<T extends Record<string, unknown>> = {
  [K in keyof T as K extends `x-${string}` ? K : never]: T[K];
};

/**
 * Collects the `x-` extension fields of an OpenAPI object. The prefix is removed from each key, so `x-foo`
 * becomes `foo`.
 * @template T The type of the OpenAPI object.
 * @param schema The OpenAPI object to read the extensions from.
 * @returns The extensions, keyed by their name without the `x-` prefix.
 */
export function getCustomFields<T extends Record<string, unknown>>(schema: T): CustomFields<T> {
  const result = {} as CustomFields<T>;
  for (const key in schema) {
    if (key.startsWith('x-')) {
      const name = key.substring(2);
      (result as Record<string, unknown>)[name] = schema[key];
    }
  }
  return result;
}

/**
 * Determines the name of an endpoint. The `operationId` is used if present. Otherwise the name is built from the method
 * and the path, with `{param}` turned into `:param` and slashes into underscores, such as `get_pets_:id`.
 * @param endpointInfo The method, path and operation of the endpoint.
 * @returns The name of the endpoint.
 */
export function determineEndpointName(endpointInfo: {
  method: string;
  path: string;
  operation: { operationId?: string };
}): string {
  if (endpointInfo.operation.operationId) return endpointInfo.operation.operationId;
  return endpointInfo.method + endpointInfo.path.replace(/\{([^}]+)\}/g, ':$1').replace(/\//g, '_');
}

/**
 * Transforms the `additionalProperties` keyword. A boolean is returned as written and a schema is transformed.
 * @template TAdditionalProperties The raw type of the `additionalProperties` keyword.
 * @param context The transformer context.
 * @param schema The schema that may declare `additionalProperties`.
 * @param transformSchema The function that transforms a schema object.
 * @returns `undefined` if the keyword is absent, the boolean as written, or the transformed schema.
 */
export function transformAdditionalProperties<TAdditionalProperties>(
  context: OpenApiTransformerContext,
  schema: {
    additionalProperties?: TAdditionalProperties;
  },
  transformSchema: (
    context: OpenApiTransformerContext,
    schema: Exclude<TAdditionalProperties, undefined | boolean>,
  ) => ApiSchema,
): boolean | ApiSchema | undefined {
  if (isNullish(schema.additionalProperties)) return undefined;
  if (typeof schema.additionalProperties === 'boolean') return schema.additionalProperties;
  return transformSchema(context, schema.additionalProperties as Exclude<TAdditionalProperties, undefined | boolean>);
}

/**
 * Transforms the `properties` of a schema into a map keyed by property name. Keys starting with `$` or `x-`
 * are skipped.
 * @template TProperties The raw type of a property schema.
 * @param context The transformer context.
 * @param schema The schema that may declare `properties`.
 * @param transformSchema The function that transforms a property schema.
 * @returns The transformed properties, or an empty map if the schema declares none.
 */
export function transformSchemaProperties<TProperties>(
  context: OpenApiTransformerContext,
  schema: { properties?: Record<string, TProperties>; required?: string[] },
  transformSchema: (context: OpenApiTransformerContext, schema: TProperties) => ApiSchema,
): Map<string, ApiSchemaProperty> {
  const result = new Map<string, ApiSchemaProperty>();
  if (!schema.properties) return result;
  for (const name of Object.keys(schema.properties)) {
    if (!isOpenApiObjectProperty(name)) continue;
    result.set(name, {
      name,
      schema: transformSchema(context, schema.properties[name]),
    });
  }
  return result;
}

/**
 * Generates identifiers of the form `<name>-<n>`. The counter is kept per name, so identifiers are unique within one
 * transform run.
 */
export class IdGenerator {
  private readonly _idMap = new Map<string, number>();

  /**
   * Generates the next identifier for the given name.
   * @param name The prefix of the identifier, such as `schema` or `endpoint`.
   * @returns The next identifier, such as `schema-1` and then `schema-2`.
   */
  public generateId(name: string): string {
    const id = this._idMap.get(name) ?? 1;
    this._idMap.set(name, id + 1);
    return `${name}-${id}`;
  }
}

/**
 * Builds the key that identifies an OpenAPI object by its source file and JSON path. The transformer uses it to reuse
 * the entries it has already created for the same object.
 * @param obj The OpenAPI object to identify.
 * @returns The key, in the form `file#path`.
 */
export function getOpenApiObjectIdentifier(obj: Deref<OpenApiObject<string>>) {
  return obj.$src.file + '#' + obj.$src.path;
}
