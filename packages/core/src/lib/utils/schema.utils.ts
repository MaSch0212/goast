import { OpenApiSchema } from '../parse';
import { ApiSchema, ApiSchemaProperty } from '../transform';

export function resolveAnyOfAndAllOf(
  schema: ApiSchema<'combined' | 'object'>,
  ignoreNonObjectParts: boolean
): ApiSchema<'object'> | undefined {
  if (!ignoreNonObjectParts && (hasInvalidSubSchema(schema.anyOf) || hasInvalidSubSchema(schema.allOf))) {
    return undefined;
  }

  const required = new Set(schema.required);
  const properties = new Map<string, ApiSchemaProperty>();
  collectSubSchemaProperties(schema.allOf, properties, required, false);
  collectSubSchemaProperties(schema.anyOf, properties, required, true);
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
    additionalProperties: false, // TODO: check whether any of the sub-schemas has additionalProperties set to true or a schema and combine that
  };
}

function collectSubSchemaProperties(
  subSchemas: ApiSchema[],
  properties: Map<string, ApiSchemaProperty>,
  required: Set<string>,
  optional: boolean
) {
  for (const subSchema of subSchemas) {
    if (subSchema.kind === 'object') {
      for (const prop of subSchema.properties.values()) {
        if (!properties.has(prop.name)) {
          properties.set(prop.name, prop);
        }
      }
      if (!optional) {
        for (const prop of subSchema.required) {
          required.add(prop);
        }
      }
    }

    if (subSchema.kind === 'object' || subSchema.kind === 'combined') {
      collectSubSchemaProperties(subSchema.allOf, properties, required, optional);
      collectSubSchemaProperties(subSchema.anyOf, properties, required, true);
    }
  }
}

function hasInvalidSubSchema(subSchemas: ApiSchema[]): boolean {
  return subSchemas.some(
    (x) =>
      x.kind !== 'object' && (x.kind !== 'combined' || (!hasInvalidSubSchema(x.allOf) && !hasInvalidSubSchema(x.anyOf)))
  );
}

export const openaApiSchemaProperties: (keyof OpenApiSchema)[] = [
  'type',
  'properties',
  'items',
  'required',
  'enum',
  'format',
  'additionalProperties',
  'anyOf',
  'oneOf',
  'allOf',
  'not',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'pattern',
  'default',
  'title',
  'description',
  'multipleOf',
  'additionalItems',
  'maxItems',
  'minItems',
  'uniqueItems',
  'maxProperties',
  'minProperties',
  'definitions',
  'patternProperties',
  'dependencies',
  'nullable',
  'discriminator',
  'readOnly',
  'writeOnly',
  'externalDocs',
  'example',
  'examples',
  'xml',
  'contentMediaType',
  'const',
  'deprecated',
];
export const defaultUnimpactfulProperties: (keyof OpenApiSchema)[] = [
  'required',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'pattern',
  'default',
  'description',
  'multipleOf',
  'maxItems',
  'minItems',
  'uniqueItems',
  'maxProperties',
  'minProperties',
  'definitions',
  'patternProperties',
  'dependencies',
  'externalDocs',
  'example',
  'examples',
  'xml',
  'contentMediaType',
  'deprecated',
];

export function selectFirstReferenceWithImpactfulChanges(
  schema: ApiSchema,
  additionalUnimpactfulProperties: (keyof OpenApiSchema)[] = [],
  additionalImpactfulProperties: (keyof OpenApiSchema)[] = []
): ApiSchema {
  const unimpactfulProperties = defaultUnimpactfulProperties.concat(additionalUnimpactfulProperties);
  const impactfulProperties = openaApiSchemaProperties
    .filter((x) => !unimpactfulProperties.includes(x))
    .concat(additionalImpactfulProperties);
  return selectFirstReferenceWithImpactfulChangesImpl(schema, impactfulProperties);
}

function selectFirstReferenceWithImpactfulChangesImpl(
  schema: ApiSchema,
  impactfulProperties: (keyof OpenApiSchema)[]
): ApiSchema {
  if (!schema.$ref) return schema;
  const hasImpactfulChange = hasAnyProperty(schema.$src.originalComponent, impactfulProperties);
  if (hasImpactfulChange) return schema;
  return selectFirstReferenceWithImpactfulChangesImpl(schema.$ref, impactfulProperties);
}

function hasAnyProperty<T extends object>(obj: T, props: (keyof T)[]): boolean {
  return props.some((x) => x in obj);
}
