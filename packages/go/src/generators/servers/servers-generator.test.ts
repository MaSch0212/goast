import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { OpenApiGenerator } from '@goast/core';

import { GoModelsGenerator } from '../models/models-generator.ts';
import { GoServersGenerator } from './servers-generator.ts';
import type { GoServersGeneratorConfig } from './models.ts';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'goast-go-servers-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const pet = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string' }, name: { type: 'string' } },
};

/** Generates the models and servers for the API description and returns the generated files by name. */
async function generate(spec: Record<string, unknown>, config: Partial<GoServersGeneratorConfig> = {}) {
  const specFile = join(dir, 'spec.json');
  await writeFile(specFile, JSON.stringify({ openapi: '3.0.3', info: { title: 'Test', version: '1' }, ...spec }));
  const outputDir = join(dir, 'out');
  const output = await new OpenApiGenerator({ outputDir, newLine: '\n' })
    .useType(GoModelsGenerator)
    .useType(GoServersGenerator, config)
    .parseAndGenerate(specFile);

  const files: Record<string, string> = {};
  for (const name of await readdir(join(outputDir, 'api'))) {
    files[name] = await readFile(join(outputDir, 'api', name), 'utf8');
  }
  return { output, files };
}

const petsApi = {
  servers: [{ url: 'https://example.com/v1' }],
  paths: {
    '/pets/{id}': {
      get: {
        tags: ['Pets'],
        operationId: 'getPet',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'fields', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
          { name: 'limit', in: 'query', schema: { type: 'integer', format: 'int32', default: 10 } },
        ],
        responses: {
          '200': {
            description: 'The pet.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
          },
          '404': { description: 'Not found.' },
        },
      },
    },
    '/pets': {
      post: {
        tags: ['Pets'],
        operationId: 'createPet',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
        },
        responses: { '201': { description: 'Created.' } },
      },
    },
    '/files/{name}.json': {
      get: {
        tags: ['Files'],
        operationId: 'getFile',
        parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'The file.', content: { 'text/plain': { schema: { type: 'string' } } } } },
      },
    },
  },
  components: { schemas: { Pet: pet } },
};

describe('GoServersGenerator', () => {
  it('generates a service interface and a function registering its routes', async () => {
    const { files } = await generate(petsApi);

    expect(files['pets_service.go']).toContain(
      [
        'type PetsService interface {',
        '\tGetPet(ctx context.Context, req GetPetRequest) (GetPetResponse, error)',
        '\tCreatePet(ctx context.Context, req CreatePetRequest) (CreatePetResponse, error)',
        '}',
      ].join('\n'),
    );
    expect(files['pets_service.go']).toContain(
      'func RegisterPetsRoutes(mux *http.ServeMux, svc PetsService, opts ...ServerOption) {\n' +
        '\to := newServerOptions("/v1", opts)\n' +
        '\to.handle(mux, "GET", "/pets/{id}", serve(o, decodeGetPetRequest, svc.GetPet, GetPetResponse.writeGetPetResponse))\n',
    );
  });

  it('generates a request with typed parameters', async () => {
    const { files } = await generate(petsApi);

    expect(files['pets_service.go']).toContain(
      ['type GetPetRequest struct {', '\tID     string', '\tFields []string', '\tLimit  int32'].join('\n'),
    );
    expect(files['pets_service.go']).toContain('valueOrDefault("query", "limit", ');
    expect(files['pets_service.go']).toContain(', parseInt[int32], 10)');
  });

  it('generates a response type per status', async () => {
    const { files } = await generate(petsApi);

    expect(files['pets_service.go']).toContain(
      'type GetPetResponse interface {\n\twriteGetPetResponse(w http.ResponseWriter) error\n}',
    );
    expect(files['pets_service.go']).toContain('type GetPet200Response struct {\n\tBody Pet\n');
    expect(files['pets_service.go']).toContain('type GetPet404Response struct {\n');
  });

  it('decodes a required JSON body', async () => {
    const { files } = await generate(petsApi);

    expect(files['pets_service.go']).toContain('return req, missingBody()');
    expect(files['pets_service.go']).toContain('decodeJSONBody[Pet](r)');
  });

  it('matches a path parameter that is only part of a segment with a regular expression', async () => {
    const { files } = await generate(petsApi);

    expect(files['files_service.go']).toContain('o.handle(mux, "GET", "/files/{segment2}", ');
    expect(files['files_service.go']).toContain('var getFileSegment2 = regexp.MustCompile("^(.*?)\\\\.json$")');
    expect(files['files_service.go']).toContain('pathSegmentParamValues(r, "segment2", getFileSegment2, 1, false)');
  });

  it('writes the runtime once for all services', async () => {
    const { files } = await generate(petsApi);

    expect(Object.keys(files).sort()).toEqual(['files_service.go', 'pet.go', 'pets_service.go', 'server_runtime.go']);
    expect(files['server_runtime.go']).toContain('type ServerOptions struct {');
  });

  it('names the request and response types differently when a schema has their name', async () => {
    const { files } = await generate({
      ...petsApi,
      components: {
        schemas: {
          Pet: pet,
          CreatePetRequest: { type: 'object', properties: { name: { type: 'string' } } },
          GetPetResponse: { type: 'object', properties: { pet: { $ref: '#/components/schemas/Pet' } } },
        },
      },
    });

    expect(files['pets_service.go']).toContain(
      'CreatePet(ctx context.Context, req CreatePetRequestObject) (CreatePetResponse, error)',
    );
    expect(files['pets_service.go']).toContain(
      'GetPet(ctx context.Context, req GetPetRequest) (GetPetResponseObject, error)',
    );
  });

  it('renames a runtime identifier that a schema declares already', async () => {
    const { files } = await generate({
      ...petsApi,
      components: { schemas: { Pet: pet, ServerOption: { type: 'object', properties: { name: { type: 'string' } } } } },
    });

    expect(files['server_option.go']).toContain('type ServerOption struct {');
    expect(files['server_runtime.go']).toContain('type ServerOption2 func(*ServerOptions)');
    expect(files['pets_service.go']).toContain('opts ...ServerOption2)');
  });

  it('uses the configured base path', async () => {
    const { files } = await generate(petsApi, { basePath: '/api' });

    expect(files['pets_service.go']).toContain('o := newServerOptions("/api", opts)');
  });

  it('returns the service interface and the register function of every service', async () => {
    const { output } = await generate(petsApi);

    expect(Object.values(output.go.servers).map((x) => [x.serviceInterface.name, x.registerFunction.name])).toEqual(
      expect.arrayContaining([
        ['PetsService', 'RegisterPetsRoutes'],
        ['FilesService', 'RegisterFilesRoutes'],
      ]),
    );
  });
});
