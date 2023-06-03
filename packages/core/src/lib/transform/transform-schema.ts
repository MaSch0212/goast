import { ApiSchema, ApiSchemaExtensions, ApiSchemaKind } from './api-types';
import {
  determineSchemaAccessibility,
  determineSchemaKind,
  determineSchemaName,
  getCustomFields,
  getOpenApiObjectIdentifier,
  transformAdditionalProperties,
  transformSchemaProperties,
} from './helpers';
import { OpenApiTransformerContext, IncompleteApiSchema } from './types';
import { Deref, OpenApiSchema } from '../parse';
import { createOverwriteProxy } from '../utils';

export function transformSchema<T extends Deref<OpenApiSchema>>(
  context: OpenApiTransformerContext,
  schema: T,
  isReference = false
): ApiSchema {
  if (!schema) {
    throw new Error('Schema is required.');
  }
  const schemaSource = `${schema.$src.file}:${schema.$src.path}`;
  const existingSchema = context.schemas.get(schemaSource) ?? context.incompleteSchemas.get(schemaSource);
  if (existingSchema) return existingSchema as ApiSchema;

  const openApiObjectId = getOpenApiObjectIdentifier(schema);
  const existing = context.transformed.schemas.get(openApiObjectId);
  if (existing) return existing;

  let kind = determineSchemaKind(schema);
  let nullable = false;
  if (kind === 'multi-type') {
    const types = schema.type as string[];
    let isSingleType = types.length === 1;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (types.length === 2 && (types.includes('null') || types.includes(null!))) {
      nullable = true;
      isSingleType = true;
    }

    if (isSingleType) {
      const newType = types.filter((t) => t !== 'null' && t !== null)[0];
      schema = createOverwriteProxy(schema);
      schema.type = newType;
      kind = determineSchemaKind(schema);
    }
  }
  const id = context.idGenerator.generateId('schema');
  const nameInfo = determineSchemaName(schema, id);
  const result: IncompleteApiSchema = {
    $src: {
      ...schema.$src,
      component: schema,
    },
    $ref: undefined,
    id,
    name: nameInfo.name,
    isNameGenerated: nameInfo.isGenerated,
    description: schema.description,
    deprecated: schema.deprecated ?? false,
    accessibility: determineSchemaAccessibility(schema),
    kind,
    enum: schema.enum,
    default: schema.default,
    example: schema.example,
    nullable: nullable || schema.nullable === true,
    required: new Set(schema.required),
    custom: getCustomFields(schema),
    not: schema.not ? transformSchema(context, schema.not) : undefined,
    const: schema.const,
  };
  context.incompleteSchemas.set(schemaSource, result);

  const extensions = schemaTransformers[kind](schema, context);
  Object.assign(result, extensions);

  context.incompleteSchemas.delete(schemaSource);
  context.transformed.schemas.set(openApiObjectId, result as IncompleteApiSchema & ApiSchemaExtensions<ApiSchemaKind>);
  if (schema.$ref) result.$ref = transformSchema(context, schema.$ref, true);
  if (!isReference) {
    context.schemas.set(schemaSource, result as IncompleteApiSchema & ApiSchemaExtensions<ApiSchemaKind>);
  }
  return result as IncompleteApiSchema & ApiSchemaExtensions<ApiSchemaKind>;
}

const schemaTransformers: {
  [K in ApiSchemaKind]: (
    schema: Deref<OpenApiSchema>,
    context: OpenApiTransformerContext
  ) => Omit<ApiSchemaExtensions<K>, 'kind'>;
} = {
  oneOf: (schema, context) => ({
    oneOf: schema.oneOf?.map((s) => transformSchema(context, s)) ?? [],
  }),
  string: (schema) => ({
    type: 'string',
    format: schema.format,
    pattern: schema.pattern,
    minLength: schema.minLength,
    maxLength: schema.maxLength,
  }),
  number: (schema) => ({
    type: 'number',
    format: schema.format,
    minimum: schema.minimum,
    maximum: schema.maximum,
  }),
  boolean: (schema) => ({ type: 'boolean', format: schema.format }),
  object: (schema, context) => ({
    type: 'object',
    properties: transformSchemaProperties<Deref<OpenApiSchema>>(context, schema, transformSchema),
    format: schema.format,
    additionalProperties: transformAdditionalProperties(context, schema, transformSchema),
    allOf: schema.allOf?.map((s) => transformSchema(context, s)) ?? [],
    anyOf: schema.anyOf?.map((s) => transformSchema(context, s)) ?? [],
  }),
  integer: (schema) => ({
    type: 'integer',
    format: schema.format,
    minimum: schema.minimum,
    maximum: schema.maximum,
  }),
  array: (schema, context) => ({
    type: 'array',
    items: schema.items ? transformSchema(context, schema.items) : undefined,
    minItems: schema.minItems,
    maxItems: schema.maxItems,
  }),
  combined: (schema, context) => ({
    allOf: schema.allOf?.map((s) => transformSchema(context, s)) ?? [],
    anyOf: schema.anyOf?.map((s) => transformSchema(context, s)) ?? [],
  }),
  'multi-type': (schema, context) => ({
    type: schema.type as string[],
    items: schema.items ? transformSchema(context, schema.items) : undefined,
    minItems: schema.minItems,
    maxItems: schema.maxItems,
    minimum: schema.minimum,
    maximum: schema.maximum,
    format: schema.format,
    properties: transformSchemaProperties<Deref<OpenApiSchema>>(context, schema, transformSchema),
    additionalProperties: transformAdditionalProperties(context, schema, transformSchema),
    allOf: schema.allOf?.map((s) => transformSchema(context, s)) ?? [],
    anyOf: schema.anyOf?.map((s) => transformSchema(context, s)) ?? [],
    maxLength: schema.maxLength,
    minLength: schema.minLength,
    pattern: schema.pattern,
  }),
  null: () => ({ type: 'null' }),
  unknown: () => ({}),
};
