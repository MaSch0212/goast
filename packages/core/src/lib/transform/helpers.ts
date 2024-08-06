import { ApiSchemaKind, ApiSchemaAccessibility, ApiSchema, ApiSchemaProperty } from './api-types';
import { OpenApiTransformerContext } from './types';
import { isOpenApiObjectProperty } from '../internal-utils';
import { Deref, OpenApiDocument, OpenApiObject } from '../parse';
import { getDeepProperty } from '../utils';
import { isNullish } from '../utils/common.utils';

export function determineSchemaKind<
  T extends {
    oneOf?: unknown;
    allOf?: unknown;
    anyOf?: unknown;
    type?: string | string[];
    properties?: Record<string, unknown>;
  },
>(ctx: OpenApiTransformerContext, schema: T): ApiSchemaKind {
  if (schema.oneOf) {
    return 'oneOf';
  } else if (schema.type !== 'object' && (schema.allOf || schema.anyOf)) {
    return 'combined';
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

export function determineSchemaName(
  schema: {
    title?: string;
    $src: { path: string; document: Deref<OpenApiDocument> };
  },
  id: string,
): { name: string; isGenerated: boolean } {
  if (schema.title) return { name: schema.title, isGenerated: false };
  if (!schema.$src) {
    console.log('woot?');
  }
  const schemaNameMatch = schema.$src.path.match(/(?<=\/components\/schemas\/|\/definitions\/)[^/]+$/i);
  if (schemaNameMatch) {
    return { name: schemaNameMatch[0], isGenerated: false };
  }

  const responseMatch = schema.$src.path.match(/\/paths\/(?<path>.+)\/(?<method>.+)\/responses\/(?<status>\d+)\//);
  if (responseMatch && responseMatch.groups) {
    const { path, method, status } = responseMatch.groups;
    return { name: `${method}_${path.replace(/\//g, '_')}_${status}_Response`, isGenerated: true };
  }

  const requestBodyMatch = schema.$src.path.match(/\/paths\/(?<path>.+)\/(?<method>.+)\/requestBody\//);
  if (requestBodyMatch && requestBodyMatch.groups) {
    const { path, method } = requestBodyMatch.groups;
    return { name: `${method}_${path.replace(/\//g, '_')}_Request`, isGenerated: true };
  }

  const parentSchemaMatch = schema.$src.path.match(/(.*)\/properties\/([^/]*)$/);
  if (parentSchemaMatch) {
    const parentSchema = getDeepProperty(schema.$src.document, parentSchemaMatch[1].split('/').filter(Boolean));
    const parentSchemaName = determineSchemaName(
      { title: (parentSchema as any)?.title, $src: { path: parentSchemaMatch[1], document: schema.$src.document } },
      id,
    );
    if (!parentSchemaName.isGenerated) {
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
