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

export function transformSchema<T extends Deref<OpenApiSchema>>(ctx: OpenApiTransformerContext, schema: T): ApiSchema {
  if (!schema) {
    throw new Error('Schema is required.');
  }
  const schemaSource = `${schema.$src.file}:${schema.$src.path}`;
  const existingSchema = ctx.schemas.get(schemaSource) ?? ctx.incompleteSchemas.get(schemaSource);
  if (existingSchema) return existingSchema as ApiSchema;

  const openApiObjectId = getOpenApiObjectIdentifier(schema);
  const existing = ctx.transformed.schemas.get(openApiObjectId);
  if (existing) return existing;

  let kind = determineSchemaKind(ctx, schema);
  let nullable = kind === 'null';
  if (kind === 'multi-type') {
    const types = schema.type as string[];
    let isSingleType = types.length === 1;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (types.includes('null') || types.includes(null!)) {
      nullable = true;
      isSingleType = types.length === 2;
    }

    if (isSingleType) {
      const newType = types.filter((t) => t !== 'null' && t !== null)[0];
      schema = createOverwriteProxy(schema);
      schema.type = newType;
      kind = determineSchemaKind(ctx, schema);
    } else {
      schema.type = types.filter((t) => t !== 'null' && t !== null);
    }
  }

  const id = ctx.idGenerator.generateId('schema');
  const nameInfo = determineSchemaName(schema, id);
  const incompleteSchema: IncompleteApiSchema = {
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
    not: schema.not ? transformSchema(ctx, schema.not) : undefined,
    const: schema.const,
    discriminator: schema.discriminator
      ? {
          propertyName:
            typeof schema.discriminator === 'string' ? schema.discriminator : schema.discriminator.propertyName,
          mapping: {},
        }
      : undefined,
    inheritedSchemas: [],
  };
  ctx.incompleteSchemas.set(schemaSource, incompleteSchema);

  if (schema.$ref) {
    incompleteSchema.$ref = transformSchema(ctx, schema.$ref);
  }
  const extensions = schemaTransformers[kind](schema, ctx);
  const completeSchema = Object.assign(incompleteSchema, extensions) as IncompleteApiSchema &
    ApiSchemaExtensions<ApiSchemaKind>;
  resolveDescriminatorMapping(ctx, completeSchema);

  ctx.incompleteSchemas.delete(schemaSource);
  ctx.transformed.schemas.set(openApiObjectId, completeSchema);
  ctx.schemas.set(schemaSource, completeSchema);
  return completeSchema;
}

const schemaTransformers: {
  [K in ApiSchemaKind]: (
    schema: Deref<OpenApiSchema>,
    context: OpenApiTransformerContext,
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

function resolveDescriminatorMapping(context: OpenApiTransformerContext, schema: ApiSchema) {
  const discriminator = schema.$src.component.discriminator;
  if (!discriminator || typeof discriminator === 'string' || !discriminator.mapping) return;
  for (const key of Object.keys(discriminator.mapping)) {
    const mappedSchemaRef = discriminator.mapping[key];
    const mappedSchema = transformSchema(context, mappedSchemaRef);
    if (schema.discriminator) {
      schema.discriminator.mapping[key] = mappedSchema;
      mappedSchema.inheritedSchemas.push(
        schema as ApiSchema & { discriminator: NonNullable<ApiSchema['discriminator']> },
      );
    }
  }
}
