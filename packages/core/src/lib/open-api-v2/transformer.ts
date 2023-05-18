import { IJsonSchema, OpenAPIV2 } from 'openapi-types';

import { OpenApiV2SchemaKind } from './types.js';
import { OpenApiV2CollectorEndpointInfo } from '../collect/types.js';
import { notNullish } from '../helpers.js';
import {
  determineSchemaKind,
  determineSchemaName,
  determineSchemaAccessibility,
  getCustomFields,
  transformSchemaProperties,
  transformAdditionalProperties,
  determineEndpointName,
} from '../transform/helpers.js';
import { IncompleteApiSchema, OpenApiTransformer, OpenApiTransformerContext } from '../transform/types.js';
import {
  ApiEndpoint,
  ApiEndpointComponent,
  ApiHeader,
  ApiParameter,
  ApiParameterTarget,
  ApiPath,
  ApiRequestBody,
  ApiResponse,
  ApiSchema,
  ApiSchemaComponent,
  ApiSchemaExtensions,
  ApiSchemaKind,
  ApiService,
  ApiServiceComponent,
  Deref,
} from '../types.js';

export const openApiV2Transformer: OpenApiTransformer<'2.0'> = {
  transformDocument: (context, { document }) => transformDocument(context, document),
  transformSchema: (context, { schema }) => transformSchema(context, schema),
  transformEndpoint: transformEndpoint,
};

function transformDocument(context: OpenApiTransformerContext, document: Deref<OpenAPIV2.Document>) {
  for (const tag of document.tags ?? []) {
    const service: ApiService = {
      $src: tag.$src as ApiServiceComponent['$src'],
      id: context.idGenerator.generateId('service'),
      name: tag.name,
      description: tag.description,
      endpoints: [],
    };
    context.services.set(service.name, service);
  }
}

function transformSchema<T extends Deref<IJsonSchema> | undefined>(
  context: OpenApiTransformerContext,
  schema: T
): T extends undefined ? ApiSchema | undefined : ApiSchema {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!schema) return undefined!;
  const fullSchema = schema as Deref<Partial<OpenAPIV2.SchemaObject>>;
  const schemaSource = `${schema.$src.file}:${schema.$src.path}`;
  const existingSchema = context.schemas.get(schemaSource) ?? context.incompleteSchemas.get(schemaSource);
  if (existingSchema) return existingSchema as ApiSchema;

  let kind = determineSchemaKind(schema) as ApiSchemaKind;
  let nullable = false;
  if (kind === 'multi-type') {
    const types = schema.type as string[];
    let isSingleType = types.length === 1;
    if (types.length === 2 && (types.includes('null') || types.includes(null!))) {
      nullable = true;
      isSingleType = true;
    }

    if (isSingleType) {
      const newType = types.filter((t) => t !== 'null' && t !== null)[0];
      schema = { ...schema, type: newType } as NonNullable<T>;
      kind = determineSchemaKind(schema) as ApiSchemaKind;
    }
  }
  const id = context.idGenerator.generateId('schema');
  const nameInfo = determineSchemaName(schema, id);
  const result: IncompleteApiSchema = {
    $src: schema.$src as ApiSchemaComponent['$src'],
    id,
    name: nameInfo.name,
    isNameGenerated: nameInfo.isGenerated,
    description: schema.description,
    deprecated: false,
    accessibility: determineSchemaAccessibility(fullSchema),
    kind: kind as ApiSchemaKind,
    enum: schema.enum,
    default: fullSchema.default,
    example: fullSchema.example,
    nullable,
    required: new Set(schema.required),
    custom: getCustomFields(schema),
  };
  // TODO: Handle 'not' field
  context.incompleteSchemas.set(schemaSource, result);

  const extensions = schemaTransformers[kind](schema, context);
  Object.assign(result, extensions);

  context.incompleteSchemas.delete(schemaSource);
  context.schemas.set(schemaSource, result as IncompleteApiSchema & ApiSchemaExtensions<ApiSchemaKind>);
  return result as IncompleteApiSchema & ApiSchemaExtensions<ApiSchemaKind>;
}

