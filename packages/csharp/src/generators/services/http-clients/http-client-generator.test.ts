import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { OpenApiGenerator } from '@goast/core';

import { CSharpModelsGenerator } from '../../models/models-generator.ts';
import { DefaultCSharpHttpClientGenerator } from './http-client-generator.ts';
import { CSharpHttpClientsGenerator } from './http-clients-generator.ts';

class TestGenerator extends DefaultCSharpHttpClientGenerator {
  public contentKind(mediaType: string, schema?: Parameters<DefaultCSharpHttpClientGenerator['getContentKind']>[1]) {
    return this.getContentKind(mediaType, schema);
  }
}

const spec = `
openapi: 3.0.0
info: { title: Test, version: 1.0.0 }
servers:
  - url: https://api.example.com/v1
paths:
  /pets/{id}:
    get:
      operationId: getPetById
      summary: Gets a pet.
      tags: [Pets]
      parameters:
        - { name: id, in: path, required: true, schema: { type: string } }
        - { name: tags, in: query, style: form, explode: false, schema: { type: array, items: { type: string } } }
        - { name: filter, in: query, style: deepObject, explode: true, schema: { $ref: '#/components/schemas/Filter' } }
        - { name: q, in: query, allowReserved: true, schema: { type: string } }
        - { name: X-Trace, in: header, schema: { type: string } }
        - { name: Authorization, in: header, schema: { type: string } }
        - { name: session, in: cookie, schema: { type: string } }
      responses:
        '201':
          description: Created.
          content:
            application/json: { schema: { $ref: '#/components/schemas/Pet' } }
        '200':
          description: Existing.
          content:
            application/json: { schema: { $ref: '#/components/schemas/Pet' } }
        '404':
          description: Not found.
          content:
            application/json: { schema: { $ref: '#/components/schemas/Error' } }
        '418':
          description: A teapot.
        4XX:
          description: Client error.
          content:
            text/plain: { schema: { type: string } }
        default:
          description: Unexpected.
          content:
            application/json: { schema: { $ref: '#/components/schemas/Error' } }
  /animals:
    post:
      operationId: createAnimal
      tags: [Pets, Animals]
      requestBody:
        content:
          application/json: { schema: { $ref: '#/components/schemas/Dog' } }
      responses:
        '204': { description: Done. }
  /upload:
    post:
      operationId: upload
      tags: [Files]
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [file]
              properties:
                file: { type: string, format: binary }
                attachments: { type: array, items: { type: string, format: binary } }
                note: { type: string }
      responses:
        '200':
          description: The file.
          content:
            application/octet-stream: { schema: { type: string, format: binary } }
  /maybe:
    get:
      operationId: maybe
      tags: [Files]
      responses:
        '200':
          description: Maybe.
          content:
            application/json: { schema: { $ref: '#/components/schemas/Pet' } }
        '204': { description: Nothing. }
components:
  schemas:
    Pet:
      type: object
      required: [id]
      properties: { id: { type: string } }
    Error:
      type: object
      properties: { message: { type: string } }
    Filter:
      type: object
      properties: { name: { type: string } }
    Animal:
      type: object
      required: [kind]
      properties: { kind: { type: string } }
      discriminator:
        propertyName: kind
        mapping:
          dog: '#/components/schemas/Dog'
    Dog:
      allOf:
        - $ref: '#/components/schemas/Animal'
        - type: object
          properties: { bark: { type: boolean } }
`;

let workDir: string;
let outputDir: string;

function read(...path: string[]): string {
  return readFileSync(join(outputDir, ...path), 'utf8');
}

async function generate(config: Record<string, unknown> = {}): Promise<void> {
  const specFile = join(workDir, 'spec.yml');
  writeFileSync(specFile, spec);
  outputDir = mkdtempSync(join(workDir, 'out-'));
  await new OpenApiGenerator({ outputDir, newLine: '\n', existingFileBehavior: 'count' })
    .useType(CSharpModelsGenerator, {} as never)
    .useType(CSharpHttpClientsGenerator, config as never)
    .parseAndGenerate(specFile);
}

