import { parse as parsePath } from 'node:path';
import { OpenApiParameter } from '../../../mod.ts';
import type { OpenApiHttpMethod, OpenApiSchema } from '../../parse/openapi-types.ts';
import type { Deref, DerefSource } from '../../parse/types.ts';
import { getDeepProperty } from '../../utils/object.utils.ts';
import type { ApiSchemaNameSource } from '../api-types.ts';
import { determineEndpointName } from './determine-endpoint-name.ts';

type SchemaName = { name: string; source: ApiSchemaNameSource };
type SchemaLike = { $src: DerefSource<unknown> };

const resolvers = [
  ['file', fromFile],
  ['schema', fromSchema],
  ['response', fromResponse],
  ['parameter', fromParameter],
  ['header', fromHeader],
  ['response-header', fromResponseHeader],
  ['path-response', fromPathResponse],
  ['path-response-header', fromPathResponseHeader],
  ['path-parameter', fromPathParameter],
  ['path-request-body', fromPathRequestBody],
  ['schema-property', fromSchemaProperty],
  ['schema-items', fromSchemaItems],
  ['schema-additional-items', fromSchemaAdditionalItems],
  ['schema-composition', fromSchemaComposition],
  ['schema-exclusion', fromSchemaExclusion],
  ['schema-additional-properties', fromSchemaAdditionalProperties],
  ['schema-pattern-properties', fromSchemaPatternProperties],
  ['schema-definition', fromSchemaDefinitions],
  ['schema-discriminator-mapping', fromSchemaDiscriminatorMapping],
  ['id', (_schema, id) => ({ name: id, source: 'id' })],
] as const satisfies [ApiSchemaNameSource, (schema: SchemaLike, id: string) => SchemaName | undefined][];

export function determineSchemaName(
  schema: SchemaLike,
  id: string,
): SchemaName {
  if (!schema.$src?.originalComponent || typeof schema.$src.originalComponent !== 'object') {
    return { name: id, source: 'id' };
  }
  for (const [_, resolver] of resolvers) {
    const result = resolver(schema, id);
    if (result) return result;
  }
  return { name: id, source: 'id' };
}

function fromFile(schema: SchemaLike, _id: string): SchemaName | undefined {
  if (schema.$src.path !== '/') return undefined;

  return { name: parsePath(schema.$src.file).name, source: 'file' };
}

function fromSchema(schema: SchemaLike, _id: string): SchemaName | undefined {
  const schemaComponent = schema.$src.originalComponent as OpenApiSchema;
  if (schemaComponent.title) {
    return { name: schemaComponent.title, source: 'schema' };
  }

  const match = schema.$src.path.match(/^\/(?:components\/schemas|definitions)\/(?<name>[^/]+)$/i);
  console.log(schema.$src.path, match);
  if (!match?.groups) return undefined;

  const { name } = match.groups;
  return { name, source: 'schema' };
}

function fromResponse(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/^\/components\/responses\/(?<name>[^/]+)\/content\/[^/]+\/schema$/i);
  if (!match?.groups) return undefined;

  const { name } = match.groups;
  return {
    name: /response$/i.test(name) ? name : name + 'Response',
    source: 'response',
  };
}

function fromParameter(schema: SchemaLike, _id: string): SchemaName | undefined {
  const parameterComponent = schema.$src.originalComponent as OpenApiParameter;
  if (parameterComponent.name) {
    return { name: parameterComponent.name, source: 'parameter' };
  }

  const match = schema.$src.path.match(/^\/components\/parameters\/(?<name>[^/]+)$/i);
  if (!match?.groups) return undefined;

  const { name } = match.groups;
  return { name: `${name}_Parameter`, source: 'parameter' };
}

function fromHeader(schema: SchemaLike, _id: string): SchemaName | undefined {
  const headerComponent = schema.$src.originalComponent as OpenApiParameter;
  if (headerComponent.name) {
    return { name: headerComponent.name, source: 'header' };
  }

  const match = schema.$src.path.match(/^\/components\/headers\/(?<name>[^/]+)$/i);
  if (!match?.groups) return undefined;

  const { name } = match.groups;
  return { name: `${name}_Header`, source: 'header' };
}

function fromResponseHeader(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(
    /^\/components\/responses\/(?<responseName>[^/]+)\/headers\/(?<name>[^/]+)\/schema$/i,
  );
  if (!match?.groups) return undefined;

  const { responseName, name } = match.groups;
  return {
    name: `${/response$/i.test(responseName) ? responseName : responseName + 'Response'}_${name}_Header`,
    source: 'response-header',
  };
}

function fromPathResponse(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(
    /^\/paths\/(?<path>.+)\/(?<method>[^/]+)\/responses\/(?<status>\d+)\/content\/.+\/schema$/i,
  );
  if (!match?.groups) return undefined;

  const { path, method, status } = match.groups;
  const operation = schema.$src.document.paths?.[path]?.[method as OpenApiHttpMethod] ?? {};
  return {
    name: `${determineEndpointName({ method, path: `/${path}`, operation })}_${status}_Response`,
    source: 'path-response',
  };
}

function fromPathResponseHeader(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(
    /^\/paths\/(?<path>.+)\/(?<method>.+)\/responses\/(?<status>\d+)\/headers\/(?<name>[^/]+)(?:\/schema)?$/i,
  );
  if (!match?.groups) return undefined;

  const { path, method, status, name } = match.groups;
  const operation = schema.$src.document.paths?.[path]?.[method as OpenApiHttpMethod] ?? {};
  return {
    name: `${determineEndpointName({ method, path: `/${path}`, operation })}_${status}_${name}_Header`,
    source: 'path-response-header',
  };
}

