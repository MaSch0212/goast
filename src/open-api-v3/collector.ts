import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { Deref } from '../types.js';
import { OpenApiV3CollectorData, ContentObject } from './types.js';

export function isOpenApiV3(api: Deref<OpenAPI.Document>): api is Deref<OpenAPIV3.Document> {
  return (api as any)['openapi'].startsWith('3.0');
}

export function collectOpenApiV3(apis: Deref<OpenAPIV3.Document>[]): OpenApiV3CollectorData {
  const data: OpenApiV3CollectorData = {
    documents: apis,
    schemas: new Map(),
    endpoints: new Map(),
  };

  for (const api of apis) {
    collectPaths(data, api.paths);
    if (api.components?.schemas) {
      for (const s in api.components.schemas) {
        if (s === '$src') continue;
        collectSchema(data, api.components.schemas[s]);
      }
    }
    if (api.components?.parameters) {
      for (const p in api.components.parameters) {
        if (p === '$src') continue;
        collectParameter(data, api.components.parameters[p]);
      }
    }
    if (api.components?.requestBodies) {
      for (const r in api.components.requestBodies) {
        if (r === '$src') continue;
        collectRequestBody(data, api.components.requestBodies[r]);
      }
    }
    if (api.components?.responses) {
      for (const r in api.components.responses) {
        if (r === '$src') continue;
        collectResponse(data, api.components.responses[r]);
      }
    }
    if (api.components?.headers) {
      for (const h in api.components.headers) {
        if (h === '$src') continue;
        collectHeader(data, api.components.headers[h]);
      }
    }
  }

  return data;
}

function collect<T>(
  data: OpenApiV3CollectorData,
  obj: T | T[],
  func: (data: OpenApiV3CollectorData, obj: NonNullable<T>) => void
) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    for (const o of obj) {
      if (!o) continue;
      func(data, o);
    }
  } else {
    func(data, obj);
  }
}

function collectPaths(
  data: OpenApiV3CollectorData,
  paths?: Deref<OpenAPIV3.PathsObject> | Deref<OpenAPIV3.PathsObject>[]
) {
  collect(data, paths, (data, paths) => {
    for (const p in paths) {
      if (p === '$src') continue;
      const path = paths[p];
      collectPathItem(data, p, path);
    }
  });
}

function collectPathItem(
  data: OpenApiV3CollectorData,
  path: string,
  pathItem?: Deref<OpenAPIV3.PathItemObject>
) {
  collect(data, pathItem, (data, pathItem) => {
    for (const m of [
      'get',
      'put',
      'post',
      'delete',
      'options',
      'head',
      'patch',
      'trace',
    ] as const) {
      const operation = pathItem[m];
      if (!operation) continue;
      data.endpoints.set(`${operation.$src.file}#${operation.$src.path}`, {
        path,
        method: m,
        pathItem,
        operation,
      });
      collectParameter(data, pathItem.parameters);
      collectParameter(data, operation.parameters);
      collectRequestBody(data, operation.requestBody);
      for (const r in operation.responses) {
        if (r === '$src') continue;
        collectResponse(data, operation.responses[r]);
      }
    }
  });
}

function collectSchema(
  data: OpenApiV3CollectorData,
  schema?: Deref<OpenAPIV3.SchemaObject> | Deref<OpenAPIV3.SchemaObject>[]
) {
  collect(data, schema, (data, schema) => {
    data.schemas.set(`${schema.$src.file}#${schema.$src.path}`, schema);
    collectSchema(data, schema.allOf);
    collectSchema(data, schema.anyOf);
    collectSchema(data, schema.oneOf);
    collectSchema(data, (schema as Deref<OpenAPIV3.ArraySchemaObject>).items);
    if (typeof schema.additionalProperties === 'object') {
      collectSchema(data, schema.additionalProperties);
    }
    collectSchema(data, schema.not);
    if (schema.properties) {
      for (const p in schema.properties) {
        if (p === '$src') continue;
        collectSchema(data, schema.properties[p]);
      }
    }
  });
}

function collectParameter(
  data: OpenApiV3CollectorData,
  parameter?: Deref<OpenAPIV3.ParameterObject> | Deref<OpenAPIV3.ParameterObject>[]
) {
  collect(data, parameter, (data, parameter) => {
    collectSchema(data, parameter.schema);
  });
}

function collectMediaType(
  data: OpenApiV3CollectorData,
  mediaType?: Deref<OpenAPIV3.MediaTypeObject> | Deref<OpenAPIV3.MediaTypeObject>[]
) {
  collect(data, mediaType, (data, mediaType) => {
    collectSchema(data, mediaType.schema);
  });
}

function collectContent(
  data: OpenApiV3CollectorData,
  content?: Deref<ContentObject> | Deref<ContentObject>[]
) {
  collect(data, content, (data, content) => {
    for (const c in content) {
      collectMediaType(data, content[c]);
    }
  });
}

function collectRequestBody(
  data: OpenApiV3CollectorData,
  requestBody?: Deref<OpenAPIV3.RequestBodyObject> | Deref<OpenAPIV3.RequestBodyObject>[]
) {
  collect(data, requestBody, (data, requestBody) => {
    collectContent(data, requestBody.content);
  });
}

function collectResponse(
  data: OpenApiV3CollectorData,
  response?: Deref<OpenAPIV3.ResponseObject> | Deref<OpenAPIV3.ResponseObject>[]
) {
  collect(data, response, (data, response) => {
    collectContent(data, response.content);
  });
}

function collectHeader(
  data: OpenApiV3CollectorData,
  header?: Deref<OpenAPIV3.HeaderObject> | Deref<OpenAPIV3.HeaderObject>[]
) {
  collect(data, header, (data, header) => {
    collectSchema(data, header.schema);
  });
}