function transformEndpoint(context: OpenApiTransformerContext, endpointInfo: OpenApiV2CollectorEndpointInfo) {
  const apiPath = transformApiPath(context, endpointInfo.path, endpointInfo.pathItem);
  const endpoint: ApiEndpoint = {
    $src: endpointInfo.operation.$src as ApiEndpointComponent['$src'],
    id: context.idGenerator.generateId('endpoint'),
    name: determineEndpointName(endpointInfo),
    path: endpointInfo.path,
    pathInfo: apiPath,
    method: endpointInfo.method,
    summary: endpointInfo.operation.summary,
    description: endpointInfo.operation.description,
    parameters: combineParameters(
      apiPath.parameters,
      endpointInfo.operation.parameters?.map((p) => transformParameter(context, p)).filter(notNullish) ?? []
    ),
    deprecated: endpointInfo.operation.deprecated ?? false,
    requestBody: transformRequestBody(context, endpointInfo.operation),
    responses: transformResponses(context, endpointInfo.operation),
    tags: endpointInfo.operation.tags ?? [],
    custom: getCustomFields(endpointInfo.operation),
  };

  const tags = endpoint.tags.length === 0 ? [''] : endpoint.tags;
  for (const tag of tags) {
    let service = context.services.get(tag);
    if (!service) {
      service = {
        id: context.idGenerator.generateId('service'),
        name: tag,
        endpoints: [],
      };
      context.services.set(tag, service);
    }

    service.endpoints.push(endpoint);
  }

  apiPath[endpointInfo.method] = endpoint;
  context.endpoints.set(`${endpointInfo.method}:${endpointInfo.path}`, endpoint);
  return endpoint;
}

function transformApiPath(
  context: OpenApiTransformerContext,
  path: string,
  pathItem: Deref<OpenAPIV2.PathItemObject>
): ApiPath {
  const existingPath = context.paths.get(path);
  if (existingPath) return existingPath;

  const apiPath = {
    $src: pathItem.$src as ApiPath['$src'],
    id: context.idGenerator.generateId('path'),
    path: path,
    parameters: pathItem.parameters?.map((p) => transformParameter(context, p)).filter(notNullish) ?? [],
  };

  context.paths.set(path, apiPath);
  return apiPath;
}

function transformParameter(
  context: OpenApiTransformerContext,
  parameter: Deref<OpenAPIV2.InBodyParameterObject | OpenAPIV2.GeneralParameterObject>
): ApiParameter | undefined {
  if (parameter.in === 'body') return undefined;
  return {
    $src: parameter.$src as ApiParameter['$src'],
    id: context.idGenerator.generateId('parameter'),
    name: parameter.name,
    target: parameter.in as ApiParameterTarget,
    description: parameter.description,
    required: parameter.required ?? false,
    deprecated: false,
    allowEmptyValue: parameter.allowEmptyValue,
    schema: transformSchema(context, parameter.schema),
  };
}

function combineParameters(pathParams: ApiParameter[], operationParams: ApiParameter[]): ApiParameter[] {
  const result = [...pathParams];
  for (const opParam of operationParams) {
    const existingParam = result.findIndex((p) => p.name === opParam.name);
    if (existingParam >= 0) {
      result[existingParam] = opParam;
    } else {
      result.push(opParam);
    }
  }
  return result;
}

function transformRequestBody(
  context: OpenApiTransformerContext,
  operation: Deref<OpenAPIV2.OperationObject>
): ApiRequestBody | undefined {
  const requestBody = operation.parameters?.find((p) => p.in === 'body');
  if (!requestBody) return undefined;
  return {
    $src: requestBody.$src as ApiRequestBody['$src'],
    id: context.idGenerator.generateId('requestBody'),
    description: requestBody.description,
    required: requestBody.required ?? false,
    content:
      operation.consumes && operation.consumes.length > 0
        ? [
            {
              $src: {
                ...operation.$src,
                component: undefined as never,
              },
              id: context.idGenerator.generateId('content'),
              // TODO: support multiple content types
              type: operation.consumes[0],
              schema: transformSchema(context, requestBody.schema),
            },
          ]
        : [],
  };
}