describe('DefaultCSharpHttpClientGenerator', () => {
  beforeAll(async () => {
    workDir = mkdtempSync(join(tmpdir(), 'goast-csharp-clients-'));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await generate();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    rmSync(workDir, { recursive: true, force: true });
  });

  it('writes an interface, a client, a registration extension and the shared helpers', () => {
    const files = readdirSync(join(outputDir, 'Clients'));
    expect(files).toEqual(
      expect.arrayContaining([
        'IPetsClient.cs',
        'PetsClient.cs',
        'PetsClientServiceCollectionExtensions.cs',
        'ApiException.cs',
        'ApiFile.cs',
        'ApiRuntime.cs',
      ]),
    );
    expect(read('Clients', 'PetsClient.cs')).toContain('public class PetsClient : IPetsClient');
    expect(read('Clients', 'IPetsClient.cs')).toContain('public interface IPetsClient');
  });

  it('writes the exception types of every service once even for an operation with several tags', () => {
    const files = readdirSync(join(outputDir, 'Clients')).filter((x) => x.includes('Exception'));
    expect(new Set(files).size).toBe(files.length);
    expect(files.filter((x) => /\d\.cs$/.test(x))).toEqual([]);
  });

  it('declares one Async method per operation with a trailing cancellation token', () => {
    expect(read('Clients', 'IPetsClient.cs')).toContain('GetPetByIdAsync(');
    expect(read('Clients', 'IPetsClient.cs')).toContain('CancellationToken cancellationToken = default');
  });

  it('takes the return type from the first success response', () => {
    expect(read('Clients', 'IPetsClient.cs')).toMatch(/Task<Pet> GetPetByIdAsync\(/);
    expect(read('Clients', 'IFilesClient.cs')).toMatch(/Task<Pet\?> MaybeAsync\(/);
  });

  it('returns a plain Task for an operation without a success body', () => {
    expect(read('Clients', 'IPetsClient.cs')).toMatch(/\bTask CreateAnimalAsync\(/);
  });

  it('names an exception per documented error response and falls back to ApiException', () => {
    const files = readdirSync(join(outputDir, 'Clients'));
    for (const name of [
      'GetPetByIdNotFoundException.cs',
      'GetPetByIdStatus418Exception.cs',
      'GetPetByIdStatus4XXException.cs',
      'GetPetByIdDefaultException.cs',
    ]) {
      expect(files).toContain(name);
    }

    const client = read('Clients', 'PetsClient.cs');
    expect(client).toContain('404 => new GetPetByIdNotFoundException(');
    expect(client).toContain('>= 400 and <= 499 => new GetPetByIdStatus4XXException(');
    expect(client).toContain('_ => new GetPetByIdDefaultException(');
  });

  it('gives typed exceptions a Body only when the response has content', () => {
    expect(read('Clients', 'GetPetByIdNotFoundException.cs')).toContain('public Error? Body { get; }');
    expect(read('Clients', 'GetPetByIdStatus418Exception.cs')).not.toContain(' Body { get; }');
    expect(read('Clients', 'GetPetByIdStatus4XXException.cs')).toContain('public string? Body { get; }');
    expect(read('Clients', 'GetPetByIdNotFoundException.cs')).toContain('public sealed class');
  });

  it('serializes parameters per style and explode and ignores Authorization header parameters', () => {
    const client = read('Clients', 'PetsClient.cs');
    expect(client).toContain('ApiRuntime.AddQuery(__query, "tags", tags, explode: false);');
    expect(client).toContain('ApiRuntime.AddQuery(__query, "filter", filter, style: "deepObject");');
    expect(client).toContain('ApiRuntime.AddQuery(__query, "q", q, allowReserved: true);');
    expect(client).toContain('ApiRuntime.AddHeader(__request, "X-Trace", xTrace);');
    expect(client).toContain('ApiRuntime.AddCookie(__cookies, "session", session);');
    expect(client).not.toContain('"Authorization"');
  });

  it('serializes a subtype of a polymorphic base through the base so the discriminator is written', () => {
    expect(read('Clients', 'PetsClient.cs')).toContain(
      'ApiRuntime.CreateJsonContent<Animal?>(body, "application/json")',
    );
  });

  it('turns multipart properties into parameters, with files as ApiFile', () => {
    const client = read('Clients', 'IFilesClient.cs');
    expect(client).toContain('ApiFile file');
    expect(client).toContain('IReadOnlyList<ApiFile>? attachments = null');
    expect(client).toContain('string? note = null');
    expect(client).toContain('Task<Stream> UploadAsync(');
    expect(read('Clients', 'FilesClient.cs')).toContain('ApiRuntime.AddPart(__content, "file", file);');
  });

  it('registers the client with IHttpClientFactory and defaults the base address to the first server', () => {
    const extensions = read('Clients', 'PetsClientServiceCollectionExtensions.cs');
    expect(extensions).toContain('public static IHttpClientBuilder AddPetsClient(');
    expect(extensions).toContain('this IServiceCollection services');
    expect(extensions).toContain('Action<HttpClient>? configure = null');
    expect(extensions).toContain('AddHttpClient<IPetsClient, PetsClient>');
    expect(extensions).toContain('httpClient.BaseAddress = new Uri("https://api.example.com/v1");');
  });

  it('writes into the configured namespace and directory', async () => {
    await generate({ namespaceSuffix: '.Http', clientsDir: 'Http' });
    expect(read('Http', 'PetsClient.cs')).toContain('namespace OpenApi.Generated.Http;');
    expect(read('Http', 'ApiRuntime.cs')).toContain('namespace OpenApi.Generated.Http;');
  });

  it('configures JSON with web defaults and out-of-order metadata properties', () => {
    const runtime = read('Http', 'ApiRuntime.cs');
    expect(runtime).toContain('new JsonSerializerOptions(JsonSerializerDefaults.Web)');
    expect(runtime).toContain('AllowOutOfOrderMetadataProperties = true');
  });

  describe('getContentKind', () => {
    const generator = new TestGenerator();

    it('classifies media types', () => {
      expect(generator.contentKind('application/json')).toBe('json');
      expect(generator.contentKind('application/vnd.api+json; charset=utf-8')).toBe('json');
      expect(generator.contentKind('*/*')).toBe('json');
      expect(generator.contentKind('application/x-www-form-urlencoded')).toBe('form');
      expect(generator.contentKind('multipart/form-data')).toBe('multipart');
      expect(generator.contentKind('text/plain')).toBe('text');
      expect(generator.contentKind('application/octet-stream')).toBe('binary');
      expect(generator.contentKind('image/png')).toBe('binary');
    });
  });
});
