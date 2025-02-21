import type { ApiSchemaKind } from '../api-types.ts';
import type { OpenApiTransformerContext } from '../types.ts';

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
  if (schema.oneOf) {
    return 'oneOf';
  } else if (schema.type !== 'object' && (schema.allOf || schema.anyOf)) {
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
