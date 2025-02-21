import type { OpenApiSchema } from '../parse/openapi-types.ts';
import type { Deref } from '../parse/types.ts';
import { createOverwriteProxy } from '../utils/object.utils.ts';
import type { ApiSchema, ApiSchemaExtensions, ApiSchemaKind } from './api-types.ts';
import type { IncompleteApiSchema, OpenApiTransformerContext } from './types.ts';
import { determineSchemaAccessibility } from './utils/determine-schema-accessibility.ts';
import { determineSchemaKind } from './utils/determine-schema-kind.ts';
import { determineSchemaName } from './utils/determine-schema-name.ts';
import { getCustomFields } from './utils/get-custom-fields.ts';
import { getOpenApiObjectIdentifier } from './utils/get-open-api-object-identifier.ts';
import { transformAdditionalProperties } from './utils/transform-additional-properties.ts';
import { transformSchemaProperties } from './utils/transform-schema-properties.ts';

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
    isNameGenerated: nameInfo.source !== 'schema' && nameInfo.source !== 'header' && nameInfo.source !== 'file' &&
      nameInfo.source !== 'parameter' && nameInfo.source !== 'response',
    nameSource: nameInfo.source,
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
        propertyName: typeof schema.discriminator === 'string'
          ? schema.discriminator
          : schema.discriminator.propertyName,
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
  const completeSchema = Object.assign(incompleteSchema, extensions) as
    & IncompleteApiSchema
    & ApiSchemaExtensions<ApiSchemaKind>;
  resolveDescriminatorMapping(ctx, completeSchema);

  ctx.incompleteSchemas.delete(schemaSource);
  ctx.transformed.schemas.set(openApiObjectId, completeSchema);
  ctx.schemas.set(schemaSource, completeSchema);
  return completeSchema;
}

function allExtensionsTransformer(schema: Deref<OpenApiSchema>, context: OpenApiTransformerContext) {
  return {
    oneOf: schema.oneOf?.map((s) => transformSchema(context, s)) ?? [],
    format: schema.format,
    pattern: schema.pattern,
    minLength: schema.minLength,
    maxLength: schema.maxLength,
    minimum: schema.minimum,
    maximum: schema.maximum,
    properties: transformSchemaProperties<Deref<OpenApiSchema>>(context, schema, transformSchema),
    additionalProperties: transformAdditionalProperties(context, schema, transformSchema),
    allOf: schema.allOf?.map((s) => transformSchema(context, s)) ?? [],
    anyOf: schema.anyOf?.map((s) => transformSchema(context, s)) ?? [],
    items: schema.items ? transformSchema(context, schema.items) : undefined,
    minItems: schema.minItems,
    maxItems: schema.maxItems,
  };
}

const schemaTransformers: {
  [K in ApiSchemaKind]: (
    schema: Deref<OpenApiSchema>,
    context: OpenApiTransformerContext,
  ) => Omit<ApiSchemaExtensions<K>, 'kind'>;
} = {
  oneOf: (schema, context) => ({
    ...allExtensionsTransformer(schema, context),
  }),
  string: (schema, context) => ({
    type: 'string',
    ...allExtensionsTransformer(schema, context),
  }),
  number: (schema, context) => ({
    type: 'number',
    ...allExtensionsTransformer(schema, context),
  }),
  boolean: (schema, context) => ({ type: 'boolean', ...allExtensionsTransformer(schema, context) }),
  object: (schema, context) => ({
    type: 'object',
    ...allExtensionsTransformer(schema, context),
  }),
  integer: (schema, context) => ({
    type: 'integer',
    ...allExtensionsTransformer(schema, context),
  }),
  array: (schema, context) => ({
    type: 'array',
    ...allExtensionsTransformer(schema, context),
  }),
  combined: (schema, context) => ({
    ...allExtensionsTransformer(schema, context),
  }),
  'multi-type': (schema, context) => ({
    type: schema.type as string[],
    ...allExtensionsTransformer(schema, context),
  }),
  null: () => ({ type: 'null' }),
  unknown: () => ({}),
};

function resolveDescriminatorMapping(context: OpenApiTransformerContext, schema: ApiSchema) {
  const discriminator = schema.$src.component.discriminator;
  if (discriminator && typeof discriminator === 'object' && discriminator.mapping) {
    for (const key of Object.keys(discriminator.mapping)) {
      const mappedSchemaRef = discriminator.mapping[key];
      const mappedSchema = transformSchema(context, mappedSchemaRef);
      if (schema.discriminator) {
        schema.discriminator.mapping[key] = mappedSchema;
        const hasInheritedSchema = mappedSchema.inheritedSchemas.some((x) => x.id === schema.id);
        if (!hasInheritedSchema) {
          mappedSchema.inheritedSchemas.push(
            schema as ApiSchema & { discriminator: NonNullable<ApiSchema['discriminator']> },
          );
        }
      }
    }
  }

  if (schema.kind === 'combined' && schema.allOf) {
    for (const s of schema.allOf) {
      const base = findDiscriminatedSchema(s);
      if (!base) continue;
      if (base.discriminator && base.discriminator.propertyName) {
        const origDiscriminator = base.$src.component.discriminator;
        if (
          origDiscriminator &&
          typeof origDiscriminator === 'object' &&
          origDiscriminator.mapping &&
          Object.values(origDiscriminator.mapping).some(
            (x) => x.$src.file === schema.$src.file && x.$src.path === schema.$src.path,
          )
        ) {
          continue;
        }

        const mappingKey = schema.isNameGenerated ? null : schema.name;
        if (!mappingKey) {
          continue;
        }

        base.discriminator.mapping[mappingKey] = schema;
        const hasInheritedSchema = schema.inheritedSchemas.some((x) => x.id === base.id);
        if (!hasInheritedSchema) {
          schema.inheritedSchemas.push(base as ApiSchema & { discriminator: NonNullable<ApiSchema['discriminator']> });
        }
      }
    }
  }
}

function findDiscriminatedSchema(
  schema: ApiSchema,
): (ApiSchema & { discriminator: NonNullable<ApiSchema['discriminator']> }) | null {
  const origDiscriminator = schema.$src.originalComponent.discriminator;
  if (origDiscriminator && (typeof origDiscriminator === 'string' || origDiscriminator.propertyName)) {
    return schema as ApiSchema & { discriminator: NonNullable<ApiSchema['discriminator']> };
  }
  return schema.$ref ? findDiscriminatedSchema(schema.$ref) : null;
}
