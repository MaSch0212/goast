import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { Dref } from '../parser.js';

type ContentObject = {
  [media: string]: OpenAPIV3.MediaTypeObject;
};

export function isOpenApiV3(api: Dref<OpenAPI.Document>): api is Dref<OpenAPIV3.Document> {
  return (api as any)['openapi'].startsWith('3.0');
}

export type OpenApiV3Data = {
  schemas: OpenAPIV3.SchemaObject[];
};

export function collectOpenApiV3(api: Dref<OpenAPIV3.Document>): OpenApiV3Data {
  const data: OpenApiV3Data = {
    schemas: [],
  };

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

  return data;
}

function collect<T>(
  data: OpenApiV3Data,
  obj: T | T[],
  func: (data: OpenApiV3Data, obj: NonNullable<T>) => void
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

function collectSchema(
  data: OpenApiV3Data,
  schema?: Dref<OpenAPIV3.SchemaObject> | Dref<OpenAPIV3.SchemaObject>[]
) {
  collect(data, schema, (data, schema) => {
    data.schemas.push(schema);
    // TODO: collect all referenced schemas
  });
}

function collectParameter(
  data: OpenApiV3Data,
  parameter?: Dref<OpenAPIV3.ParameterObject> | Dref<OpenAPIV3.ParameterObject>[]
) {
  collect(data, parameter, (data, parameter) => {
    collectSchema(data, parameter.schema);
  });
}

function collectMediaType(
  data: OpenApiV3Data,
  mediaType?: Dref<OpenAPIV3.MediaTypeObject> | Dref<OpenAPIV3.MediaTypeObject>[]
) {
  collect(data, mediaType, (data, mediaType) => {
    collectSchema(data, mediaType.schema);
  });
}

function collectContent(
  data: OpenApiV3Data,
  content?: Dref<ContentObject> | Dref<ContentObject>[]
) {
  collect(data, content, (data, content) => {
    for (const c in content) {
      collectMediaType(data, content[c]);
    }
  });
}

function collectRequestBody(
  data: OpenApiV3Data,
  requestBody?: Dref<OpenAPIV3.RequestBodyObject> | Dref<OpenAPIV3.RequestBodyObject>[]
) {
  collect(data, requestBody, (data, requestBody) => {
    collectContent(data, requestBody.content);
  });
}

function collectResponse(
  data: OpenApiV3Data,
  response?: Dref<OpenAPIV3.ResponseObject> | Dref<OpenAPIV3.ResponseObject>[]
) {
  collect(data, response, (data, response) => {
    collectContent(data, response.content);
  });
}

function collectHeader(
  data: OpenApiV3Data,
  header?: Dref<OpenAPIV3.HeaderObject> | Dref<OpenAPIV3.HeaderObject>[]
) {
  collect(data, header, (data, header) => {
    collectSchema(data, header.schema);
  });
}
