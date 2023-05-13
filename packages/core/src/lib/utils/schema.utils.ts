import { ApiSchema, ApiSchemaProperty } from '../types.js';

export function resolveAnyOfAndAllOf(
  schema: ApiSchema<'combined' | 'object'>,
  ignoreNonObjectParts: boolean
): ApiSchema<'object'> | undefined {
  if (
    !ignoreNonObjectParts &&
    (hasInvalidSubSchema(schema.anyOf) || hasInvalidSubSchema(schema.allOf))
  ) {
    return undefined;
  }

  const required = new Set(schema.required);
  const properties = new Map<string, ApiSchemaProperty>();
  collectSubSchemaProperties(schema.allOf, properties, required);
  collectSubSchemaProperties(schema.anyOf, properties, required);
  if (properties.size === 0) {
    return undefined;
  }

  return {
    ...schema,
    kind: 'object',
    type: 'object',
    anyOf: [],
    allOf: [],
    properties: properties,
    required: required,
  };
}

function collectSubSchemaProperties(
  subSchemas: ApiSchema[],
  properties: Map<string, ApiSchemaProperty>,
  required: Set<string>
) {
  for (const subSchema of subSchemas) {
    if (subSchema.kind === 'object') {
      for (const prop of subSchema.properties.values()) {
        if (!properties.has(prop.name)) {
          properties.set(prop.name, prop);
        }
      }
      for (const prop of subSchema.required) {
        required.add(prop);
      }
    }

    if (subSchema.kind === 'object' || subSchema.kind === 'combined') {
      collectSubSchemaProperties(subSchema.allOf, properties, required);
      collectSubSchemaProperties(subSchema.anyOf, properties, required);
    }
  }
}

function hasInvalidSubSchema(subSchemas: ApiSchema[]): boolean {
  return subSchemas.some(
    (x) =>
      x.kind !== 'object' &&
      (x.kind !== 'combined' || (!hasInvalidSubSchema(x.allOf) && !hasInvalidSubSchema(x.anyOf)))
  );
}