function fromPathParameter(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/^\/paths\/(?<path>.+)\/(?<method>[^/]+)\/parameters\/(?<index>[0-9]+)$/i);
  if (!match?.groups) return undefined;

  const { path, method, index } = match.groups;
  const operation = schema.$src.document.paths?.[path]?.[method as OpenApiHttpMethod] ?? {};
  const endpointName = determineEndpointName({ method, path: `/${path}`, operation });
  const parameterName = (schema.$src.originalComponent as OpenApiParameter).name;
  return {
    name: parameterName ? `${endpointName}_${parameterName}_Parameter` : `${endpointName}_Parameter_${index}`,
    source: 'path-parameter',
  };
}

function fromPathRequestBody(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(
    /^\/paths\/(?<path>.+)\/(?<method>[^/]+)\/requestBody\/content\/[^/]+\/schema$/i,
  );
  if (!match?.groups) return undefined;

  const { path, method } = match.groups;
  const operation = schema.$src.document.paths?.[path]?.[method as OpenApiHttpMethod] ?? {};
  return {
    name: `${determineEndpointName({ method, path: `/${path}`, operation })}_Request`,
    source: 'path-request-body',
  };
}

function fromSchemaProperty(schema: SchemaLike, id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/^(?<schemaPath>.+)\/properties\/(?<propertyName>[^/]+)$/i);
  if (!match?.groups) return undefined;

  const { schemaPath, propertyName } = match.groups;
  const parentSchemaName = determineSchemaName(getSchemaFromPath(schema.$src, schemaPath), id);
  if (parentSchemaName.source === 'id') return undefined;

  return { name: `${parentSchemaName.name}_${propertyName}`, source: 'schema-property' };
}

function fromSchemaItems(schema: SchemaLike, id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/^(?<schemaPath>.+)\/items$/i);
  if (!match?.groups) return undefined;

  const { schemaPath } = match.groups;
  const parentSchemaName = determineSchemaName(getSchemaFromPath(schema.$src, schemaPath), id);
  if (parentSchemaName.source === 'id') return undefined;

  if (parentSchemaName.name.endsWith('s')) {
    return { name: parentSchemaName.name.substring(0, parentSchemaName.name.length - 1), source: 'schema-items' };
  } else {
    return { name: `${parentSchemaName.name}_Item`, source: 'schema-items' };
  }
}

function fromSchemaAdditionalItems(schema: SchemaLike, id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/(.*)\/additionalItems$/i);
  if (!match) return undefined;

  const parentSchemaName = determineSchemaName(getSchemaFromPath(schema.$src, match[1]), id);
  if (parentSchemaName.source === 'id') return undefined;

  return { name: `${parentSchemaName.name}_AdditionalItems`, source: 'schema-additional-items' };
}

function fromSchemaComposition(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/(.*)\/(allOf|oneOf|anyOf)\/([0-9]+)$/i);
  if (!match) return undefined;

  const parentSchemaName = determineSchemaName(getSchemaFromPath(schema.$src, match[1]), _id);
  if (parentSchemaName.source === 'id') return undefined;

  return { name: `${parentSchemaName.name}_${match[2]}_${match[3]}`, source: 'schema-composition' };
}

function fromSchemaExclusion(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/(.*)\/not$/i);
  if (!match) return undefined;

  const parentSchemaName = determineSchemaName(getSchemaFromPath(schema.$src, match[1]), _id);
  if (parentSchemaName.source === 'id') return undefined;

  return { name: `${parentSchemaName.name}_Not`, source: 'schema-exclusion' };
}

function fromSchemaAdditionalProperties(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/(.*)\/additionalProperties$/i);
  if (!match) return undefined;

  const parentSchemaName = determineSchemaName(getSchemaFromPath(schema.$src, match[1]), _id);
  if (parentSchemaName.source === 'id') return undefined;

  return { name: `${parentSchemaName.name}_AdditionalProperties`, source: 'schema-additional-properties' };
}

function fromSchemaPatternProperties(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/(.*)\/patternProperties\/([^/]*)$/i);
  if (!match) return undefined;

  const parentSchema = getSchemaFromPath(schema.$src, match[1]);
  const parentSchemaName = determineSchemaName(parentSchema, _id);
  if (parentSchemaName.source === 'id') return undefined;

  const index = Object.keys((parentSchema.$src.originalComponent as Deref<OpenApiSchema>).patternProperties ?? {})
    .indexOf(match[2]);
  return {
    name: `${parentSchemaName.name}_PatternProperties_${index < 0 ? match[2] : index}`,
    source: 'schema-pattern-properties',
  };
}

function fromSchemaDefinitions(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/(.*)\/definitions\/([^/]*)$/i);
  if (!match) return undefined;

  const parentSchemaName = determineSchemaName(getSchemaFromPath(schema.$src, match[1]), _id);
  if (parentSchemaName.source === 'id') return undefined;

  return { name: `${parentSchemaName.name}_${match[2]}`, source: 'schema-definition' };
}

function fromSchemaDiscriminatorMapping(schema: SchemaLike, _id: string): SchemaName | undefined {
  const match = schema.$src.path.match(/(.*)\/discriminator\/mapping\/([^/]*)$/i);
  if (!match) return undefined;

  const parentSchemaName = determineSchemaName(getSchemaFromPath(schema.$src, match[1]), _id);
  if (parentSchemaName.source === 'id') return undefined;

  return { name: `${parentSchemaName.name}_${match[2]}`, source: 'schema-discriminator-mapping' };
}

function getSchemaFromPath(src: DerefSource<unknown>, path: string): SchemaLike {
  const originalComponent = getDeepProperty(src.document, path.split('/').filter(Boolean));
  return {
    $src: { file: src.file, path, document: src.document, originalComponent },
  };
}
