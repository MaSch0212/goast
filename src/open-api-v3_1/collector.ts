import { OpenAPI, OpenAPIV3_1 } from 'openapi-types';
import { collect } from '../collector-helpers.js';
import { Deref, OpenApiCollectorData } from '../types.js';
import { ContentObject } from './types.js';

export function isOpenApiV3_1(api: Deref<OpenAPI.Document>): api is Deref<OpenAPIV3_1.Document> {
  return (api as any)['openapi'].startsWith('3.1');
}

export function collectOpenApiV3_1(api: Deref<OpenAPIV3_1.Document>, data: OpenApiCollectorData) {
  data.documents.push({ version: '3.1', document: api });

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

function collectPaths(
  data: OpenApiCollectorData,
  paths?: Deref<OpenAPIV3_1.PathsObject> | Deref<OpenAPIV3_1.PathsObject>[]
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
  data: OpenApiCollectorData,
  path: string,
  pathItem?: Deref<OpenAPIV3_1.PathItemObject>
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
        version: '3.1',
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
  data: OpenApiCollectorData,
  schema?: Deref<OpenAPIV3_1.SchemaObject> | Deref<OpenAPIV3_1.SchemaObject>[]
) {
  collect(data, schema, (data, schema) => {
    data.schemas.set(`${schema.$src.file}#${schema.$src.path}`, { version: '3.1', schema });
    collectSchema(data, schema.allOf);
    collectSchema(data, schema.anyOf);
    collectSchema(data, schema.oneOf);
    collectSchema(data, (schema as Deref<OpenAPIV3_1.ArraySchemaObject>).items);
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
  data: OpenApiCollectorData,
  parameter?: Deref<OpenAPIV3_1.ParameterObject> | Deref<OpenAPIV3_1.ParameterObject>[]
) {
  collect(data, parameter, (data, parameter) => {
    collectSchema(data, parameter.schema);
  });
}

function collectMediaType(
  data: OpenApiCollectorData,
  mediaType?: Deref<OpenAPIV3_1.MediaTypeObject> | Deref<OpenAPIV3_1.MediaTypeObject>[]
) {
  collect(data, mediaType, (data, mediaType) => {
    collectSchema(data, mediaType.schema);
  });
}

function collectContent(
  data: OpenApiCollectorData,
  content?: Deref<ContentObject> | Deref<ContentObject>[]
) {
  collect(data, content, (data, content) => {
    for (const c in content) {
      collectMediaType(data, content[c]);
    }
  });
}

function collectRequestBody(
  data: OpenApiCollectorData,
  requestBody?: Deref<OpenAPIV3_1.RequestBodyObject> | Deref<OpenAPIV3_1.RequestBodyObject>[]
) {
  collect(data, requestBody, (data, requestBody) => {
    collectContent(data, requestBody.content);
  });
}

function collectResponse(
  data: OpenApiCollectorData,
  response?: Deref<OpenAPIV3_1.ResponseObject> | Deref<OpenAPIV3_1.ResponseObject>[]
) {
  collect(data, response, (data, response) => {
    collectContent(data, response.content);
  });
}

function collectHeader(
  data: OpenApiCollectorData,
  header?: Deref<OpenAPIV3_1.HeaderObject> | Deref<OpenAPIV3_1.HeaderObject>[]
) {
  collect(data, header, (data, header) => {
    collectSchema(data, header.schema);
  });
}
