import { ApiSchema, ApiSchemaBase, ApiSchemaComponent, ApiSchemaExtensions, ApiSchemaProperty } from '../index.ts';

export type TestSchema =
  & Partial<Omit<ApiSchemaBase, 'required'>>
  & Partial<ApiSchemaComponent>
  & {
    required?: string[];
  };
export type TestOneofSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'oneOf'>, 'kind'>>;
export type TestMultiTypeSchema =
  & TestSchema
  & Partial<Omit<ApiSchemaExtensions<'multi-type'>, 'kind' | 'properties'>>
  & {
    properties?: ApiSchemaProperty[];
  };
export type TestStringSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'string'>, 'kind' | 'type'>>;
export type TestBooleanSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'boolean'>, 'kind' | 'type'>>;
export type TestNullSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'null'>, 'kind' | 'type'>>;
export type TestNumberSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'number'>, 'kind' | 'type'>>;
export type TestIntegerSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'integer'>, 'kind' | 'type'>>;
export type TestArraySchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'array'>, 'kind' | 'type'>>;
export type TestObjectSchema =
  & TestSchema
  & Partial<Omit<ApiSchemaExtensions<'object'>, 'kind' | 'type' | 'properties'>>
  & {
    properties?: ApiSchemaProperty[];
  };
export type TestCombinedSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'combined'>, 'kind'>>;
export type TestUnknownSchema = TestSchema & Partial<Omit<ApiSchemaExtensions<'unknown'>, 'kind'>>;

let nextId = 0;

function createSchemaBase<T extends TestSchema>(schema: T) {
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
  } as ApiSchemaBase & Omit<T, keyof ApiSchemaBase>;
}

export function createOneOfSchema(schema: TestOneofSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'oneOf',
    oneOf: schema.oneOf ?? [],
  } as ApiSchema<'oneOf'>;
}

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

export function createStringSchema(schema: TestStringSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'string',
    type: 'string',
  } as ApiSchema<'string'>;
}

export function createBooleanSchema(schema: TestBooleanSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'boolean',
    type: 'boolean',
  } as ApiSchema<'boolean'>;
}

export function createNullSchema(schema: TestNullSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'null',
    type: 'null',
  } as ApiSchema<'null'>;
}

export function createNumberSchema(schema: TestNumberSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'number',
    type: 'number',
  } as ApiSchema<'number'>;
}

export function createIntegerSchema(schema: TestIntegerSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'integer',
    type: 'integer',
  } as ApiSchema<'integer'>;
}

export function createArraySchema(schema: TestArraySchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'array',
    type: 'array',
    items: schema.items ?? undefined,
  } as ApiSchema<'array'>;
}

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

export function createCombinedSchema(schema: TestCombinedSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'combined',
    allOf: schema.allOf ?? [],
    anyOf: schema.anyOf ?? [],
  } as ApiSchema<'combined'>;
}

export function createUnknownSchema(schema: TestUnknownSchema = {}) {
  return {
    ...createSchemaBase(schema),
    kind: 'unknown',
  } as ApiSchema<'unknown'>;
}

export function createOneOfProperty(name: string, schema: TestOneofSchema = {}): ApiSchemaProperty {
  return { name, schema: createOneOfSchema(schema) };
}

export function createMultiTypeProperty(name: string, schema: TestMultiTypeSchema = {}): ApiSchemaProperty {
  return { name, schema: createMultiTypeSchema(schema) };
}

export function createStringProperty(name: string, schema: TestStringSchema = {}): ApiSchemaProperty {
  return { name, schema: createStringSchema(schema) };
}

export function createBooleanProperty(name: string, schema: TestBooleanSchema = {}): ApiSchemaProperty {
  return { name, schema: createBooleanSchema(schema) };
}

export function createNullProperty(name: string, schema: TestNullSchema = {}): ApiSchemaProperty {
  return { name, schema: createNullSchema(schema) };
}

export function createNumberProperty(name: string, schema: TestNumberSchema = {}): ApiSchemaProperty {
  return { name, schema: createNumberSchema(schema) };
}

export function createIntegerProperty(name: string, schema: TestIntegerSchema = {}): ApiSchemaProperty {
  return { name, schema: createIntegerSchema(schema) };
}

export function createArrayProperty(name: string, schema: TestArraySchema = {}): ApiSchemaProperty {
  return { name, schema: createArraySchema(schema) };
}

export function createObjectProperty(name: string, schema: TestObjectSchema = {}): ApiSchemaProperty {
  return { name, schema: createObjectSchema(schema) };
}

export function createCombinedProperty(name: string, schema: TestCombinedSchema = {}): ApiSchemaProperty {
  return { name, schema: createCombinedSchema(schema) };
}

export function createUnknownProperty(name: string, schema: TestUnknownSchema = {}): ApiSchemaProperty {
  return { name, schema: createUnknownSchema(schema) };
}
