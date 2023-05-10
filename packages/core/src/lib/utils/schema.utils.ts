import { ApiSchema, ApiSchemaProperty } from '../types.js';

export function mergeSchemaProperties(
  schema: ApiSchema<'combined' | 'object'>,
  ignoreNonObjectParts: boolean
): ApiSchema<'object'> | undefined {
  if (!ignoreNonObjectParts && !isSchemaValidForMerge(schema)) {
    return undefined;
  }

  const properties = getMergedSchemaProperties(schema);
  if (properties.length === 0) {
    return undefined;
  }

  return {
    ...schema,
    kind: 'object',
    type: 'object',
    anyOf: [],
    allOf: [],
    properties: getMergedSchemaProperties(schema),
  };
}

function getMergedSchemaProperties(schema: ApiSchema<'combined' | 'object'>): ApiSchemaProperty[] {
  return [
    ...(schema.kind === 'object' ? schema.properties : []),
    ...schema.allOf.map((x) => getPropertiesFromSubSchema(x, false)),
    ...schema.anyOf.map((x) => getPropertiesFromSubSchema(x, true)),
  ].flat(1);
}

function getPropertiesFromSubSchema(schema: ApiSchema, isOptional: boolean): ApiSchemaProperty[] {
  if (schema.kind !== 'object' && schema.kind !== 'combined') {
    return [];
  }

  const props = schema.kind === 'object' ? schema.properties : getMergedSchemaProperties(schema);
  return isOptional ? props.map((x) => ({ ...x, required: false })) : props;
}

function isSchemaValidForMerge(schema: ApiSchema<'combined' | 'object'>): boolean {
  for (const subSchema of [...schema.allOf, ...schema.anyOf]) {
    const isValid =
      subSchema.kind === 'object' ||
      (subSchema.kind === 'combined' && isSchemaValidForMerge(subSchema as ApiSchema<'combined'>));
    if (!isValid) {
      return false;
    }
  }
  return true;
}
