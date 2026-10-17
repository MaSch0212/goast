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
});
