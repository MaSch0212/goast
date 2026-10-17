import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { ApiEndpoint, ApiService } from '@goast/core';

import { cs } from '../../../ast/index.ts';
import {
  createContext,
  createEndpoint,
  createHeader,
  createParameter,
  createResponse,
  createSchema,
  modelType,
  render,
} from '../shared/endpoint.test-utils.ts';
import { buildStrictResult, getEndpointParameters } from '../shared/index.ts';
import { DefaultCSharpMinimalApiGenerator } from './minimal-api-generator.ts';
import type { CSharpMinimalApiGeneratorContext } from './models.ts';

const pet = createSchema('object');
const error = createSchema('object');
const string = createSchema('string');
const integer = createSchema('integer', { format: 'int32' });
const types = new Map([
  [pet, modelType('Pet')],
  [error, modelType('Error')],
  [string, cs.refs.system.string() as never],
  [integer, cs.refs.system.int() as never],
]);

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function createService(name: string, endpoints: ApiEndpoint[], server = 'https://api.example.com/v1'): ApiService {
  const withSource = endpoints.map((endpoint) =>
    Object.assign(endpoint, {
      $src: { file: 'spec.yml', path: `/paths${endpoint.path}`, document: { servers: [{ url: server }] } },
    }),
  );
  return { id: `service-${name}`, name, description: undefined, endpoints: withSource } as unknown as ApiService;
}

function createGeneratorContext(
  service: ApiService,
  outputDir = 'unused',
  config: Record<string, unknown> = {},
): CSharpMinimalApiGeneratorContext {
  const base = createContext(types, {
    outputDir,
    existingFileBehavior: 'override',
    namespaceSuffix: '.MinimalApis',
    minimalApisDir: 'MinimalApis',
    ...config,
  } as never);
  return {
    ...base,
    service,
    data: { documents: [{ $src: { file: 'spec.yml' } }], services: [service], endpoints: [], schemas: [] },
    output: { csharp: { minimalApis: {} } },
    existingServiceResults: new Map(),
  } as unknown as CSharpMinimalApiGeneratorContext;
}

class TestGenerator extends DefaultCSharpMinimalApiGenerator {
  public method(ctx: CSharpMinimalApiGeneratorContext, endpoint: ApiEndpoint) {
    return render(this.getEndpointMethod(ctx, { apiName: 'PetsApiBase', info: this.info(ctx, endpoint) }));
  }

  public mapping(ctx: CSharpMinimalApiGeneratorContext, endpoint: ApiEndpoint) {
    return render(this.getRouteMapping(ctx, { info: this.info(ctx, endpoint), group: 'group' }));
  }

  public mapMethod(ctx: CSharpMinimalApiGeneratorContext, endpoints: ApiEndpoint[]) {
    return render(
      this.getMapMethod(ctx, { apiName: 'PetsApiBase', endpoints: endpoints.map((x) => this.info(ctx, x)) }),
    );
  }

  public handler(ctx: CSharpMinimalApiGeneratorContext, endpoint: ApiEndpoint) {
    return render(this.getHandlerMethod(ctx, { info: this.info(ctx, endpoint) }));
  }

  public names(ctx: CSharpMinimalApiGeneratorContext) {
    return [this.getApiName(ctx, {}), this.getExtensionsName(ctx, {}), this.getMapMethodName(ctx, {})];
  }

  private info(ctx: CSharpMinimalApiGeneratorContext, endpoint: ApiEndpoint) {
    const name = endpoint.name.charAt(0).toUpperCase() + endpoint.name.slice(1);
    return {
      endpoint,
      plans: getEndpointParameters(ctx, endpoint, { supportNamespace: 'OpenApi.Generated.MinimalApis' }),
      result: buildStrictResult(ctx, endpoint, { namespace: 'OpenApi.Generated.MinimalApis' }),
      handlerName: `${name}Async`,
      methodName: `${name}Endpoint`,
    };
  }
}

const json = (schema: ReturnType<typeof createSchema>) => [{ type: 'application/json', schema }];

