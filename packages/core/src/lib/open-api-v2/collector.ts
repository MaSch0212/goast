import { IJsonSchema, OpenAPI, OpenAPIV2 } from 'openapi-types';
import { collect } from '../collect/helpers.js';
import { OpenApiCollectorData } from '../collect/types.js';
import { Deref } from '../types.js';

export function isOpenApiV2(api: Deref<OpenAPI.Document>): api is Deref<OpenAPIV2.Document> {
  return (api as any)['openapi'].startsWith('2.0');
}

export function collectOpenApiV2(api: Deref<OpenAPIV2.Document>, data: OpenApiCollectorData) {
  data.documents.push({ version: '2.0', document: api });

  collectPaths(data, api.paths);
}

function collectPaths(
  data: OpenApiCollectorData,
  paths?: Deref<OpenAPIV2.PathsObject> | Deref<OpenAPIV2.PathsObject>[]
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
  pathItem?: Deref<OpenAPIV2.PathItemObject>
) {
  collect(data, pathItem, (data, pathItem) => {
    for (const m of ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'] as const) {
      const operation = pathItem[m];
      if (!operation) continue;
      data.endpoints.set(`${operation.$src.file}#${operation.$src.path}`, {
        version: '3.0',
        path,
        method: m,
        pathItem: pathItem as any,
        operation: operation as any,
      });
      collectParameter(data, pathItem.parameters);
      collectParameter(data, operation.parameters);
      for (const r in operation.responses) {
        if (r === '$src') continue;
        collectResponse(data, operation.responses[r]);
      }
    }
  });
}

function collectSchema(
  data: OpenApiCollectorData,
  schema?:
    | Deref<OpenAPIV2.Schema | IJsonSchema | OpenAPIV2.ItemsObject>
    | Deref<OpenAPIV2.Schema | IJsonSchema | OpenAPIV2.ItemsObject>[]
) {
  collect(data, schema, (data, schema) => {
    data.schemas.set(`${schema.$src.file}#${schema.$src.path}`, { version: '2.0', schema });
    const realSchema = schema as Deref<IJsonSchema>;
    collectSchema(data, realSchema.allOf);
    collectSchema(data, realSchema.anyOf);
    collectSchema(data, realSchema.oneOf);
    collectSchema(data, schema.items);
    if (typeof realSchema.additionalProperties === 'object') {
      collectSchema(data, realSchema.additionalProperties);
    }
    collectSchema(data, realSchema.not);
    if (realSchema.properties) {
      for (const p in realSchema.properties) {
        if (p === '$src') continue;
        collectSchema(data, realSchema.properties[p]);
      }
    }
  });
}

function collectParameter(
  data: OpenApiCollectorData,
  parameter?: Deref<OpenAPIV2.Parameter> | Deref<OpenAPIV2.Parameter>[]
) {
  collect(data, parameter, (data, parameter) => {
    collectSchema(data, parameter.schema);
  });
}

function collectResponse(
  data: OpenApiCollectorData,
  response?: Deref<OpenAPIV2.ResponseObject> | Deref<OpenAPIV2.ResponseObject>[]
) {
  collect(data, response, (data, response) => {
    collectSchema(data, response.schema);
    for (const r in response.headers) {
      if (r === '$src') continue;
      collectSchema(data, response.headers[r]);
    }
  });
}
