import { parse as parsePath } from 'node:path';
import type { OpenApiHttpMethod } from '../../parse/openapi-types.ts';
import type { DerefSource } from '../../parse/types.ts';
import { getDeepProperty } from '../../utils/object.utils.ts';
import type { ApiSchemaNameSource } from '../api-types.ts';
import { determineEndpointName } from './determine-endpoint-name.ts';

type SchemaName = { name: string; source: ApiSchemaNameSource };
type SchemaLike = { title?: string; $src: DerefSource<unknown> };

export function determineSchemaName(
  schema: SchemaLike,
  id: string,
): SchemaName {
  if (schema.title) return { name: schema.title, source: 'title' };
  if (!schema.$src) return { name: id, source: 'id' };
  return fromFile(schema, id) ??
    fromSchema(schema, id) ??
    fromResponse(schema, id) ??
    fromPathResponse(schema, id) ??
    fromPathRequestBody(schema, id) ??
    fromSchemaProperty(schema, id) ??
    fromSchemaItems(schema, id) ??
    fromSchemaComposition(schema, id) ??
    fromSchemaAdditionalProperties(schema, id) ??
    { name: id, source: 'id' };
}

function fromFile(schema: SchemaLike, _id: string): SchemaName | undefined {
  if (schema.$src.path !== '/') return undefined;

  return { name: parsePath(schema.$src.file).name, source: 'file' };
}

function fromSchema(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/(?<=\/components\/schemas\/|\/definitions\/)[^/]+$/i);
  if (!match) return undefined;

  return { name: match[0], source: 'schema' };
}

function fromResponse(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/\/components\/responses\/([^/]+)\/content\/.+\/schema/i);
  if (!match) return undefined;

  return {
    name: match[1].toLowerCase().endsWith('response') ? match[1] : match[1] + 'Response',
    source: 'response',
  };
}

function fromPathResponse(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/\/paths\/(?<path>.+)\/(?<method>.+)\/responses\/(?<status>\d+)\//i);
  if (!match?.groups) return undefined;

  const { path, method, status } = match.groups;
  const operation = schema.$src.document.paths?.[path]?.[method as OpenApiHttpMethod] ?? {};
  return {
    name: `${determineEndpointName({ method, path: `/${path}`, operation })}_${status}_Response`,
    source: 'path-response',
  };
}

function fromPathRequestBody(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/\/paths\/(?<path>.+)\/(?<method>.+)\/requestBody\//i);
  if (!match?.groups) return undefined;

  const { path, method } = match.groups;
  const operation = schema.$src.document.paths?.[path]?.[method as OpenApiHttpMethod] ?? {};
  return {
    name: `${determineEndpointName({ method, path: `/${path}`, operation })}_Request`,
    source: 'path-request-body',
  };
}

function fromSchemaProperty(schema: SchemaLike, id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/(.*)\/properties\/([^/]*)$/i);
  if (!match) return undefined;

  const parentSchemaName = determineSchemaName(getSchemaFromPath(schema.$src, match[1]), id);
  if (parentSchemaName.source === 'id') return undefined;

  return { name: `${parentSchemaName.name}_${match[2]}`, source: 'schema-property' };
}

function fromSchemaItems(schema: SchemaLike, id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/(.*)\/items$/i);
  if (!match) return undefined;

  const parentSchemaName = determineSchemaName(getSchemaFromPath(schema.$src, match[1]), id);
  if (parentSchemaName.source === 'id') return undefined;

  if (parentSchemaName.name.endsWith('s')) {
    return { name: parentSchemaName.name.substring(0, parentSchemaName.name.length - 1), source: 'schema-items' };
  } else {
    return { name: `${parentSchemaName.name}_Item`, source: 'schema-items' };
  }
}

function fromSchemaComposition(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/(.*)\/(allOf|oneOf|anyOf)\/([0-9]+)$/i);
  if (!match) return undefined;

  const parentSchemaName = determineSchemaName(getSchemaFromPath(schema.$src, match[1]), _id);
  if (parentSchemaName.source === 'id') return undefined;

  return { name: `${parentSchemaName.name}_${match[2]}_${match[3]}`, source: 'schema-composition' };
}

function fromSchemaAdditionalProperties(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/(.*)\/additionalProperties$/i);
  if (!match) return undefined;

  const parentSchemaName = determineSchemaName(getSchemaFromPath(schema.$src, match[1]), _id);
  if (parentSchemaName.source === 'id') return undefined;

  return { name: `${parentSchemaName.name}_AdditionalProperties`, source: 'schema-additional-properties' };
}

function getSchemaFromPath(src: DerefSource<unknown>, path: string): SchemaLike {
  const originalComponent = getDeepProperty(src.document, path.split('/').filter(Boolean));
  return {
    title: typeof originalComponent === 'object' && originalComponent !== null && 'title' in originalComponent
      ? String(originalComponent.title)
      : undefined,
    $src: { file: src.file, path, document: src.document, originalComponent },
  };
}
