import { isOpenApiObjectProperty } from '../internal-utils.ts';
import type { OpenApiSchema } from '../parse/openapi-types.ts';
import type { ApiSchema, ApiSchemaProperty, ObjectLikeApiSchema } from '../transform/api-types.ts';

export function resolveAnyOfAndAllOf(
  schema: ApiSchema<'combined' | 'object'>,
  ignoreNonObjectParts: boolean,
): ApiSchema<'object'> | undefined {
  if (!ignoreNonObjectParts && (hasInvalidSubSchema(schema.anyOf) || hasInvalidSubSchema(schema.allOf))) {
    return undefined;
  }

  const required = new Set(schema.required);
  const properties = new Map<string, ApiSchemaProperty>();
  if ('properties' in schema) {
    schema.properties.forEach((prop) => properties.set(prop.name, prop));
  }
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

/**
 * The sub-schemas already collected, split by the `optional` they were collected with, so that a branch
 * composing back to one of its own ancestors terminates instead of overflowing the stack.
 *
 * Collecting the same (sub-schema, `optional`) pair twice cannot contribute anything new: the property map
 * is first-wins, `required` is a set, and a pair's descendants are always traversed with an `optional`
 * derived only from that pair's own, so the second pass visits exactly the same schemas and reaches exactly
 * the same conclusions. Skipping it is therefore equivalent, not merely cheaper.
 */
type CollectedSubSchemas = { required: Set<ApiSchema>; optional: Set<ApiSchema> };

function collectSubSchemaProperties(
  subSchemas: ApiSchema[],
  properties: Map<string, ApiSchemaProperty>,
  required: Set<string>,
  optional: boolean,
  collected: CollectedSubSchemas = { required: new Set(), optional: new Set() },
) {
  const seen = optional ? collected.optional : collected.required;
  for (const subSchema of subSchemas) {
    if (seen.has(subSchema)) continue;
    seen.add(subSchema);

    if (subSchema.kind === 'object') {
      for (const prop of subSchema.properties.values()) {
        const existing = properties.get(prop.name);
        if (!existing) {
          properties.set(prop.name, prop);
        } else if (hasConflictingType(existing.schema, prop.schema)) {
          // Two branches declare the same property with types that cannot both hold. Picking one and
          // discarding the other would make the merged schema assert something the source contradicts, so
          // widen to a schema that admits both instead.
          properties.set(prop.name, { name: prop.name, schema: widenSchemas(existing.schema, prop.schema) });
        }
      }
    }

    // A branch does not have to contribute properties to contribute requiredness: `allOf: [{ required: [x] }]`
    // only tightens a property inherited from a sibling branch and has no type or properties of its own.
    if (!optional) {
      for (const prop of subSchema.required) {
        required.add(prop);
      }
    }

    if (subSchema.kind === 'object' || subSchema.kind === 'combined') {
      collectSubSchemaProperties(subSchema.allOf, properties, required, optional, collected);
      collectSubSchemaProperties(subSchema.anyOf, properties, required, true, collected);
    } else {
      // Exactly one branch of a composed `oneOf` applies to any given instance, so its properties are
      // collected but none of its requiredness is — the same treatment an `anyOf` branch gets.
      const oneOf = composedOneOf(subSchema);
      if (oneOf) collectSubSchemaProperties(oneOf, properties, required, true, collected);
    }
  }
}

/**
 * The branches of a `oneOf` sub-schema that describe the same instance as the schema composing it, or
 * `undefined` if it has none.
 *
 * An undiscriminated `oneOf` inside a composition constrains the very instance being composed:
 * `allOf: [{ oneOf: [A, B] }, C]` is "A or B, *and* C", so whichever branch applies contributes its
 * properties to the whole. A `oneOf` that declares a `discriminator` is not a composition but a list of
 * subtypes, and `allOf: [Base]` against such a schema means "is a Base" — the sibling subtypes' properties
 * belong to those siblings, not to the schema inheriting from the base.
 */
function composedOneOf(schema: ApiSchema): ApiSchema[] | undefined {
  return schema.kind === 'oneOf' && !schema.discriminator ? schema.oneOf : undefined;
}

/**
 * Whether two declarations of one property name state types that cannot both hold. A branch that says
 * nothing about the type (`unknown`) constrains nothing and so never conflicts, and two declarations of the
 * same kind are treated as a refinement of one another rather than a conflict, so the first still wins.
 */
function hasConflictingType(a: ApiSchema, b: ApiSchema): boolean {
  return a.kind !== b.kind && a.kind !== 'unknown' && b.kind !== 'unknown';
}

/** The branches a schema contributes to a widened `oneOf`, flattened so widening stays a single level. */
function conflictBranches(schema: ApiSchema): ApiSchema[] {
  return schema.kind === 'oneOf' ? schema.oneOf : [schema];
}

/** A `oneOf` admitting either side of a conflicting merge, so neither side is silently discarded. */
function widenSchemas(a: ApiSchema, b: ApiSchema): ApiSchema<'oneOf'> {
  const oneOf: ApiSchema[] = [];
  for (const branch of [...conflictBranches(a), ...conflictBranches(b)]) {
    if (!oneOf.some((x) => x.id === branch.id)) oneOf.push(branch);
  }

  // Derived from the branch ids rather than generated, so the same conflict always yields the same schema.
  const id = `conflict-${oneOf.map((x) => x.id).join('+')}`;
  return {
    ...a,
    $ref: undefined,
    id,
    name: id,
    isNameGenerated: true,
    kind: 'oneOf',
    enum: undefined,
    const: undefined,
    default: undefined,
    discriminator: undefined,
    inheritedSchemas: [],
    nullable: a.nullable || b.nullable,
    oneOf,
  };
}

function combineAdditionalProperties(
  subSchemas: ApiSchema[],
  current: ObjectLikeApiSchema['additionalProperties'],
  /** Guards the same composition cycle `collectSubSchemaProperties` guards; see `CollectedSubSchemas`. */
  visited: Set<ApiSchema> = new Set(),
): ObjectLikeApiSchema['additionalProperties'] {
  if (current === true) return true;

  for (const subSchema of subSchemas) {
    if (visited.has(subSchema)) continue;
    visited.add(subSchema);

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
      current = combineAdditionalProperties(subSchema.allOf, current, visited);
      current = combineAdditionalProperties(subSchema.anyOf, current, visited);
    } else {
      const oneOf = composedOneOf(subSchema);
      if (oneOf) current = combineAdditionalProperties(oneOf, current, visited);
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

export const DEFAULT_IGNORED_SCHEMA_PROPERTIES: (keyof OpenApiSchema)[] = [
  'description',
  'example',
  'deprecated',
];

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
