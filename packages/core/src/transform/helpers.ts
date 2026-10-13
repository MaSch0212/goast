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
    const hasProperties = (schema.properties && Object.keys(schema.properties).length > 0) ||
      schema.additionalProperties;
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

  const treadAsObject = ctx.config.unknownTypeBehavior === 'always-object' ||
    (ctx.config.unknownTypeBehavior === 'object-if-properties' &&
      schema.properties &&
      Object.keys(schema.properties).length > 0);

  return treadAsObject ? 'object' : 'unknown';
}

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
        title: typeof parentSchema === 'object' && parentSchema !== null && 'title' in parentSchema
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

export function determineEndpointName(endpointInfo: {
  method: string;
  path: string;
  operation: { operationId?: string };
}): string {
  if (endpointInfo.operation.operationId) return endpointInfo.operation.operationId;
  return endpointInfo.method + endpointInfo.path.replace(/\{([^}]+)\}/g, ':$1').replace(/\//g, '_');
}

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

export class IdGenerator {
  private readonly _idMap = new Map<string, number>();

  public generateId(name: string): string {
    const id = this._idMap.get(name) ?? 1;
    this._idMap.set(name, id + 1);
    return `${name}-${id}`;
  }
}

export function getOpenApiObjectIdentifier(obj: Deref<OpenApiObject<string>>) {
  return obj.$src.file + '#' + obj.$src.path;
}