function transformResponses(
  context: OpenApiTransformerContext,
  operation: Deref<OpenAPIV2.OperationObject>
): ApiResponse[] {
  if (!operation.responses) return [];
  const result: ApiResponse[] = [];
  for (const status of Object.keys(operation.responses)) {
    if (status === '$src') continue;
    const response = operation.responses[status];
    if (!response) continue;
    result.push({
      $src: response.$src as ApiResponse['$src'],
      id: context.idGenerator.generateId('response'),
      statusCode: Number(status),
      description: response.description,
      headers: transformHeaders(context, response.headers),
      contentOptions:
        operation.produces && operation.produces.length > 0
          ? [
              {
                $src: {
                  ...operation.$src,
                  component: undefined as never,
                },
                id: context.idGenerator.generateId('content'),
                // TODO: support multiple content types
                type: operation.produces[0],
                schema: transformSchema(context, response.schema),
              },
            ]
          : [],
    });
  }
  return result;
}

function transformHeaders(
  context: OpenApiTransformerContext,
  headers?: Deref<{ [name: string]: OpenAPIV2.HeaderObject }>
): ApiHeader[] {
  if (!headers) return [];
  const result: ApiHeader[] = [];
  for (const name of Object.keys(headers)) {
    if (name === '$src') continue;
    const header = headers[name];
    result.push({
      $src: header.$src as ApiHeader['$src'],
      id: context.idGenerator.generateId('header'),
      name,
      required: false,
      deprecated: false,
      schema: undefined,
    });
  }
  return result;
}

const schemaTransformers: {
  [K in OpenApiV2SchemaKind]: (
    schema: Deref<IJsonSchema>,
    context: OpenApiTransformerContext
  ) => Omit<ApiSchemaExtensions<K>, 'kind'>;
} = {
  oneOf: (schema, context) => ({
    oneOf: schema.oneOf?.map((s) => transformSchema(context, s)) ?? [],
  }),
  string: (schema) => ({
    type: 'string',
    pattern: schema.pattern,
    minLength: schema.minLength,
    maxLength: schema.maxLength,
  }),
  number: (schema) => ({
    type: 'number',
    minimum: schema.minimum,
    maximum: schema.maximum,
  }),
  boolean: () => ({ type: 'boolean' }),
  object: (schema, context) => ({
    type: 'object',
    properties: transformSchemaProperties<Deref<IJsonSchema>>(context, schema, transformSchema),
    additionalProperties: transformAdditionalProperties(context, schema, transformSchema),
    allOf: schema.allOf?.map((s) => transformSchema(context, s)) ?? [],
    anyOf: schema.anyOf?.map((s) => transformSchema(context, s)) ?? [],
  }),
  integer: (schema) => ({
    type: 'integer',
    minimum: schema.minimum,
    maximum: schema.maximum,
  }),
  array: (schema, context) => ({
    type: 'array',
    items: transformSchema(context, buildOneOfSchema(context, schema, schema.items)),
    minItems: schema.minItems,
    maxItems: schema.maxItems,
  }),
  combined: (schema, context) => ({
    allOf: schema.allOf?.map((s) => transformSchema(context, s)) ?? [],
    anyOf: schema.anyOf?.map((s) => transformSchema(context, s)) ?? [],
  }),
  'multi-type': (schema, context) => ({
    type: schema.type as string[],
    items: transformSchema(context, buildOneOfSchema(context, schema, schema.items)),
    minItems: schema.minItems,
    maxItems: schema.maxItems,
    minimum: schema.minimum,
    maximum: schema.maximum,
    properties: transformSchemaProperties<Deref<IJsonSchema>>(context, schema, transformSchema),
    additionalProperties: transformAdditionalProperties(context, schema, transformSchema),
    allOf: schema.allOf?.map((s) => transformSchema(context, s)) ?? [],
    anyOf: schema.anyOf?.map((s) => transformSchema(context, s)) ?? [],
  }),
  null: () => ({ type: 'null' }),
  unknown: () => ({}),
};

function buildOneOfSchema(
  context: OpenApiTransformerContext,
  rootSchema: Deref<IJsonSchema>,
  options: Deref<IJsonSchema[]> | Deref<IJsonSchema> | undefined
): Deref<IJsonSchema> | undefined {
  if (!options) return undefined;
  if (!Array.isArray(options)) return options;
  if (!options.length) return undefined;
  if (options.length === 1) return options[0];
  return {
    $src: {
      ...rootSchema.$src,
      path: rootSchema.$src.path + '/items',
    },
    id: context.idGenerator.generateId('schema'),
    oneOf: options,
  };
}
