import { OpenAPIV3 } from 'openapi-types';

import { OpenApiV3SchemaKind } from './types.js';
import { OpenApiV3CollectorEndpointInfo } from '../collect/types.js';
import {
  determineSchemaKind,
  determineSchemaName,
  determineSchemaAccessibility,
  getCustomFields,
  determineEndpointName,
  transformSchemaProperties,
  transformAdditionalProperties,
} from '../transform/helpers.js';
import { OpenApiTransformer, OpenApiTransformerContext, IncompleteApiSchema } from '../transform/types.js';
import {
  Deref,
  ApiService,
  ApiServiceComponent,
  ApiSchema,
  ApiSchemaComponent,
  ApiSchemaExtensions,
  ApiSchemaKind,
  ApiEndpoint,
  ApiEndpointComponent,
  ApiPath,
  ApiParameter,
  ApiRequestBody,
  ApiResponse,
  ApiContent,
  ApiHeader,
  ApiParameterTarget,
} from '../types.js';

export const openApiV3Transformer: OpenApiTransformer<'3.0'> = {
  transformDocument: (context, { document }) => transformDocument(context, document),
  transformSchema: (context, { schema }) => transformSchema(context, schema),
  transformEndpoint: transformEndpoint,
};

export function transformDocument(
  context: OpenApiTransformerContext,
  document: Deref<Pick<OpenAPIV3.Document, 'tags'>>
) {
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

function transformSchema<T extends Deref<OpenAPIV3.SchemaObject> | undefined>(
  context: OpenApiTransformerContext,
  schema: T
): T extends undefined ? ApiSchema | undefined : ApiSchema {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!schema) return undefined!;
  const schemaSource = `${schema.$src.file}:${schema.$src.path}`;
  const existingSchema = context.schemas.get(schemaSource) ?? context.incompleteSchemas.get(schemaSource);
  if (existingSchema) return existingSchema as ApiSchema;

  const kind = determineSchemaKind(schema);
  const id = context.idGenerator.generateId('schema');
  const nameInfo = determineSchemaName(schema, id);
  const result: IncompleteApiSchema = {
    $src: schema.$src as ApiSchemaComponent['$src'],
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
    nullable: schema.nullable,
    required: new Set(schema.required),
    custom: getCustomFields(schema),
  };
  context.incompleteSchemas.set(schemaSource, result);

  const extensions = schemaTransformers[kind](schema, context);
  Object.assign(result, extensions);

  context.incompleteSchemas.delete(schemaSource);
  context.schemas.set(schemaSource, result as IncompleteApiSchema & ApiSchemaExtensions<ApiSchemaKind>);
  return result as IncompleteApiSchema & ApiSchemaExtensions<ApiSchemaKind>;
}

function transformEndpoint(context: OpenApiTransformerContext, endpointInfo: OpenApiV3CollectorEndpointInfo) {
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
      endpointInfo.operation.parameters?.map((p) => transformParameter(context, p)) ?? []
    ),
    deprecated: endpointInfo.operation.deprecated ?? false,
    requestBody: transformRequestBody(context, endpointInfo.operation.requestBody),
    responses: transformResponses(context, endpointInfo.operation.responses),
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
  pathItem: Deref<OpenAPIV3.PathItemObject>
): ApiPath {
  const existingPath = context.paths.get(path);
  if (existingPath) return existingPath;

  const apiPath = {
    $src: pathItem.$src as ApiPath['$src'],
    id: context.idGenerator.generateId('path'),
    summary: pathItem.summary,
    description: pathItem.description,
    path: path,
    parameters: pathItem.parameters?.map((p) => transformParameter(context, p)) ?? [],
  };

  context.paths.set(path, apiPath);
  return apiPath;
}

function transformParameter(
  context: OpenApiTransformerContext,
  parameter: Deref<OpenAPIV3.ParameterObject>
): ApiParameter {
  return {
    $src: parameter.$src as ApiParameter['$src'],
    id: context.idGenerator.generateId('parameter'),
    name: parameter.name,
    target: parameter.in as ApiParameterTarget,
    description: parameter.description,
    required: parameter.required ?? false,
    deprecated: parameter.deprecated ?? false,
    allowEmptyValue: parameter.allowEmptyValue,
    style: parameter.style,
    explode: parameter.explode,
    allowReserved: parameter.allowReserved,
    schema: transformSchema(context, parameter.schema),
  };
}

function transformRequestBody(
  context: OpenApiTransformerContext,
  requestBody?: Deref<OpenAPIV3.RequestBodyObject>
): ApiRequestBody | undefined {
  if (!requestBody) return undefined;
  return {
    $src: requestBody.$src as ApiRequestBody['$src'],
    id: context.idGenerator.generateId('requestBody'),
    description: requestBody.description,
    required: requestBody.required ?? false,
    content: transformContent(context, requestBody.content),
  };
}

function transformResponses(
  context: OpenApiTransformerContext,
  responses?: Deref<OpenAPIV3.ResponsesObject>
): ApiResponse[] {
  if (!responses) return [];
  const result: ApiResponse[] = [];
  for (const status of Object.keys(responses)) {
    if (status === '$src') continue;
    const response = responses[status];
    result.push({
      $src: response.$src as ApiResponse['$src'],
      id: context.idGenerator.generateId('response'),
      statusCode: Number(status),
      description: response.description,
      headers: transformHeaders(context, response.headers),
      contentOptions: transformContent(context, response.content),
    });
  }
  return result;
}

function transformContent(
  context: OpenApiTransformerContext,
  content?: Deref<{ [media: string]: OpenAPIV3.MediaTypeObject }>
): ApiContent[] {
  if (!content) return [];
  const result: ApiContent[] = [];
  for (const media of Object.keys(content)) {
    if (media === '$src') continue;
    const mediaType = content[media];
    result.push({
      $src: mediaType.$src as ApiContent['$src'],
      id: context.idGenerator.generateId('content'),
      type: media,
      schema: transformSchema(context, mediaType.schema),
    });
  }
  return result;
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

function transformHeaders(
  context: OpenApiTransformerContext,
  headers?: Deref<{ [name: string]: OpenAPIV3.HeaderObject }>
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
      description: header.description,
      required: header.required ?? false,
      deprecated: header.deprecated ?? false,
      allowEmptyValue: header.allowEmptyValue,
      style: header.style,
      explode: header.explode,
      allowReserved: header.allowReserved,
      schema: transformSchema(context, header.schema),
    });
  }
  return result;
}

const schemaTransformers: {
  [K in OpenApiV3SchemaKind]: (
    schema: Deref<OpenAPIV3.SchemaObject>,
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
    properties: transformSchemaProperties<Deref<OpenAPIV3.SchemaObject>>(context, schema, transformSchema),
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
    items: transformSchema(context, (schema as Deref<OpenAPIV3.ArraySchemaObject>).items),
    minItems: schema.minItems,
    maxItems: schema.maxItems,
  }),
  combined: (schema, context) => ({
    allOf: schema.allOf?.map((s) => transformSchema(context, s)) ?? [],
    anyOf: schema.anyOf?.map((s) => transformSchema(context, s)) ?? [],
  }),
  unknown: () => ({}),
};