describe('DefaultCSharpMinimalApiGenerator', () => {
  describe('endpoint method', () => {
    it('binds by wire name, resolves the API, calls the handler and converts every documented result', () => {
      const endpoint = createEndpoint('getWidget', {
        path: '/widgets/{id}',
        parameters: [
          createParameter('id', 'path', string, { required: true }),
          createParameter('X-Trace', 'header', string),
        ],
        responses: [
          createResponse('200', { content: json(pet), headers: [createHeader('X-Rate-Limit', integer)] }),
          createResponse('404'),
          createResponse('default', { content: json(error) }),
        ],
      });
      const ctx = createGeneratorContext(createService('Widgets', [endpoint]));

      expect(new TestGenerator().method(ctx, endpoint)).toBe(
        [
          '/// <summary>',
          '/// Handles the getWidget operation.',
          '/// </summary>',
          'private static async Task<IResult> GetWidgetEndpoint(',
          '    [FromServices] PetsApiBase api,',
          '    [FromRoute(Name = "id")] string id,',
          '    [FromHeader(Name = "X-Trace")] string? xTrace,',
          '    CancellationToken cancellationToken',
          ')',
          '{',
          '    string idValue = default!;',
          '    try',
          '    {',
          '        idValue = ApiRequestSupport.DecodePathSegment(id);',
          '    }',
          '    catch (ApiRequestException requestException)',
          '    {',
          '        return Results.Text(requestException.Message, statusCode: requestException.StatusCode);',
          '    }',
          '',
          '    var result = await api.GetWidgetAsync(idValue, xTrace, cancellationToken);',
          '',
          '    return result switch',
          '    {',
          '        GetWidgetResult.OkResponse response => new ApiHttpResult(',
          '            200,',
          '            "application/json",',
          '            response.Body,',
          '            ("X-Rate-Limit", response.XRateLimit)',
          '        ),',
          '        GetWidgetResult.NotFoundResponse => new ApiHttpResult(404, null, null),',
          '        GetWidgetResult.DefaultResponse response => new ApiHttpResult(response.StatusCode, "application/json", response.Body),',
          '        _ => throw new InvalidOperationException("The result is not one of the documented responses.")',
          '    };',
          '}',
          '',
        ].join('\n'),
      );
    });

    it('reads a body from the request and avoids names the parameters use', () => {
      const endpoint = createEndpoint('createPet', {
        method: 'post',
        path: '/pets',
        parameters: [createParameter('api', 'query', string), createParameter('request', 'query', string)],
        requestBody: { required: true, content: json(pet) },
        responses: [createResponse('201', { content: json(pet) })],
      });
      const ctx = createGeneratorContext(createService('Pets', [endpoint]));

      const rendered = new TestGenerator().method(ctx, endpoint);

      expect(rendered).toContain('[FromServices] PetsApiBase api_2,');
      expect(rendered).toContain('HttpRequest request_2,');
      expect(rendered).toContain(
        'body = (Pet)(await ApiRequestSupport.ReadBodyAsync(request_2, typeof(Pet), true, cancellationToken))!;',
      );
      expect(rendered).toContain('await api_2.CreatePetAsync(');
    });

    it('calls the handler directly when every parameter is bound natively', () => {
      const endpoint = createEndpoint('search', {
        parameters: [createParameter('q', 'query', string, { required: true })],
        responses: [createResponse('204')],
      });
      const ctx = createGeneratorContext(createService('Search', [endpoint]));

      const rendered = new TestGenerator().method(ctx, endpoint);

      expect(rendered).not.toContain('try');
      expect(rendered).toContain('var result = await api.SearchAsync(q, cancellationToken);');
    });
  });

  describe('route mapping', () => {
    it('maps below the base path of the service, relative to it, and declares the metadata', () => {
      const endpoint = createEndpoint('getPet', {
        path: '/pets/{id}',
        responses: [
          createResponse('200', { content: json(pet) }),
          createResponse('404'),
          createResponse('2XX', { content: json(error) }),
          createResponse('default', { content: json(error) }),
        ],
      });
      const ctx = createGeneratorContext(createService('Pets', [endpoint]));
      const generator = new TestGenerator();

      expect(generator.mapping(ctx, endpoint)).toBe(
        [
          'group.MapGet("pets/{id}", GetPetEndpoint)',
          '    .WithName("getPet")',
          '    .WithTags("Pets")',
          '    .Produces<Pet>(200, "application/json")',
          '    .Produces(404);',
          '',
        ].join('\n'),
      );
      expect(generator.mapMethod(ctx, [endpoint])).toContain('var group = app.MapGroup("v1");');
      expect(generator.mapMethod(ctx, [endpoint])).toContain(
        'public static RouteGroupBuilder MapPetsApi(this IEndpointRouteBuilder app)',
      );
    });

    it('groups without a path when the server has none', () => {
      const endpoint = createEndpoint('getPet');
      const ctx = createGeneratorContext(createService('Pets', [endpoint], 'https://api.example.com'));

      expect(new TestGenerator().mapMethod(ctx, [endpoint])).toContain('var group = app.MapGroup("");');
    });

    it('lets the config replace the base path and modify endpoint paths', () => {
      const endpoint = createEndpoint('getPet', { path: '/pets' });
      const ctx = createGeneratorContext(createService('Pets', [endpoint]), 'unused', {
        basePath: '/api/',
        pathModifier: (path: string) => `${path}/x`,
      });
      const generator = new TestGenerator();

      expect(generator.mapMethod(ctx, [endpoint])).toContain('app.MapGroup("api")');
      expect(generator.mapping(ctx, endpoint)).toContain('group.MapGet("pets/x", GetPetEndpoint)');
    });

    it('escapes the characters of a path that are tokens of a route template', () => {
      const endpoint = createEndpoint('odd', { path: '/a[b]/{id}' });
      const ctx = createGeneratorContext(createService('Odd', [endpoint]));

      expect(new TestGenerator().mapping(ctx, endpoint)).toContain('group.MapGet("a[[b]]/{id}", OddEndpoint)');
    });

    it('maps every HTTP method, and the others through MapMethods', () => {
      const ctx = createGeneratorContext(createService('Verbs', []));
      const generator = new TestGenerator();
      const call = (method: string) =>
        generator.mapping(ctx, createEndpoint('op', { method, path: '/op' })).split('\n')[0];

      expect(['get', 'post', 'put', 'patch', 'delete'].map(call)).toEqual([
        'group.MapGet("op", OpEndpoint)',
        'group.MapPost("op", OpEndpoint)',
        'group.MapPut("op", OpEndpoint)',
        'group.MapPatch("op", OpEndpoint)',
        'group.MapDelete("op", OpEndpoint)',
      ]);
      expect(call('head')).toBe('group.MapMethods("op", new[] { "HEAD" }, OpEndpoint)');
      expect(call('trace')).toBe('group.MapMethods("op", new[] { "TRACE" }, OpEndpoint)');
    });

    it('declares the content types of a body except wildcards, and optional bodies as optional', () => {
      const endpoint = createEndpoint('upload', {
        method: 'post',
        requestBody: {
          required: false,
          content: [
            { type: 'application/json', schema: pet },
            { type: '*/*', schema: pet },
          ],
        },
      });
      const ctx = createGeneratorContext(createService('Upload', [endpoint]));

      expect(new TestGenerator().mapping(ctx, endpoint)).toContain('.Accepts<Pet>(true, "application/json")');
    });

    it('declares several content types of a response untyped, and a form without anti-forgery', () => {
      const file = createSchema('string', { format: 'binary' });
      const endpoint = createEndpoint('multi', {
        method: 'post',
        requestBody: {
          required: true,
          content: [
            {
              type: 'multipart/form-data',
              schema: createSchema('object', {
                required: new Set(['file']),
                properties: new Map([['file', { name: 'file', schema: file }]]),
                allOf: [],
                anyOf: [],
              }),
            },
          ],
        },
        responses: [
          createResponse('200', {
            content: [
              { type: 'application/json', schema: pet },
              { type: 'text/plain', schema: string },
            ],
          }),
        ],
      });
      const ctx = createGeneratorContext(createService('Multi', [endpoint]));

      const rendered = new TestGenerator().mapping(ctx, endpoint);

      expect(rendered).toContain('.Produces(200, null, "application/json", "text/plain")');
      expect(rendered).toContain('.DisableAntiforgery();');
      expect(rendered).not.toContain('.Accepts');
    });
  });

  describe('handler', () => {
    it('is public and abstract', () => {
      const endpoint = createEndpoint('getPet', { responses: [createResponse('204')], description: 'Gets a pet.' });
      const ctx = createGeneratorContext(createService('Pets', [endpoint]));

      expect(new TestGenerator().handler(ctx, endpoint)).toContain(
        'public abstract Task<GetPetResult> GetPetAsync(CancellationToken cancellationToken);',
      );
    });
  });

  describe('names', () => {
    it('derives the type and method names from the service', () => {
      const ctx = createGeneratorContext(createService('pet store', []));

      expect(new TestGenerator().names(ctx)).toEqual([
        'PetStoreApiBase',
        'PetStoreApiEndpointRouteBuilderExtensions',
        'MapPetStoreApi',
      ]);
    });
  });

  describe('generate', () => {
    it('writes an API, a mapping, a result per endpoint and, once, the result of an endpoint of several services', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'goast-minimal-apis-'));
      tempDirs.push(dir);
      const shared = createEndpoint('shared', { responses: [createResponse('204')] });
      const own = createEndpoint('own', { responses: [createResponse('204')] });
      const first = createService('First', [shared, own]);
      const second = createService('Second', [shared]);
      const ctx = createGeneratorContext(first, dir);
      const generator = new DefaultCSharpMinimalApiGenerator();

      const firstOutput = await generator.generate(ctx);
      ctx.output.csharp.minimalApis[first.id] = firstOutput;
      const secondOutput = await generator.generate({ ...ctx, service: second });

      expect(readdirSync(join(dir, 'MinimalApis')).sort()).toEqual([
        'FirstApiBase.cs',
        'FirstApiEndpointRouteBuilderExtensions.cs',
        'OwnResult.cs',
        'SecondApiBase.cs',
        'SecondApiEndpointRouteBuilderExtensions.cs',
        'SharedResult.cs',
      ]);
      expect(firstOutput.api.name).toBe('FirstApiBase');
      expect(firstOutput.extensions.name).toBe('FirstApiEndpointRouteBuilderExtensions');
      expect(Object.keys(firstOutput.results)).toEqual([shared.id, own.id]);
      expect(Object.keys(secondOutput.results)).toEqual([shared.id]);
      expect(readFileSync(join(dir, 'MinimalApis', 'SharedResult.cs'), 'utf8')).toContain(
        'namespace OpenApi.Generated.MinimalApis;',
      );
    });

    it('writes the support types once, in the namespace of the minimal APIs', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'goast-minimal-apis-'));
      tempDirs.push(dir);
      const ctx = createGeneratorContext(createService('Empty', []), dir);

      await new DefaultCSharpMinimalApiGenerator().generateSupportFiles(ctx);

      expect(readdirSync(join(dir, 'MinimalApis')).sort()).toEqual([
        'ApiHttpResult.cs',
        'ApiJsonSupport.cs',
        'ApiRequestException.cs',
        'ApiRequestSupport.cs',
        'ApiResponseSupport.cs',
      ]);
      const httpResult = readFileSync(join(dir, 'MinimalApis', 'ApiHttpResult.cs'), 'utf8');
      expect(httpResult).toContain('namespace OpenApi.Generated.MinimalApis;');
      expect(httpResult).toContain('public sealed class ApiHttpResult : IResult');
    });
  });
});
