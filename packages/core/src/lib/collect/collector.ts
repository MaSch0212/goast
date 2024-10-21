import { collect, collectRecord } from './helpers.ts';
import type { OpenApiCollectorData } from './types.ts';
import type {
  Deref,
  OpenApiDocument,
  OpenApiHeader,
  OpenApiMediaType,
  OpenApiParameter,
  OpenApiPathItem,
  OpenApiRequestBody,
  OpenApiResponse,
  OpenApiSchema,
} from '../parse/index.ts';

type Collect<T> = Deref<T> | Deref<T>[] | undefined;

export function collectOpenApi(apis: Deref<OpenApiDocument>[]): OpenApiCollectorData {
  const data: OpenApiCollectorData = {
    documents: [],
    schemas: new Map(),
    endpoints: new Map(),
  };

  collectDocument(data, apis);

  return data;
}

const jsonSchemaProperties = ['$id', 'allOf', 'anyOf', 'oneOf', 'enum', 'not', 'properties', 'title', 'type'];

function collectDocument(data: OpenApiCollectorData, documents: Collect<OpenApiDocument>) {
  collect(data, documents, (data, document) => {
    data.documents.push(document);
    collectPaths(data, document.paths);
    collectRecord<Deref<OpenApiSchema>>(data, document.components?.schemas, collectSchema);
    collectRecord<Deref<OpenApiSchema>>(data, document.definitions, collectSchema);
    collectRecord<Deref<OpenApiParameter>>(data, document.components?.parameters, collectParameter);
    collectRecord<Deref<OpenApiParameter>>(data, document.parameters, collectParameter);
    collectRecord<Deref<OpenApiRequestBody>>(data, document.components?.requestBodies, collectRequestBody);
    collectRecord<Deref<OpenApiResponse>>(data, document.components?.responses, collectResponse);
    collectRecord<Deref<OpenApiResponse>>(data, document.responses, collectResponse);
    collectRecord<Deref<OpenApiHeader>>(data, document.components?.headers, collectHeader);

    if (Object.keys(document).some((key) => jsonSchemaProperties.includes(key))) {
      collectSchema(data, document as Deref<OpenApiSchema>);
    }
  });
}

function collectPaths(data: OpenApiCollectorData, paths: Collect<Record<string, OpenApiPathItem>>) {
  collect(data, paths, (data, path) => {
    collectRecord<Deref<OpenApiPathItem>>(data, path, collectPathItem);
  });
}

function collectPathItem(data: OpenApiCollectorData, pathItems: Collect<OpenApiPathItem>, path: string) {
  collect(data, pathItems, (data, pathItem) => {
    collectParameter(data, pathItem.parameters);
    for (const m of ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const) {
      const operation = pathItem[m];
      if (!operation) continue;
      const key = `${operation.$src.file}#${operation.$src.path}`;
      if (data.endpoints.has(key)) continue;
      data.endpoints.set(key, {
        path,
        method: m,
        pathItem,
        operation,
      });
      collectParameter(data, operation.parameters);
      collectRequestBody(data, operation.requestBody);
      collectRecord<Deref<OpenApiResponse>>(data, operation.responses, collectResponse);
    }
  });
}

function collectSchema(data: OpenApiCollectorData, schemas: Collect<OpenApiSchema>) {
  collect(data, schemas, (data, schema) => {
    const key = `${schema.$src.file}#${schema.$src.path}`;
    if (data.schemas.has(key)) return;
    data.schemas.set(key, schema);
    collectSchema(data, schema.allOf);
    collectSchema(data, schema.anyOf);
    collectSchema(data, schema.oneOf);
    collectSchema(data, schema.items);
    collectSchema(data, schema.not);
    collectRecord<Deref<OpenApiSchema>>(data, schema.properties, collectSchema);
    collectRecord<Deref<OpenApiSchema>>(data, schema.patternProperties, collectSchema);
    collectRecord<Deref<OpenApiSchema>>(data, schema.dependencies, collectSchema);
    collectRecord<Deref<OpenApiSchema>>(data, schema.definitions, collectSchema);
    if (typeof schema.additionalProperties === 'object') {
      collectSchema(data, schema.additionalProperties);
    }
    if (typeof schema.additionalItems === 'object') {
      collectSchema(data, schema.additionalItems);
    }
    if (typeof schema.discriminator === 'object') {
      collectRecord<Deref<OpenApiSchema>>(data, schema.discriminator?.mapping, collectSchema);
    }
  });
}

function collectParameter(data: OpenApiCollectorData, parameters: Collect<OpenApiParameter>) {
  collect(data, parameters, (data, parameter) => {
    collectSchema(data, parameter.schema);
  });
}

function collectMediaType(data: OpenApiCollectorData, mediaTypes: Collect<OpenApiMediaType>) {
  collect(data, mediaTypes, (data, mediaType) => {
    collectSchema(data, mediaType.schema);
  });
}

function collectRequestBody(data: OpenApiCollectorData, requestBody: Collect<OpenApiRequestBody>) {
  collect(data, requestBody, (data, requestBody) => {
    collectRecord<Deref<OpenApiMediaType>>(data, requestBody.content, collectMediaType);
  });
}

function isSchema(obj: Record<string, unknown>): obj is Deref<OpenApiSchema> {
  return obj && typeof obj === 'object' && obj['type'] !== undefined;
}

function collectResponse(data: OpenApiCollectorData, responses: Collect<OpenApiResponse>) {
  collect(data, responses, (data, responses) => {
    collectRecord<Deref<OpenApiMediaType>>(data, responses.content, collectMediaType);
    collect(data, responses.headers, (data, header) => {
      if (isSchema(header)) {
        collectSchema(data, header);
      } else {
        collectHeader(data, header);
      }
    });
  });
}

function collectHeader(data: OpenApiCollectorData, headers: Collect<OpenApiHeader>) {
  collect(data, headers, (data, headers) => {
    collectSchema(data, headers.schema);
  });
}
