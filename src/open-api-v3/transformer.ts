import { OpenAPIV3 } from 'openapi-types';
import {
  ApiContent,
  ApiEndpoint,
  ApiEndpointComponent,
  ApiHeader,
  ApiParameter,
  ApiPath,
  ApiRequestBody,
  ApiResponse,
  ApiSchema,
  ApiSchemaAccessibility,
  ApiSchemaComponent,
  ApiSchemaExtensions,
  ApiSchemaKind,
  ApiSchemaProperty,
  ApiService,
  ApiServiceComponent,
} from '../api-types.js';
import { isNullish } from '../helpers.js';
import { Deref, OpenApiData } from '../types.js';
import { OpenApiV3CollectorData, OpenApiV3EndpointInfo, OpenApiV3SSchemaKind } from './types.js';

type IncompleteApiSchema = Omit<ApiSchema, keyof ApiSchemaExtensions<ApiSchemaKind>>;
type ArrayItem<T> = T extends (infer U)[] ? U : never;
type TransformerContext = {
  input: OpenApiV3CollectorData;
  incompleteSchemas: Map<string, IncompleteApiSchema>;
  paths: Map<string, ApiPath>;
} & { [K in keyof OpenApiData]: Map<string, ArrayItem<OpenApiData[K]>> };

export function transformOpenApiV3(data: OpenApiV3CollectorData): OpenApiData {
  const context: TransformerContext = {
    input: data,
    incompleteSchemas: new Map(),
    paths: new Map(),
    services: new Map(),
    endpoints: new Map(),
    schemas: new Map(),
  };

  for (const document of data.documents) {
    for (const tag of document.tags ?? []) {
      const service: ApiService = {
        $src: tag.$src as ApiServiceComponent['$src'],
        name: tag.name,
        description: tag.description,
        endpoints: [],
      };
      context.services.set(service.name, service);
    }
  }
  for (const schema of context.input.schemas.values()) {
    transformSchema(context, schema);
  }
  for (const endpoint of context.input.endpoints.values()) {
    transformEndpoint(context, endpoint);
  }

  return {
    services: Array.from(context.services.values()),
    endpoints: Array.from(context.endpoints.values()),
    schemas: Array.from(context.schemas.values()),
  };
}

function transformSchema(
  context: TransformerContext,
  schema?: Deref<OpenAPIV3.SchemaObject>
): ApiSchema {
  if (!schema) return undefined!;
  const schemaSource = `${schema.$src.file}:${schema.$src.path}`;
  const existingSchema =
    context.schemas.get(schemaSource) ?? context.incompleteSchemas.get(schemaSource);
  if (existingSchema) return existingSchema as ApiSchema;

  const kind = determineSchemaKind(schema);
  const id = context.schemas.size + context.incompleteSchemas.size;
  const result: IncompleteApiSchema = {
    $src: schema.$src as ApiSchemaComponent['$src'],
    id,
    name: determineSchemaName(schema, id),
    description: schema.description,
    deprecated: schema.deprecated ?? false,
    accessibility: determineSchemaAccessibility(schema),
    kind,
    enum: schema.enum,
    default: schema.default,
    format: schema.format,
    nullable: schema.nullable,
    custom: getCustomFields(schema),
  };
  context.incompleteSchemas.set(schemaSource, result);

  const extensions = schemaTransformers[kind](schema, context);
  Object.assign(result, extensions);

  context.incompleteSchemas.delete(schemaSource);
  context.schemas.set(schemaSource, result);
  return result;
}

