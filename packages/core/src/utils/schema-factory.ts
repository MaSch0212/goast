import type {
  ApiSchema,
  ApiSchemaBase,
  ApiSchemaComponent,
  ApiSchemaExtensions,
  ApiSchemaProperty,
} from '../transform/api-types.ts';

/**
 * Base arguments accepted by every `create*Schema` and `create*Property` helper in this file. `required` is a list of
 * property names that the helpers turn into a `Set`. A missing `name` is generated as `schema-<n>`, `id` defaults to
 * the name, and `isNameGenerated` defaults to whether an `id` was given.
 */
export type TestSchema = Partial<Omit<ApiSchemaBase, 'required'>> &
  Partial<ApiSchemaComponent> & {
    required?: string[];
  };
/**
 * Arguments for `createOneOfSchema`: the base fields plus the `oneOf` branches to choose from.
 * @see createOneOfSchema
 */
export type TestOneofSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'oneOf'>, 'kind'>>;
/**
 * Arguments for `createMultiTypeSchema`: the base fields, the `type` list, `properties` as a list of properties, and
 * the keywords of the array, object, number and string kinds, since a `multi-type` schema can carry all of them.
 * @see createMultiTypeSchema
 */
export type TestMultiTypeSchema = TestSchema &
  Partial<Omit<ApiSchemaExtensions<'multi-type'>, 'kind' | 'properties'>> & {
    properties?: ApiSchemaProperty[];
  };
/**
 * Arguments for `createStringSchema`: the base fields plus `pattern`, `minLength`, `maxLength` and `format`.
 * @see createStringSchema
 */
export type TestStringSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'string'>, 'kind' | 'type'>>;
/**
 * Arguments for `createBooleanSchema`: the base fields plus `format`.
 * @see createBooleanSchema
 */
export type TestBooleanSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'boolean'>, 'kind' | 'type'>>;
/**
 * Arguments for `createNullSchema`. A `null` schema has no keywords beyond the base fields.
 * @see createNullSchema
 */
export type TestNullSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'null'>, 'kind' | 'type'>>;
/**
 * Arguments for `createNumberSchema`: the base fields plus `minimum`, `maximum` and `format`.
 * @see createNumberSchema
 */
export type TestNumberSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'number'>, 'kind' | 'type'>>;
/**
 * Arguments for `createIntegerSchema`: the same fields as `createNumberSchema`.
 * @see createIntegerSchema
 */
export type TestIntegerSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'integer'>, 'kind' | 'type'>>;
/**
 * Arguments for `createArraySchema`: the base fields plus `items`, `minItems` and `maxItems`.
 * @see createArraySchema
 */
export type TestArraySchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'array'>, 'kind' | 'type'>>;
/**
 * Arguments for `createObjectSchema`: the base fields plus `properties` as a list, `additionalProperties`, and the
 * `allOf` and `anyOf` branches.
 * @see createObjectSchema
 */
export type TestObjectSchema = TestSchema &
  Partial<Omit<ApiSchemaExtensions<'object'>, 'kind' | 'type' | 'properties'>> & {
    properties?: ApiSchemaProperty[];
  };
/**
 * Arguments for `createCombinedSchema`: the base fields plus the `allOf` and `anyOf` branches.
 * @see createCombinedSchema
 */
export type TestCombinedSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'combined'>, 'kind'>>;
/**
 * Arguments for `createUnknownSchema`. An `unknown` schema has no keywords beyond the base fields.
 * @see createUnknownSchema
 */
export type TestUnknownSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'unknown'>, 'kind'>>;

let nextId = 0;

function createSchemaBase<T extends TestSchema>(schema: T) {
  const name = schema.name ?? `schema-${nextId++}`;
  return {
    ...schema,
    name,
    $src: schema.$src,
    id: schema.id ?? name,
    isNameGenerated: schema.isNameGenerated ?? schema.id !== undefined,
    deprecated: schema.deprecated ?? false,
    accessibility: schema.accessibility ?? 'all',
    required: new Set(schema.required ?? []),
    custom: {},
  } as ApiSchemaBase & Omit<T, keyof ApiSchemaBase>;
}

/**
 * Creates a `oneOf` schema (kind `'oneOf'`) that matches exactly one of its `oneOf` branches. The branches default to
 * an empty list.
 * @param schema The base fields and the `oneOf` branches of the schema.
 * @returns A `oneOf` schema with the given fields.
 */
export function createOneOfSchema(schema: TestOneofSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'oneOf',
    oneOf: schema.oneOf ?? [],
  } as ApiSchema<'oneOf'>;
}

/**
 * Creates a `multi-type` schema (kind `'multi-type'`) for a schema whose `type` lists several types. `type`, `allOf`
 * and `anyOf` default to empty lists, and `properties` is converted into a map keyed by property name.
 * @param schema The base fields and the keywords of the schema.
 * @returns A `multi-type` schema with the given fields.
 */
