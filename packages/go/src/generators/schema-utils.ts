import {
  type ApiSchema,
  DEFAULT_IGNORED_SCHEMA_PROPERTIES,
  getSchemaReference,
  type Nullable,
  resolveAnyOfAndAllOf,
} from '@goast/core';

import { isJsonMediaType } from '../utils.ts';

/**
 * Resolves a schema to the schema it refers to. A `oneOf` of exactly two schemas, one of them `null`, is unwrapped to
 * the other schema, because it only makes the schema nullable.
 * @param schema The schema to resolve.
 * @returns The resolved schema, or `undefined` if no schema is given.
 */
export function resolveGoSchema(schema: Nullable<ApiSchema>): ApiSchema | undefined {
  if (!schema) return undefined;
  let resolved = getSchemaReference(schema, DEFAULT_IGNORED_SCHEMA_PROPERTIES);
  if (resolved.kind === 'oneOf' && resolved.oneOf.length === 2 && resolved.oneOf.some((x) => x.kind === 'null')) {
    resolved = getSchemaReference(
      resolved.oneOf.find((x) => x.kind !== 'null')!,
      DEFAULT_IGNORED_SCHEMA_PROPERTIES,
    );
  }
  return resolved;
}

/**
 * Gets the object a schema describes, with the properties of its compositions merged in where they can be merged. The
 * schema is resolved first.
 * @param schema The schema of the object.
 * @returns The object schema, or `null` if the schema does not describe an object.
 */
export function getGoObjectSchema(schema: Nullable<ApiSchema>): ApiSchema<'object'> | null {
  const resolved = resolveGoSchema(schema);
  if (!resolved || (resolved.kind !== 'object' && resolved.kind !== 'combined')) return null;
  const merged = resolveAnyOfAndAllOf(resolved, true);
  if (merged) return merged;
  return resolved.kind === 'object' ? resolved : null;
}

/**
 * Gets the kind of a body by its media type: `json` for JSON, `form` for URL-encoded forms, `multipart` for
 * multipart, `text` for `text/*`, and `raw` for anything else, which is read as a stream.
 * @param mediaType The media type of the body.
 * @returns The kind of the body.
 */
export function getGoBodyKind(mediaType: string): 'json' | 'form' | 'multipart' | 'text' | 'raw' {
  const type = mediaType.toLowerCase();
  if (isJsonMediaType(type)) return 'json';
  if (type === 'application/x-www-form-urlencoded') return 'form';
  if (type.startsWith('multipart/')) return 'multipart';
  if (type.startsWith('text/')) return 'text';
  return 'raw';
}

/**
 * Checks whether a schema describes a file, which is a string in the `binary` format. The schema is resolved first.
 * @param schema The schema to check.
 * @returns `true` if the schema describes a file, `false` otherwise.
 */
export function isGoFileSchema(schema: Nullable<ApiSchema>): boolean {
  const resolved = resolveGoSchema(schema);
  return resolved?.kind === 'string' && resolved.format === 'binary';
}
