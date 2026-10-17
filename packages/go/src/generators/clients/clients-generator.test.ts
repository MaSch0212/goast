import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { OpenApiGenerator } from '@goast/core';

import { GoModelsGenerator } from '../models/models-generator.ts';
import { GoClientsGenerator } from './clients-generator.ts';
import type { GoClientsGeneratorConfig } from './models.ts';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'goast-go-clients-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const pet = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string' }, name: { type: 'string' } },
};

/** Generates the models and clients for the API description and returns the files of the clients package by name. */
async function generate(spec: Record<string, unknown>, config: Partial<GoClientsGeneratorConfig> = {}) {
  const specFile = join(dir, 'spec.json');
  await writeFile(specFile, JSON.stringify({ openapi: '3.0.3', info: { title: 'Test', version: '1' }, ...spec }));
  const outputDir = join(dir, 'out');
  const output = await new OpenApiGenerator({ outputDir, newLine: '\n' })
    .useType(GoModelsGenerator)
    .useType(GoClientsGenerator, config)
    .parseAndGenerate(specFile);

  const read = async (packagePath: string) => {
    const files: Record<string, string> = {};
    for (const name of await readdir(join(outputDir, packagePath))) {
      files[name] = await readFile(join(outputDir, packagePath, name), 'utf8');
    }
    return files;
  };
  return { output, files: await read(config.packagePath ?? 'client'), read };
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

describe('GoClientsGenerator', () => {
  describe('package', () => {
    it('writes one client file per tag and the runtime once', async () => {
      const { files, read } = await generate(petsApi);

      expect(Object.keys(files).sort()).toEqual(['client_runtime.go', 'files_client.go', 'pets_client.go']);
      expect(files['client_runtime.go']).toContain('type ClientOption func(*clientOptions)');
      expect(Object.keys(await read('api')).sort()).toEqual(['pet.go']);
    });

    it('renames a runtime identifier that a schema declares', async () => {
      const { files } = await generate(
        {
          ...petsApi,
          components: {
            schemas: { Pet: pet, ClientOption: { type: 'object', properties: { name: { type: 'string' } } } },
          },
        },
        { packagePath: 'api' },
      );

      expect(files['client_option.go']).toContain('type ClientOption struct {');
      expect(files['client_runtime.go']).toContain('type ClientOption2 func(*clientOptions)');
      expect(files['client_runtime.go']).toContain('func WithHTTPClient(c *http.Client) ClientOption2 {');
    });

    it('publishes the client and its constructor', async () => {
      const { output } = await generate(petsApi);

      expect(Object.values(output.go.clients).map((x) => [x.client.name, x.constructor.name])).toEqual(
        expect.arrayContaining([
          ['PetsClient', 'NewPetsClient'],
          ['FilesClient', 'NewFilesClient'],
        ]),
      );
    });
  });

  describe('client type', () => {
    it('imports the models from the api package', async () => {
      const { files } = await generate(petsApi);

      expect(files['pets_client.go']).toContain('"example.com/generated/api"');
      expect(files['pets_client.go']).toContain('api.Pet');
    });

    it('generates the client type and constructor', async () => {
      const { files } = await generate(petsApi);

      expect(files['pets_client.go']).toContain(
        [
          '// PetsClientDefaultBaseURL is the base URL a PetsClient uses when NewPetsClient gets none.',
          'const PetsClientDefaultBaseURL = "https://example.com/v1"',
          '',
          '// PetsClient calls the operations of the Pets API.',
          'type PetsClient struct {',
          '\tc *client',
          '}',
          '',
          '// NewPetsClient creates a client for the Pets API. baseURL is prepended to the path of every operation; when it is',
          '// empty, PetsClientDefaultBaseURL is used.',
          'func NewPetsClient(baseURL string, opts ...ClientOption) *PetsClient {',
          '\treturn &PetsClient{c: newClient(baseURL, PetsClientDefaultBaseURL, opts)}',
          '}',
        ].join('\n'),
      );
    });

    it('uses server variable defaults in the default base URL', async () => {
      const { files } = await generate({
        ...petsApi,
        servers: [{ url: 'https://{host}/{version}', variables: { host: { default: 'api.example.com' } } }],
      });

      expect(files['pets_client.go']).toContain('const PetsClientDefaultBaseURL = "https://api.example.com/{version}"');
    });

    it('uses the configured base URL', async () => {
      const { files } = await generate(petsApi, { baseUrl: 'http://localhost:8080' });

      expect(files['pets_client.go']).toContain('const PetsClientDefaultBaseURL = "http://localhost:8080"');
    });

    it('has an empty default base URL without a server', async () => {
      const { files } = await generate({ ...petsApi, servers: undefined });

      expect(files['pets_client.go']).toContain('const PetsClientDefaultBaseURL = ""');
    });
  });

  describe('method signatures', () => {
    it('passes path parameters positionally and optional query parameters in a params struct', async () => {
      const { files } = await generate(petsApi);

      expect(files['pets_client.go']).toContain(
        'func (c *PetsClient) GetPet(ctx context.Context, id string, params *GetPetParams, opts ...RequestOption) (*api.Pet, error) {',
      );
      expect(files['pets_client.go']).toContain('type GetPetParams struct {\n\tFields []string\n\tLimit  *int32\n}');
      expect(files['pets_client.go']).toContain(
        'func (c *PetsClient) CreatePet(ctx context.Context, body api.Pet, opts ...RequestOption) error {',
      );
    });

    it('passes required query, header and cookie parameters positionally', async () => {
      const { files } = await generate({
        paths: {
          '/pets': {
            get: {
              tags: ['Pets'],
              operationId: 'listPets',
              parameters: [
                { name: 'X-Tenant', in: 'header', required: true, schema: { type: 'string' } },
                { name: 'session', in: 'cookie', required: true, schema: { type: 'string' } },
                { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
                { name: 'limit', in: 'query', schema: { type: 'integer' } },
              ],
              responses: { '200': { description: 'ok' } },
            },
          },
        },
      });

      expect(files['pets_client.go']).toContain(
        'func (c *PetsClient) ListPets(ctx context.Context, xTenant string, session string, q string, params *ListPetsParams, opts ...RequestOption) error {',
      );
    });

    it('omits the params struct when there are no optional parameters', async () => {
      const { files } = await generate(petsApi);

      expect(files['files_client.go']).not.toContain('Params');
      expect(files['files_client.go']).toContain(
        'func (c *FilesClient) GetFile(ctx context.Context, name string, opts ...RequestOption) (string, error) {',
      );
    });

    it('does not let a parameter shadow what the method body uses', async () => {
      const { files } = await generate({
        paths: {
          '/x/{resp}': {
            get: {
              tags: ['Pets'],
              operationId: 'getX',
              parameters: [
                { name: 'resp', in: 'path', required: true, schema: { type: 'string' } },
                { name: 'url', in: 'query', required: true, schema: { type: 'string' } },
                { name: 'api', in: 'query', required: true, schema: { type: 'string' } },
              ],
              responses: {
                '200': {
                  description: 'ok',
                  content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } },
                },
              },
            },
          },
        },
        components: { schemas: { Pet: pet } },
      });

      expect(files['pets_client.go']).toContain('GetX(ctx context.Context, resp2 string, url2 string, api2 string,');
    });

    it('skips parameters the server cannot decode and lists them in the doc', async () => {
      const { files } = await generate({
        paths: {
          '/pets': {
            get: {
              tags: ['Pets'],
              operationId: 'listPets',
              parameters: [
                {
                  name: 'filter',
                  in: 'query',
                  schema: { type: 'object', properties: { name: { type: 'string' } } },
                },
              ],
              responses: { '200': { description: 'ok' } },
            },
          },
        },
      });

      expect(files['pets_client.go']).toContain(
        '// The query parameter "filter" is not sent, because its schema is not supported. Set it with a RequestOption.',
      );
      expect(files['pets_client.go']).toContain(
        'func (c *PetsClient) ListPets(ctx context.Context, opts ...RequestOption) error {',
      );
    });

    it('declares the structs of an operation with several tags once', async () => {
      const { files } = await generate({
        paths: {
          '/things': {
            get: {
              tags: ['Pets', 'Files'],
              operationId: 'listThings',
              parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
              responses: { '200': { description: 'ok' } },
            },
          },
        },
      });

      const declarations = Object.values(files).filter((x) => x.includes('type ListThingsParams struct'));
      expect(declarations).toHaveLength(1);
      expect(files['pets_client.go']).toContain('func (c *PetsClient) ListThings(');
      expect(files['files_client.go']).toContain('func (c *FilesClient) ListThings(');
    });
  });
});