export function createMultiTypeSchema(schema: TestMultiTypeSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'multi-type',
    type: schema.type ?? [],
    properties: new Map<string, ApiSchemaProperty>((schema.properties ?? []).map((p) => [p.name, p])),
    allOf: schema.allOf ?? [],
    anyOf: schema.anyOf ?? [],
  } as ApiSchema<'multi-type'>;
}

/**
 * Creates a `string` schema (kind and type `'string'`). Only the base fields and the `pattern`, `minLength`,
 * `maxLength` and `format` keywords are read from the argument.
 * @param schema The base fields and the string keywords of the schema.
 * @returns A `string` schema with the given fields.
 */
export function createStringSchema(schema: TestStringSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'string',
    type: 'string',
  } as ApiSchema<'string'>;
}

/**
 * Creates a `boolean` schema (kind and type `'boolean'`). Only the base fields and `format` are read from the argument.
 * @param schema The base fields and the `format` of the schema.
 * @returns A `boolean` schema with the given fields.
 */
export function createBooleanSchema(schema: TestBooleanSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'boolean',
    type: 'boolean',
  } as ApiSchema<'boolean'>;
}

/**
 * Creates a `null` schema (kind and type `'null'`). Since `null` has no keywords, only the base fields are read from
 * the argument.
 * @param schema The base fields of the schema.
 * @returns A `null` schema with the given fields.
 */
export function createNullSchema(schema: TestNullSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'null',
    type: 'null',
  } as ApiSchema<'null'>;
}

/**
 * Creates a `number` schema (kind and type `'number'`) for any numeric value, fractions included. Only the base fields
 * and the `minimum`, `maximum` and `format` keywords are read from the argument.
 * @param schema The base fields and the numeric keywords of the schema.
 * @returns A `number` schema with the given fields.
 * @see createIntegerSchema
 */
export function createNumberSchema(schema: TestNumberSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'number',
    type: 'number',
  } as ApiSchema<'number'>;
}

/**
 * Creates an `integer` schema (kind and type `'integer'`) for whole numbers. It reads the same keywords as
 * {@link createNumberSchema}: `minimum`, `maximum` and `format`.
 * @param schema The base fields and the numeric keywords of the schema.
 * @returns An `integer` schema with the given fields.
 * @see createNumberSchema
 */
export function createIntegerSchema(schema: TestIntegerSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'integer',
    type: 'integer',
  } as ApiSchema<'integer'>;
}

/**
 * Creates an `array` schema (kind and type `'array'`). `items` is taken as given, so leaving it out leaves the elements
 * unconstrained, and `minItems` and `maxItems` are read from the argument.
 * @param schema The base fields and the array keywords of the schema.
 * @returns An `array` schema with the given fields.
 */
export function createArraySchema(schema: TestArraySchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'array',
    type: 'array',
    items: schema.items ?? undefined,
  } as ApiSchema<'array'>;
}

/**
 * Creates an `object` schema (kind and type `'object'`). `properties` is turned into a map keyed by property name,
 * where a later property with the same name replaces an earlier one. `allOf` and `anyOf` default to empty lists.
 * @param schema The base fields, properties and branches of the schema.
 * @returns An `object` schema with the given fields.
 */
export function createObjectSchema(schema: TestObjectSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'object',
    type: 'object',
    properties: new Map<string, ApiSchemaProperty>((schema.properties ?? []).map((p) => [p.name, p])),
    allOf: schema.allOf ?? [],
    anyOf: schema.anyOf ?? [],
  } as ApiSchema<'object'>;
}

/**
 * Creates a `combined` schema (kind `'combined'`, with no `type`) composed of its `allOf` and `anyOf` branches. Both
 * branch lists default to empty.
 * @param schema The base fields and the branches of the schema.
 * @returns A `combined` schema with the given fields.
 */
export function createCombinedSchema(schema: TestCombinedSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'combined',
    allOf: schema.allOf ?? [],
    anyOf: schema.anyOf ?? [],
  } as ApiSchema<'combined'>;
}

/**
 * Creates an `unknown` schema (kind `'unknown'`), which has no kind-specific keywords. Only the base fields are read
 * from the argument.
 * @param schema The base fields of the schema.
 * @returns An `unknown` schema with the given fields.
 */
export function createUnknownSchema(schema: TestUnknownSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'unknown',
  } as ApiSchema<'unknown'>;
}

/**
 * Creates a property whose schema is a `oneOf` schema with the branches given in `schema.oneOf`.
 * @param name The name of the property, used as its key in the `properties` of the parent schema.
 * @param schema The arguments of the `oneOf` schema, as for {@link createOneOfSchema}.
 * @returns The property with the given name and a `oneOf` schema.
 * @see createOneOfSchema
 */
export function createOneOfProperty(name: string, schema: TestOneofSchema = {}): ApiSchemaProperty {
  return { name, schema: createOneOfSchema(schema) };
}

/**
 * Creates a property whose schema is a `multi-type` schema with the `type` list and keywords given in `schema`.
 * @param name The name of the property, used as its key in the `properties` of the parent schema.
 * @param schema The arguments of the `multi-type` schema, as for {@link createMultiTypeSchema}.
 * @returns The property with the given name and a `multi-type` schema.
 * @see createMultiTypeSchema
 */
