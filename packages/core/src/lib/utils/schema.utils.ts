import { isOpenApiObjectProperty } from '../internal-utils';
import { OpenApiSchema } from '../parse';
import { ApiSchema, ApiSchemaProperty, ObjectLikeApiSchema } from '../transform';

export function resolveAnyOfAndAllOf(
  schema: ApiSchema<'combined' | 'object'>,
  ignoreNonObjectParts: boolean,
): ApiSchema<'object'> | undefined {
  if (!ignoreNonObjectParts && (hasInvalidSubSchema(schema.anyOf) || hasInvalidSubSchema(schema.allOf))) {
    return undefined;
  }

  const required = new Set(schema.required);
  const properties = new Map<string, ApiSchemaProperty>();
  collectSubSchemaProperties(schema.allOf, properties, required, false);
  collectSubSchemaProperties(schema.anyOf, properties, required, true);

  const initialAdditionalProperties = schema.kind === 'object' ? schema.additionalProperties : undefined;
  let additionalProperties = initialAdditionalProperties;
  additionalProperties = combineAdditionalProperties(schema.allOf, additionalProperties);
  additionalProperties = combineAdditionalProperties(schema.anyOf, additionalProperties);

  if (properties.size === 0 && initialAdditionalProperties === additionalProperties) {
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
    additionalProperties,
  };
}

function collectSubSchemaProperties(
  subSchemas: ApiSchema[],
  properties: Map<string, ApiSchemaProperty>,
  required: Set<string>,
  optional: boolean,
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

function combineAdditionalProperties(
  subSchemas: ApiSchema[],
  current: ObjectLikeApiSchema['additionalProperties'],
): ObjectLikeApiSchema['additionalProperties'] {
  if (current === true) return true;

  for (const subSchema of subSchemas) {
    if (subSchema.kind === 'object' && subSchema.additionalProperties) {
      if (subSchema.additionalProperties === true) return true;
      if (!current) {
        current = subSchema.additionalProperties;
      } else if (current && current.id !== subSchema.additionalProperties.id) {
        if (current.kind === 'oneOf') {
          current.oneOf.push(subSchema.additionalProperties);
        } else {
          const id = `schema-${Math.random().toString(36).substring(2)}`;
          current = {
            $ref: undefined,
            $src: current.$src,
            id,
            kind: 'oneOf',
            name: id,
            isNameGenerated: true,
            description: undefined,
            deprecated: false,
            accessibility: 'all',
            enum: undefined,
            const: undefined,
            default: undefined,
            example: undefined,
            nullable: false,
            required: new Set(),
            custom: {},
            not: undefined,
            discriminator: undefined,
            inheritedSchemas: [],
            oneOf: [current, subSchema.additionalProperties],
          };
        }
      }
    }

    if (subSchema.kind === 'object' || subSchema.kind === 'combined') {
      current = combineAdditionalProperties(subSchema.allOf, current);
      current = combineAdditionalProperties(subSchema.anyOf, current);
    }

    if (current === true) return true;
  }

  return current;
}

function hasInvalidSubSchema(subSchemas: ApiSchema[]): boolean {
  return subSchemas.some(
    (x) =>
      x.kind !== 'object' &&
      (x.kind !== 'combined' || (!hasInvalidSubSchema(x.allOf) && !hasInvalidSubSchema(x.anyOf))),
  );
}

/**
 * Retrieves the first schema reference and the reference chain of a given schema that
 * defines some schema properties. (e.g. schemas with just "$ref" are skipped)
 * @param schema The schema to retrieve the reference from.
 * @param propertiesToIgnore The properties to ignore when checking for a schema definition.
 */
export function getSchemaReference(schema: ApiSchema, propertiesToIgnore: (keyof OpenApiSchema)[]): ApiSchema {
  if (!schema.$ref) return schema;
  const hasPropertiesDefined = Object.keys(schema.$src.originalComponent).some(
    (key) => isOpenApiObjectProperty(key) && !propertiesToIgnore.includes(key as keyof OpenApiSchema),
  );
  return hasPropertiesDefined ? schema : getSchemaReference(schema.$ref, propertiesToIgnore);
}
