import type {
  OpenApiDocument,
  OpenApiHttpMethod,
  OpenApiOperation,
  OpenApiPathItem,
  OpenApiSchema,
} from '../parse/openapi-types.ts';
import type { Deref } from '../parse/types.ts';

/**
 * Information about an endpoint that was collected from an OpenAPI document.
 */
export type OpenApiCollectorEndpointInfo = {
  /**
   * The path template of the endpoint, such as `/pets/{id}`.
   */
  path: string;
  /**
   * The HTTP method of the operation.
   */
  method: OpenApiHttpMethod;
  /**
   * The path item that contains the operation.
   */
  pathItem: Deref<OpenApiPathItem>;
  /**
   * The operation that describes the endpoint.
   */
  operation: Deref<OpenApiOperation>;
};

/**
 * The data that is collected from the OpenAPI documents.
 * @see collectOpenApi
 */
export type OpenApiCollectorData = {
  /**
   * The collected OpenAPI documents.
   */
  documents: Deref<OpenApiDocument>[];
  /**
   * The collected schemas, keyed by their source location (`file#path`).
   */
  schemas: Map<string, Deref<OpenApiSchema>>;
  /**
   * The collected endpoints, keyed by the source location (`file#path`) of their operation.
   */
  endpoints: Map<string, OpenApiCollectorEndpointInfo>;
};