export function createMultiTypeProperty(name: string, schema: TestMultiTypeSchema = {}): ApiSchemaProperty {
  return { name, schema: createMultiTypeSchema(schema) };
}

/**
 * Creates a property whose schema is a `string` schema with `pattern`, `minLength`, `maxLength` and `format` taken
 * from `schema`.
 * @param name The name of the property, used as its key in the `properties` of the parent schema.
 * @param schema The arguments of the `string` schema, as for {@link createStringSchema}.
 * @returns The property with the given name and a `string` schema.
 * @see createStringSchema
 */
export function createStringProperty(name: string, schema: TestStringSchema = {}): ApiSchemaProperty {
  return { name, schema: createStringSchema(schema) };
}

/**
 * Creates a property whose schema is a `boolean` schema. Only the base fields and `format` of `schema` apply.
 * @param name The name of the property, used as its key in the `properties` of the parent schema.
 * @param schema The arguments of the `boolean` schema, as for {@link createBooleanSchema}.
 * @returns The property with the given name and a `boolean` schema.
 * @see createBooleanSchema
 */
export function createBooleanProperty(name: string, schema: TestBooleanSchema = {}): ApiSchemaProperty {
  return { name, schema: createBooleanSchema(schema) };
}

/**
 * Creates a property whose schema is a `null` schema. Only the base fields of `schema` apply.
 * @param name The name of the property, used as its key in the `properties` of the parent schema.
 * @param schema The arguments of the `null` schema, as for {@link createNullSchema}.
 * @returns The property with the given name and a `null` schema.
 * @see createNullSchema
 */
export function createNullProperty(name: string, schema: TestNullSchema = {}): ApiSchemaProperty {
  return { name, schema: createNullSchema(schema) };
}

/**
 * Creates a property whose schema is a `number` schema with `minimum`, `maximum` and `format` taken from `schema`.
 * @param name The name of the property, used as its key in the `properties` of the parent schema.
 * @param schema The arguments of the `number` schema, as for {@link createNumberSchema}.
 * @returns The property with the given name and a `number` schema.
 * @see createNumberSchema
 */
export function createNumberProperty(name: string, schema: TestNumberSchema = {}): ApiSchemaProperty {
  return { name, schema: createNumberSchema(schema) };
}

/**
 * Creates a property whose schema is an `integer` schema with `minimum`, `maximum` and `format` taken from `schema`.
 * @param name The name of the property, used as its key in the `properties` of the parent schema.
 * @param schema The arguments of the `integer` schema, as for {@link createIntegerSchema}.
 * @returns The property with the given name and an `integer` schema.
 * @see createIntegerSchema
 */
export function createIntegerProperty(name: string, schema: TestIntegerSchema = {}): ApiSchemaProperty {
  return { name, schema: createIntegerSchema(schema) };
}

/**
 * Creates a property whose schema is an `array` schema with `items`, `minItems` and `maxItems` taken from `schema`.
 * @param name The name of the property, used as its key in the `properties` of the parent schema.
 * @param schema The arguments of the `array` schema, as for {@link createArraySchema}.
 * @returns The property with the given name and an `array` schema.
 * @see createArraySchema
 */
export function createArrayProperty(name: string, schema: TestArraySchema = {}): ApiSchemaProperty {
  return { name, schema: createArraySchema(schema) };
}

/**
 * Creates a property whose schema is an `object` schema with `properties`, `additionalProperties`, `allOf` and `anyOf`
 * taken from `schema`.
 * @param name The name of the property, used as its key in the `properties` of the parent schema.
 * @param schema The arguments of the `object` schema, as for {@link createObjectSchema}.
 * @returns The property with the given name and an `object` schema.
 * @see createObjectSchema
 */
export function createObjectProperty(name: string, schema: TestObjectSchema = {}): ApiSchemaProperty {
  return { name, schema: createObjectSchema(schema) };
}

/**
 * Creates a property whose schema is a `combined` schema composed of the `allOf` and `anyOf` branches in `schema`.
 * @param name The name of the property, used as its key in the `properties` of the parent schema.
 * @param schema The arguments of the `combined` schema, as for {@link createCombinedSchema}.
 * @returns The property with the given name and a `combined` schema.
 * @see createCombinedSchema
 */
export function createCombinedProperty(name: string, schema: TestCombinedSchema = {}): ApiSchemaProperty {
  return { name, schema: createCombinedSchema(schema) };
}

/**
 * Creates a property whose schema is an `unknown` schema, which carries only the base fields of `schema`.
 * @param name The name of the property, used as its key in the `properties` of the parent schema.
 * @param schema The arguments of the `unknown` schema, as for {@link createUnknownSchema}.
 * @returns The property with the given name and an `unknown` schema.
 * @see createUnknownSchema
 */
export function createUnknownProperty(name: string, schema: TestUnknownSchema = {}): ApiSchemaProperty {
  return { name, schema: createUnknownSchema(schema) };
}
