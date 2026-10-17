import {
  type ApiEndpoint,
  type ApiParameter,
  type ApiResponse,
  type ApiSchema,
  defaultOpenApiGeneratorConfig,
} from '@goast/core';

import { cs } from '../../../ast/index.ts';
import { CSharpFileBuilder } from '../../../file-builder.ts';
import { defaultCSharpControllersGeneratorConfig } from '../controllers/models.ts';
import type { CSharpServerContext } from './server-config.ts';

/** The configuration server generator tests run with. A fixed newLine keeps the expectations host-independent. */
export const testConfig = {
  ...defaultOpenApiGeneratorConfig,
  ...defaultCSharpControllersGeneratorConfig,
  newLine: '\n',
};

const modelsNamespace = 'OpenApi.Generated.Models';

let schemaId = 0;

/** A schema of the given kind. A type is registered for it in the models output of the context by `createContext`. */
export function createSchema(kind: string, overrides: Record<string, unknown> = {}): ApiSchema {
  schemaId++;
  return {
    id: `schema-${schemaId}`,
    name: `schema${schemaId}`,
    kind,
    enum: undefined,
    ...overrides,
  } as unknown as ApiSchema;
}

/** A context whose models output maps every given schema to a type. */
export function createContext(
  types: Map<ApiSchema, cs.Reference<never>> = new Map(),
  config: Partial<typeof testConfig> = {},
): CSharpServerContext {
  const models: Record<string, { type: cs.Reference<never> }> = {};
  for (const [schema, type] of types) models[schema.id] = { type };
  return { config: { ...testConfig, ...config }, input: { csharp: { models } } } as unknown as CSharpServerContext;
}

/** A declared model type (`Pet`). */
export const modelType = (name: string, nullable = false) =>
  cs.reference(name, modelsNamespace, { nullable }) as cs.Reference<never>;

export function createHeader(name: string, schema: ApiSchema, overrides: Record<string, unknown> = {}) {
  return { name, schema, required: false, description: undefined, ...overrides };
}

export function createResponse(
  statusKey: string,
  options: {
    description?: string;
    content?: { type: string; schema?: ApiSchema }[];
    headers?: ReturnType<typeof createHeader>[];
  } = {},
): ApiResponse {
  return {
    statusKey,
    statusCode: Number(statusKey) || undefined,
    description: options.description,
    headers: options.headers ?? [],
    contentOptions: (options.content ?? []).map((x) => ({ type: x.type, schema: x.schema })),
  } as unknown as ApiResponse;
}

export function createParameter(
  name: string,
  target: ApiParameter['target'],
  schema: ApiSchema | undefined,
  overrides: Record<string, unknown> = {},
): ApiParameter {
  return { id: `${target}-${name}`, name, target, schema, required: false, ...overrides } as unknown as ApiParameter;
}

export function createEndpoint(name: string, overrides: Record<string, unknown> = {}): ApiEndpoint {
  return {
    id: `endpoint-${name}`,
    name,
    method: 'get',
    path: `/${name}`,
    parameters: [],
    responses: [],
    requestBody: undefined,
    tags: [],
    custom: {},
    ...overrides,
  } as unknown as ApiEndpoint;
}

/** Renders AST nodes as the body of a file in the controllers namespace. */
export function render(...nodes: unknown[]): string {
  const builder = new CSharpFileBuilder('OpenApi.Generated.Controllers', testConfig as never);
  builder.append(nodes as never);
  return builder.toString(false);
}
