import { OpenApiTransformerContext } from './types.js';
import { isNullish } from '../helpers.js';
import { ApiSchemaAccessibility, ApiSchema, ApiSchemaProperty } from '../types.js';

export function determineSchemaKind<
  T extends { oneOf?: unknown; allOf?: unknown; anyOf?: unknown; type?: string | string[] }
>(
  schema: T
):
  | 'oneOf'
  | 'combined'
  | (Extract<T['type'], string[]> extends never ? never : 'multi-type')
  | 'unknown'
  | Extract<T['type'], string> {
  if (schema.oneOf) {
    return 'oneOf';
  } else if (schema.allOf || schema.anyOf) {
    return 'combined';
  } else if (schema.type) {
    if (Array.isArray(schema.type)) return 'multi-type' as any;
    return schema.type as any;
  }

  return 'unknown';
}

export function determineSchemaName(
  schema: {
    title?: string;
    $src: { path: string };
  },
  id: string
): { name: string; isGenerated: boolean } {
  if (schema.title) return { name: schema.title, isGenerated: false };
  if (schema.$src.path.startsWith('/components/schemas/')) {
    return { name: schema.$src.path.substring('/components/schemas/'.length), isGenerated: false };
  }
  if (schema.$src.path.startsWith('/definitions/')) {
    return { name: schema.$src.path.substring('/definitions/'.length), isGenerated: false };
  }
  const responseMatch = schema.$src.path.match(
    /\/paths\/(?<path>.+)\/(?<method>.+)\/responses\/(?<status>\d+)\//
  );

  if (responseMatch && responseMatch.groups) {
    const { path, method, status } = responseMatch.groups;
    return { name: `${method}_${path.replace(/\//g, '_')}_${status}_Response`, isGenerated: true };
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

export function getCustomFields(schema: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in schema) {
    if (key.startsWith('x-')) {
      const name = key.substring(2);
      result[name] = schema[key];
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

export function transformAdditionalProperties<
  T extends {
    additionalProperties?: any;
  }
>(
  context: OpenApiTransformerContext,
  schema: T,
  transformSchema: (
    context: OpenApiTransformerContext,
    schema: Exclude<T['additionalProperties'], undefined | boolean>
  ) => ApiSchema
): boolean | ApiSchema | undefined {
  if (isNullish(schema.additionalProperties)) return undefined;
  if (typeof schema.additionalProperties === 'boolean') return schema.additionalProperties;
  return transformSchema(context, schema.additionalProperties);
}

export function transformSchemaProperties<
  T extends { properties?: Record<string, any>; required?: string[] }
>(
  context: OpenApiTransformerContext,
  schema: T,
  transformSchema: (
    context: OpenApiTransformerContext,
    schema: Exclude<T['properties'], undefined>[string]
  ) => ApiSchema
): ApiSchemaProperty[] {
  if (!schema.properties) return [];
  const result: ApiSchemaProperty[] = [];
  for (const name of Object.keys(schema.properties)) {
    if (name === '$src') continue;
    result.push({
      name,
      required: schema.required?.includes(name) ?? false,
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
