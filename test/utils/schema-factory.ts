import {
  ApiSchemaBase,
  ApiSchemaComponent,
  ApiSchemaExtensions,
  ApiSchemaProperty,
  ApiSchema,
} from '@goast/core';

export type TestSchema = Partial<Omit<ApiSchemaBase, 'required'>> &
  Partial<ApiSchemaComponent> & {
    required?: string[];
  };
export type TestOneofSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'oneOf'>, 'kind'>>;
export type TestMultiTypeSchema = TestSchema &
  Partial<Omit<ApiSchemaExtensions<'multi-type'>, 'kind' | 'properties'>> & {
    properties?: ApiSchemaProperty[];
  };
export type TestStringSchema = TestSchema &
  Partial<Omit<ApiSchemaExtensions<'string'>, 'kind' | 'type'>>;
export type TestBooleanSchema = TestSchema &
  Partial<Omit<ApiSchemaExtensions<'boolean'>, 'kind' | 'type'>>;
export type TestNullSchema = TestSchema &
  Partial<Omit<ApiSchemaExtensions<'null'>, 'kind' | 'type'>>;
export type TestNumberSchema = TestSchema &
  Partial<Omit<ApiSchemaExtensions<'number'>, 'kind' | 'type'>>;
export type TestIntegerSchema = TestSchema &
  Partial<Omit<ApiSchemaExtensions<'integer'>, 'kind' | 'type'>>;
export type TestArraySchema = TestSchema &
  Partial<Omit<ApiSchemaExtensions<'array'>, 'kind' | 'type'>>;
export type TestObjectSchema = TestSchema &
  Partial<Omit<ApiSchemaExtensions<'object'>, 'kind' | 'type' | 'properties'>> & {
    properties?: ApiSchemaProperty[];
  };
export type TestCombinedSchema = TestSchema &
  Partial<Omit<ApiSchemaExtensions<'combined'>, 'kind'>>;
export type TestUnknownSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'unknown'>, 'kind'>>;

let nextId = 0;

function createSchemaBase<T extends TestSchema>(
  schema: T
): ApiSchemaBase & Omit<T, keyof ApiSchemaBase> {
  const name = schema.name ?? `schema-${nextId++}`;
  return {
    ...schema,
    name,
    $src: schema.$src as any,
    id: schema.id ?? name,
    isNameGenerated: schema.isNameGenerated ?? schema.id !== undefined,
    deprecated: schema.deprecated ?? false,
    accessibility: schema.accessibility ?? 'all',
    required: new Set(schema.required ?? []),
    custom: {},
  };
}

export function createOneOfSchema(schema: TestOneofSchema = {}): ApiSchema<'oneOf'> {
  return {
    ...createSchemaBase(schema),
    kind: 'oneOf',
    oneOf: schema.oneOf ?? [],
  };
}

export function createMultiTypeSchema(schema: TestMultiTypeSchema = {}): ApiSchema<'multi-type'> {
  return {
    ...createSchemaBase(schema),
    kind: 'multi-type',
    type: schema.type ?? [],
    properties: new Map<string, ApiSchemaProperty>(
      (schema.properties ?? []).map((p) => [p.name, p])
    ),
    allOf: schema.allOf ?? [],
    anyOf: schema.anyOf ?? [],
  };
}

export function createStringSchema(schema: TestStringSchema = {}): ApiSchema<'string'> {
  return {
    ...createSchemaBase(schema),
    kind: 'string',
    type: 'string',
  };
}

export function createBooleanSchema(schema: TestBooleanSchema = {}): ApiSchema<'boolean'> {
  return {
    ...createSchemaBase(schema),
    kind: 'boolean',
    type: 'boolean',
  };
}

export function createNullSchema(schema: TestNullSchema = {}): ApiSchema<'null'> {
  return {
    ...createSchemaBase(schema),
    kind: 'null',
    type: 'null',
  };
}

export function createNumberSchema(schema: TestNumberSchema = {}): ApiSchema<'number'> {
  return {
    ...createSchemaBase(schema),
    kind: 'number',
    type: 'number',
  };
}

export function createIntegerSchema(schema: TestIntegerSchema = {}): ApiSchema<'integer'> {
  return {
    ...createSchemaBase(schema),
    kind: 'integer',
    type: 'integer',
  };
}

export function createArraySchema(schema: TestArraySchema = {}): ApiSchema<'array'> {
  return {
    ...createSchemaBase(schema),
    kind: 'array',
    type: 'array',
    items: schema.items ?? undefined,
  };
}

export function createObjectSchema(schema: TestObjectSchema = {}): ApiSchema<'object'> {
  return {
    ...createSchemaBase(schema),
    kind: 'object',
    type: 'object',
    properties: new Map<string, ApiSchemaProperty>(
      (schema.properties ?? []).map((p) => [p.name, p])
    ),
    allOf: schema.allOf ?? [],
    anyOf: schema.anyOf ?? [],
  };
}

export function createCombinedSchema(schema: TestCombinedSchema = {}): ApiSchema<'combined'> {
  return {
    ...createSchemaBase(schema),
    kind: 'combined',
    allOf: schema.allOf ?? [],
    anyOf: schema.anyOf ?? [],
  };
}

export function createUnknownSchema(schema: TestUnknownSchema = {}): ApiSchema<'unknown'> {
  return {
    ...createSchemaBase(schema),
    kind: 'unknown',
  };
}

export function createOneOfProperty(name: string, schema: TestOneofSchema = {}): ApiSchemaProperty {
  return { name, schema: createOneOfSchema(schema) };
}

export function createMultiTypeProperty(
  name: string,
  schema: TestMultiTypeSchema = {}
): ApiSchemaProperty {
  return { name, schema: createMultiTypeSchema(schema) };
}

export function createStringProperty(
  name: string,
  schema: TestStringSchema = {}
): ApiSchemaProperty {
  return { name, schema: createStringSchema(schema) };
}

export function createBooleanProperty(
  name: string,
  schema: TestBooleanSchema = {}
): ApiSchemaProperty {
  return { name, schema: createBooleanSchema(schema) };
}

export function createNullProperty(name: string, schema: TestNullSchema = {}): ApiSchemaProperty {
  return { name, schema: createNullSchema(schema) };
}

export function createNumberProperty(
  name: string,
  schema: TestNumberSchema = {}
): ApiSchemaProperty {
  return { name, schema: createNumberSchema(schema) };
}

export function createIntegerProperty(
  name: string,
  schema: TestIntegerSchema = {}
): ApiSchemaProperty {
  return { name, schema: createIntegerSchema(schema) };
}

export function createArrayProperty(name: string, schema: TestArraySchema = {}): ApiSchemaProperty {
  return { name, schema: createArraySchema(schema) };
}

export function createObjectProperty(
  name: string,
  schema: TestObjectSchema = {}
): ApiSchemaProperty {
  return { name, schema: createObjectSchema(schema) };
}

export function createCombinedProperty(
  name: string,
  schema: TestCombinedSchema = {}
): ApiSchemaProperty {
  return { name, schema: createCombinedSchema(schema) };
}

export function createUnknownProperty(
  name: string,
  schema: TestUnknownSchema = {}
): ApiSchemaProperty {
  return { name, schema: createUnknownSchema(schema) };
}
