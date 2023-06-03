import {
  ApiSchema,
  ApiSchemaExtensions,
  ApiSchemaKind,
  ApiPath,
  ApiData,
  ApiService,
  ApiParameter,
  ApiRequestBody,
  ApiResponse,
  ApiContent,
  ApiHeader,
} from './api-types';
import { IdGenerator } from './helpers';
import { OpenApiCollectorData } from '../collect/types';
import { ArrayItem } from '../utils/type.utils';

export type IncompleteApiSchema = Omit<ApiSchema, Exclude<keyof ApiSchemaExtensions<ApiSchemaKind>, 'kind'>>;
export type OpenApiTransformerContext = {
  idGenerator: IdGenerator;
  input: OpenApiCollectorData;
  incompleteSchemas: Map<string, IncompleteApiSchema>;
  paths: Map<string, ApiPath>;

  transformed: {
    services: Map<string, ApiService>;
    paths: Map<string, ApiPath>;
    parameters: Map<string, ApiParameter>;
    requestBodies: Map<string, ApiRequestBody>;
    responses: Map<string, ApiResponse>;
    content: Map<string, ApiContent>;
    headers: Map<string, ApiHeader>;
    schemas: Map<string, ApiSchema>;
  };
} & { [K in keyof ApiData]: Map<string, ArrayItem<ApiData[K]>> };