function transformEndpoint(context: TransformerContext, endpointInfo: OpenApiV3EndpointInfo) {
  const apiPath = transformApiPath(context, endpointInfo.path, endpointInfo.pathItem);
  const endpoint: ApiEndpoint = {
    $src: endpointInfo.operation.$src as ApiEndpointComponent['$src'],
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
  context: TransformerContext,
  path: string,
  pathItem: Deref<OpenAPIV3.PathItemObject>
): ApiPath {
  const existingPath = context.paths.get(path);
  if (existingPath) return existingPath;

  const apiPath = {
    $src: pathItem.$src as ApiPath['$src'],
    summary: pathItem.summary,
    description: pathItem.description,
    path: path,
    parameters: pathItem.parameters?.map((p) => transformParameter(context, p)) ?? [],
  };

  context.paths.set(path, apiPath);
  return apiPath;
}

function transformParameter(
  context: TransformerContext,
  parameter: Deref<OpenAPIV3.ParameterObject>
): ApiParameter {
  return {
    $src: parameter.$src as ApiParameter['$src'],
    name: parameter.name,
    target: parameter.in as any,
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
  context: TransformerContext,
  requestBody?: Deref<OpenAPIV3.RequestBodyObject>
): ApiRequestBody | undefined {
  if (!requestBody) return undefined;
  return {
    $src: requestBody.$src as ApiRequestBody['$src'],
    description: requestBody.description,
    required: requestBody.required ?? false,
    content: transformContent(context, requestBody.content),
  };
}

function transformResponses(
  context: TransformerContext,
  responses?: Deref<OpenAPIV3.ResponsesObject>
): ApiResponse[] {
  if (!responses) return [];
  const result: ApiResponse[] = [];
  for (const status of Object.keys(responses)) {
    if (status === '$src') continue;
    const response = responses[status];
    result.push({
      $src: response.$src as ApiResponse['$src'],
      statusCode: Number(status),
      description: response.description,
      headers: transformHeaders(context, response.headers),
      contentOptions: transformContent(context, response.content),
    });
  }
  return result;
}

function transformContent(
  context: TransformerContext,
  content?: Deref<{ [media: string]: OpenAPIV3.MediaTypeObject }>
): ApiContent[] {
  if (!content) return [];
  const result: ApiContent[] = [];
  for (const media of Object.keys(content)) {
    if (media === '$src') continue;
    const mediaType = content[media];
    result.push({
      $src: mediaType.$src as ApiContent['$src'],
      type: media,
      schema: transformSchema(context, mediaType.schema),
    });
  }
  return result;
}

function combineParameters(
  pathParams: ApiParameter[],
  operationParams: ApiParameter[]
): ApiParameter[] {
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
  context: TransformerContext,
  headers?: Deref<{ [name: string]: OpenAPIV3.HeaderObject }>
): ApiHeader[] {
  if (!headers) return [];
  const result: ApiHeader[] = [];
  for (const name of Object.keys(headers)) {
    if (name === '$src') continue;
    const header = headers[name];
    result.push({
      $src: header.$src as ApiHeader['$src'],
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

function determineSchemaKind(schema: Deref<OpenAPIV3.SchemaObject>): OpenApiV3SSchemaKind {
  if (schema.oneOf) {
    return 'oneOf';
  } else if (schema.allOf || schema.anyOf) {
    return 'combined';
  } else if (schema.type) {
    return schema.type;
  }

  return 'unknown';
}

function determineSchemaName(schema: Deref<OpenAPIV3.SchemaObject>, id: number): string {
  if (schema.title) return schema.title;
  if (schema.$src.path.startsWith('/components/schemas/')) {
    return schema.$src.path.substring('/components/schemas/'.length);
  } else {
    return `Schema${id}`;
  }
}

function determineSchemaAccessibility(
  schema: Deref<OpenAPIV3.SchemaObject>
): ApiSchemaAccessibility {
  if (schema.readOnly === true) {
    return schema.writeOnly === true ? 'none' : 'readOnly';
  } else {
    return schema.writeOnly === true ? 'writeOnly' : 'all';
  }
}

function getCustomFields(schema: Deref<OpenAPIV3.SchemaObject>): Record<string, any> {
  const result: Record<string, any> = {};
  const schemaRecord = schema as Record<string, any>;
  for (const key in schemaRecord) {
    if (key.startsWith('x-')) {
      const name = key.substring(2);
      result[name] = schemaRecord[key];
    }
  }
  return result;
}

function determineEndpointName(endpointInfo: OpenApiV3EndpointInfo): string {
  if (endpointInfo.operation.operationId) return endpointInfo.operation.operationId;
  return endpointInfo.method + endpointInfo.path.replace(/\{([^}]+)\}/g, ':$1').replace(/\//g, '_');
}

const schemaTransformers: {
  [K in OpenApiV3SSchemaKind]: (
    schema: Deref<OpenAPIV3.SchemaObject>,
    context: TransformerContext
  ) => ApiSchemaExtensions<K>;
} = {
  oneOf: (schema, context) => ({
    oneOf: schema.oneOf!.map((s) => transformSchema(context, s)),
  }),
  string: () => ({ type: 'string' }),
  number: (schema) => ({
    type: 'number',
    minimum: schema.minimum,
    maximum: schema.maximum,
  }),
  boolean: () => ({ type: 'boolean' }),
  object: (schema, context) => ({
    type: 'object',
    properties: transformSchemaProperties(context, schema),
    additionalProperties: transformAdditionalProperties(context, schema),
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

function transformSchemaProperties(
  context: TransformerContext,
  schema: Deref<OpenAPIV3.SchemaObject>
): ApiSchemaProperty[] {
  if (!schema.properties) return [];
  const result: ApiSchemaProperty[] = [];
  for (const name of Object.keys(schema.properties)) {
    if (name === '$src') continue;
    result.push({
      name,
      required: schema.required?.includes(name) ?? false,
      schema: transformSchema(context, schema.properties[name]),
    });
  }
  return result;
}

function transformAdditionalProperties(
  context: TransformerContext,
  schema: Deref<OpenAPIV3.SchemaObject>
): boolean | ApiSchema | undefined {
  if (isNullish(schema.additionalProperties)) return undefined;
  if (typeof schema.additionalProperties === 'boolean') return schema.additionalProperties;
  return transformSchema(context, schema.additionalProperties);
}
