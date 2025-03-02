import type { OpenApiCollectorEndpointInfo } from '../collect/types.ts';
import { isOpenApiObjectProperty } from '../internal-utils.ts';
import type {
  OpenApiHeader,
  OpenApiMediaType,
  OpenApiParameter,
  OpenApiPathItem,
  OpenApiRequestBody,
  OpenApiResponse,
  OpenApiSchema,
} from '../parse/openapi-types.ts';
import type { Deref } from '../parse/types.ts';
import type {
  ApiContent,
  ApiEndpoint,
  ApiHeader,
  ApiParameter,
  ApiParameterTarget,
  ApiPath,
  ApiRequestBody,
  ApiResponse,
} from './api-types.ts';
import { transformSchema } from './transform-schema.ts';
import type { OpenApiTransformerContext } from './types.ts';
import { determineEndpointName } from './utils/determine-endpoint-name.ts';
import { getCustomFields } from './utils/get-custom-fields.ts';
import { getOpenApiObjectIdentifier } from './utils/get-open-api-object-identifier.ts';

export function transformEndpoint(context: OpenApiTransformerContext, endpointInfo: OpenApiCollectorEndpointInfo) {
  const apiPath = transformApiPath(context, endpointInfo.path, endpointInfo.pathItem);
  const endpoint: ApiEndpoint = {
    $src: {
      ...endpointInfo.operation.$src,
      component: endpointInfo.operation,
    },
    $ref: undefined,
    id: context.idGenerator.generateId('endpoint'),
    name: determineEndpointName(endpointInfo),
    path: endpointInfo.path,
    pathInfo: apiPath,
    method: endpointInfo.method,
    summary: endpointInfo.operation.summary,
    description: endpointInfo.operation.description,
    parameters: combineParameters(
      apiPath.parameters,
      endpointInfo.operation.parameters?.map((p) => transformParameter(context, p)) ?? [],
    ),
    deprecated: endpointInfo.operation.deprecated ?? false,
    requestBody: endpointInfo.operation.requestBody
      ? transformRequestBody(context, endpointInfo.operation.requestBody)
      : undefined,
    responses: transformResponses(context, endpointInfo.operation.responses),
    tags: endpointInfo.operation.tags ?? [],
    custom: getCustomFields(endpointInfo.operation),
  };

  const tags = endpoint.tags.length === 0 ? [''] : endpoint.tags;
  for (const tag of tags) {
    let service = context.services.get(tag);
    if (!service) {
      const id = context.idGenerator.generateId('service');
      service = {
        $ref: undefined,
        id,
        name: tag || id,
        description: undefined,
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
  pathItem: Deref<OpenApiPathItem>,
  isReference = false,
): ApiPath {
  const existingPath = context.paths.get(path);
  if (existingPath) return existingPath;

  const openApiObjectId = getOpenApiObjectIdentifier(pathItem);
  const existing = context.transformed.paths.get(openApiObjectId);
  if (existing) return existing;

  const ref = pathItem.$ref ? transformApiPath(context, path, pathItem.$ref, true) : undefined;
  const apiPath: ApiPath = {
    $src: {
      ...pathItem.$src,
      component: pathItem,
    },
    $ref: ref,
    id: context.idGenerator.generateId('path'),
    summary: pathItem.summary,
    description: pathItem.description,
    path: path,
    parameters: pathItem.parameters?.map((p) => transformParameter(context, p)) ?? [],

    // HTTP methods are added later (see transformEndpoint)
    get: undefined,
    put: undefined,
    post: undefined,
    delete: undefined,
    options: undefined,
    head: undefined,
    patch: undefined,
    trace: undefined,
  };

  context.transformed.paths.set(openApiObjectId, apiPath);
  if (!isReference) context.paths.set(path, apiPath);
  return apiPath;
}

function transformParameter(context: OpenApiTransformerContext, parameter: Deref<OpenApiParameter>): ApiParameter {
  const openApiObjectId = getOpenApiObjectIdentifier(parameter);
  const existing = context.transformed.parameters.get(openApiObjectId);
  if (existing) return existing;

  const ref = parameter.$ref ? transformParameter(context, parameter.$ref) : undefined;
  const id = context.idGenerator.generateId('parameter');
  const p: ApiParameter = {
    $src: {
      ...parameter.$src,
      component: parameter,
    },
    $ref: ref,
    id: id,
    name: parameter.name ?? id,
    target: parameter.in as ApiParameterTarget,
    description: parameter.description,
    required: parameter.required ?? false,
    deprecated: parameter.deprecated ?? false,
    allowEmptyValue: parameter.allowEmptyValue,
    style: parameter.style,
    explode: parameter.explode,
    allowReserved: parameter.allowReserved,
    schema: parameter.schema ? transformSchema(context, parameter.schema) : undefined,
  };

  context.transformed.parameters.set(openApiObjectId, p);
  return p;
}

function transformRequestBody(
  context: OpenApiTransformerContext,
  requestBody: Deref<OpenApiRequestBody>,
): ApiRequestBody {
  const openApiObjectId = getOpenApiObjectIdentifier(requestBody);
  const existing = context.transformed.requestBodies.get(openApiObjectId);
  if (existing) return existing;

  const ref = requestBody.$ref ? transformRequestBody(context, requestBody.$ref) : undefined;
  const rb: ApiRequestBody = {
    $src: {
      ...requestBody.$src,
      component: requestBody,
    },
    $ref: ref,
    id: context.idGenerator.generateId('requestBody'),
    description: requestBody.description,
    required: requestBody.required ?? false,
    content: transformContent(context, requestBody.content),
  };

  context.transformed.requestBodies.set(openApiObjectId, rb);
  return rb;
}

function transformResponses(
  context: OpenApiTransformerContext,
  responses?: Record<string, Deref<OpenApiResponse>>,
): ApiResponse[] {
  if (!responses) return [];
  const result: ApiResponse[] = [];
  for (const status of Object.keys(responses)) {
    if (!isOpenApiObjectProperty(status)) continue;
    result.push(transformResponse(context, responses[status], status));
  }
  return result;
}

function transformResponse(
  context: OpenApiTransformerContext,
  response: Deref<OpenApiResponse>,
  status: string,
): ApiResponse {
  const openApiObjectId = getOpenApiObjectIdentifier(response);
  const existing = context.transformed.responses.get(openApiObjectId);
  if (existing) return existing;

  const ref = response.$ref ? transformResponse(context, response.$ref, status) : undefined;
  const r: ApiResponse = {
    $src: {
      ...response.$src,
      component: response,
    },
    $ref: ref,
    id: context.idGenerator.generateId('response'),
    statusCode: Number(status) || undefined,
    description: response.description,
    headers: transformHeaders(context, response.headers),
    contentOptions: transformContent(context, response.content),
  };

  context.transformed.responses.set(openApiObjectId, r);
  return r;
}

function transformContent(
  context: OpenApiTransformerContext,
  content?: Record<string, Deref<OpenApiMediaType>>,
): ApiContent[] {
  if (!content) return [];
  const result: ApiContent[] = [];
  for (const media of Object.keys(content)) {
    if (!isOpenApiObjectProperty(media)) continue;
    result.push(transformMediaType(context, content[media], media));
  }
  return result;
}

function transformMediaType(
  context: OpenApiTransformerContext,
  mediaType: Deref<OpenApiMediaType>,
  media: string,
): ApiContent {
  const openApiObjectId = getOpenApiObjectIdentifier(mediaType);
  const existing = context.transformed.content.get(openApiObjectId);
  if (existing) return existing;

  const ref = mediaType.$ref ? transformMediaType(context, mediaType.$ref, media) : undefined;
  const mt: ApiContent = {
    $src: {
      ...mediaType.$src,
      component: mediaType,
    },
    $ref: ref,
    id: context.idGenerator.generateId('content'),
    type: media,
    schema: mediaType.schema ? transformSchema(context, mediaType.schema) : undefined,
  };

  context.transformed.content.set(openApiObjectId, mt);
  return mt;
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

function isSchema(obj: Record<string, unknown>): obj is Deref<OpenApiSchema> {
  return obj && typeof obj === 'object' && obj['type'] !== undefined;
}

function transformHeaders(
  context: OpenApiTransformerContext,
  headers?: Record<string, Deref<OpenApiHeader> | Deref<OpenApiSchema>>,
): ApiHeader[] {
  if (!headers) return [];
  const result: ApiHeader[] = [];
  for (const name of Object.keys(headers)) {
    if (!isOpenApiObjectProperty(name)) continue;
    result.push(transformHeader(context, headers[name], name));
  }
  return result;
}

function transformHeader(
  context: OpenApiTransformerContext,
  header: Deref<OpenApiHeader> | Deref<OpenApiSchema>,
  name: string,
): ApiHeader {
  const openApiObjectId = getOpenApiObjectIdentifier(header);
  const existing = context.transformed.headers.get(openApiObjectId);
  if (existing) return existing;

  let h: ApiHeader;
  const ref = header.$ref ? transformHeader(context, header.$ref, name) : undefined;
  const id = context.idGenerator.generateId('header');
  if (isSchema(header)) {
    h = {
      // deno-lint-ignore no-explicit-any
      $src: Object.assign({}, header.$src, { component: header }) as any,
      $ref: ref as ApiHeader['$ref'],
      id,
      name,
      description: header.description,
      required: false,
      deprecated: false,
      allowEmptyValue: undefined,
      style: undefined,
      explode: undefined,
      allowReserved: undefined,
      schema: transformSchema(context, header),
    };
  } else {
    h = {
      // deno-lint-ignore no-explicit-any
      $src: Object.assign({}, header.$src, { component: header }) as any,
      $ref: ref as ApiHeader['$ref'],
      id,
      name,
      description: header.description,
      required: header.required ?? false,
      deprecated: header.deprecated ?? false,
      allowEmptyValue: header.allowEmptyValue,
      style: header.style,
      explode: header.explode,
      allowReserved: header.allowReserved,
      schema: header.schema ? transformSchema(context, header.schema) : undefined,
    };
  }

  context.transformed.headers.set(openApiObjectId, h);
  return h;
}
