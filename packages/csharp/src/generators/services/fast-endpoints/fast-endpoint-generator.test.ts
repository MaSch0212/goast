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
import { DefaultCSharpFastEndpointGenerator } from './fast-endpoint-generator.ts';
import type { CSharpFastEndpointGeneratorContext } from './models.ts';

const pet = createSchema('object');
const error = createSchema('object');
const string = createSchema('string');
const integer = createSchema('integer', { format: 'int32' });
const stringArray = createSchema('array', { items: string });
const types = new Map([
  [pet, modelType('Pet')],
  [error, modelType('Error')],
  [string, cs.refs.system.string() as never],
  [integer, cs.refs.system.int() as never],
  [stringArray, cs.reference.array(cs.refs.system.string()) as never],
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
): CSharpFastEndpointGeneratorContext {
  const base = createContext(types, {
    outputDir,
    existingFileBehavior: 'override',
    namespaceSuffix: '.FastEndpoints',
    fastEndpointsDir: 'FastEndpoints',
    ...config,
  } as never);
  return {
    ...base,
    service,
    data: { documents: [{ $src: { file: 'spec.yml' } }], services: [service], endpoints: [], schemas: [] },
    output: { csharp: { fastEndpoints: {} } },
    existingServiceResults: new Map(),
  } as unknown as CSharpFastEndpointGeneratorContext;
}

class TestGenerator extends DefaultCSharpFastEndpointGenerator {
  public endpoint(ctx: CSharpFastEndpointGeneratorContext, endpoint: ApiEndpoint) {
    return render(this.getEndpoint(ctx, { info: this.info(ctx, endpoint) }));
  }

  public configure(ctx: CSharpFastEndpointGeneratorContext, endpoint: ApiEndpoint) {
    return render(this.getConfigureMethod(ctx, { info: this.info(ctx, endpoint) }));
  }

  public handle(ctx: CSharpFastEndpointGeneratorContext, endpoint: ApiEndpoint) {
    return render(this.getHandleMethod(ctx, { info: this.info(ctx, endpoint) }));
  }

  public handler(ctx: CSharpFastEndpointGeneratorContext, endpoint: ApiEndpoint) {
    return render(this.getHandlerMethod(ctx, { info: this.info(ctx, endpoint) }));
  }

  public endpointName(ctx: CSharpFastEndpointGeneratorContext, endpoint: ApiEndpoint) {
    return this.getEndpointName(ctx, { endpoint });
  }

  private info(ctx: CSharpFastEndpointGeneratorContext, endpoint: ApiEndpoint) {
    const name = endpoint.name.charAt(0).toUpperCase() + endpoint.name.slice(1);
    return {
      endpoint,
      plans: getEndpointParameters(ctx, endpoint, { supportNamespace: 'OpenApi.Generated.Controllers' }),
      result: buildStrictResult(ctx, endpoint, { namespace: 'OpenApi.Generated.Controllers' }),
      endpointName: `${name}EndpointBase`,
      handlerName: `${name}Async`,
    };
  }
}

const json = (schema: ReturnType<typeof createSchema>) => [{ type: 'application/json', schema }];

describe('DefaultCSharpFastEndpointGenerator', () => {
  describe('endpoint', () => {
    it('derives from EndpointWithoutRequest and declares the handler', () => {
      const endpoint = createEndpoint('getPet', { responses: [createResponse('204')] });
      const ctx = createGeneratorContext(createService('Pets', [endpoint]));

      const rendered = new TestGenerator().endpoint(ctx, endpoint);

      expect(rendered).toContain('public abstract class GetPetEndpointBase : EndpointWithoutRequest');
      expect(rendered).toContain('protected virtual void ConfigureEndpoint()');
      expect(rendered).toContain(
        'protected abstract Task<GetPetResult> GetPetAsync(CancellationToken cancellationToken);',
      );
    });
  });

  describe('configure', () => {
    it('sets the verb and the route below the base path, then calls the hook, and does not allow anonymous', () => {
      const endpoint = createEndpoint('getPet', { path: '/pets/{id}' });
      const ctx = createGeneratorContext(createService('Pets', [endpoint]));

      expect(new TestGenerator().configure(ctx, endpoint)).toBe(
        [
          'public sealed override void Configure()',
          '{',
          '    Verbs(Http.GET);',
          '    Routes("v1/pets/{id}");',
          '    DontAutoSendResponse();',
          '    ConfigureEndpoint();',
          '}',
          '',
        ].join('\n'),
      );
    });

    it('has no base path when the server has no path, and lets the config replace it and modify paths', () => {
      const endpoint = createEndpoint('getPet', { path: '/pets' });
      const generator = new TestGenerator();

      expect(
        generator.configure(
          createGeneratorContext(createService('Pets', [endpoint], 'https://api.example.com')),
          endpoint,
        ),
      ).toContain('Routes("pets");');
      expect(
        generator.configure(
          createGeneratorContext(createService('Pets', [endpoint]), 'unused', {
            basePath: '/api/',
            pathModifier: (path: string) => `${path}/x`,
          }),
          endpoint,
        ),
      ).toContain('Routes("api/pets/x");');
    });

    it('uses the Http member of the method, and the method name for a verb FastEndpoints does not know', () => {
      const ctx = createGeneratorContext(createService('Verbs', []));
      const generator = new TestGenerator();
      const verbs = (method: string) =>
        /Verbs\((.*)\);/.exec(generator.configure(ctx, createEndpoint('op', { method, path: '/op' })))?.[1];

      expect(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'].map(verbs)).toEqual([
        'Http.GET',
        'Http.POST',
        'Http.PUT',
        'Http.PATCH',
        'Http.DELETE',
        'Http.HEAD',
        'Http.OPTIONS',
        'Http.TRACE',
      ]);
      expect(verbs('purge')).toBe('"PURGE"');
    });
  });

  describe('handle', () => {
    it('reads the raw values, calls the handler and writes every documented result', () => {
      const endpoint = createEndpoint('getWidget', {
        path: '/widgets/{id}',
        parameters: [
          createParameter('id', 'path', string, { required: true }),
          createParameter('X-Trace', 'header', string),
        ],
        responses: [
          createResponse('200', {
            content: json(pet),
            headers: [createHeader('X-Rate-Limit', integer)],
          }),
          createResponse('404'),
          createResponse('default', { content: json(error) }),
        ],
      });
      const ctx = createGeneratorContext(createService('Widgets', [endpoint]));

      expect(new TestGenerator().handle(ctx, endpoint)).toBe(
        [
          'public sealed override async Task HandleAsync(CancellationToken cancellationToken)',
          '{',
          '    var request = HttpContext.Request;',
          '    string idValue = default!;',
          '    string? xTrace = default!;',
          '    try',
          '    {',
          '        string id = ApiEndpointSupport.Route(request, "id") ?? throw new ApiRequestException("The path parameter \'id\' is required.");',
          '        idValue = ApiRequestSupport.DecodePathSegment(id);',
          '        xTrace = ApiEndpointSupport.Header(request, "X-Trace");',
          '    }',
          '    catch (ApiRequestException requestException)',
          '    {',
          '        await new ApiEndpointResponse(requestException.StatusCode, "text/plain; charset=utf-8", requestException.Message).WriteAsync(HttpContext.Response, cancellationToken);',
          '        return;',
          '    }',
          '',
          '    var result = await GetWidgetAsync(idValue, xTrace, cancellationToken);',
          '',
          '    await (result switch',
          '    {',
          '        GetWidgetResult.OkResponse response => new ApiEndpointResponse(',
          '            200,',
          '            "application/json",',
          '            response.Body,',
          '            ("X-Rate-Limit", response.XRateLimit)',
          '        ),',
          '        GetWidgetResult.NotFoundResponse => new ApiEndpointResponse(404, null, null),',
          '        GetWidgetResult.DefaultResponse response => new ApiEndpointResponse(response.StatusCode, "application/json", response.Body),',
          '        _ => throw new InvalidOperationException("The result is not one of the documented responses.")',
          '    }).WriteAsync(HttpContext.Response, cancellationToken);',
          '}',
          '',
        ].join('\n'),
      );
    });

    it('reads a body the way the controllers do', () => {
      const endpoint = createEndpoint('createPet', {
        method: 'post',
        path: '/pets',
        requestBody: { required: true, content: json(pet) },
        responses: [createResponse('201', { content: json(pet) })],
      });
      const ctx = createGeneratorContext(createService('Pets', [endpoint]));

      const rendered = new TestGenerator().handle(ctx, endpoint);

      expect(rendered).toContain(
        'body = (Pet)(await ApiRequestSupport.ReadBodyAsync(request, typeof(Pet), true, cancellationToken))!;',
      );
    });

    it('converts native scalars from the raw value and rejects a missing required one', () => {
      const endpoint = createEndpoint('search', {
        parameters: [
          createParameter('limit', 'query', integer, { required: true }),
          createParameter('offset', 'query', integer),
          createParameter('tags', 'query', stringArray, { style: 'form', explode: true }),
        ],
        responses: [createResponse('204')],
      });
      const ctx = createGeneratorContext(createService('Search', [endpoint]));

      const rendered = new TestGenerator().handle(ctx, endpoint);

      expect(rendered).toContain(
        'int? limit = (int?)ApiRequestSupport.ParseValue(ApiEndpointSupport.Query(request, "limit"), typeof(int));',
      );
      expect(rendered).toContain(
        'limitValue = limit ?? throw new ApiRequestException("The query parameter \'limit\' is required.");',
      );
      expect(rendered).toContain(
        'offset = (int?)ApiRequestSupport.ParseValue(ApiEndpointSupport.Query(request, "offset"), typeof(int));',
      );
      expect(rendered).toContain('string[]? tags = ApiEndpointSupport.QueryValues(request, "tags", false);');
    });

    it('reads form fields and files from the form, and rejects a request that is not a form', () => {
      const file = createSchema('string', { format: 'binary' });
      const endpoint = createEndpoint('upload', {
        method: 'post',
        requestBody: {
          required: true,
          content: [
            {
              type: 'multipart/form-data',
              schema: createSchema('object', {
                properties: new Map([
                  ['file', { name: 'file', schema: file }],
                  ['note', { name: 'note', schema: string }],
                ]),
                required: new Set(['file']),
                allOf: [],
                anyOf: [],
              }),
            },
          ],
        },
        responses: [createResponse('204')],
      });
      const ctx = createGeneratorContext(createService('Upload', [endpoint]));

      const rendered = new TestGenerator().handle(ctx, endpoint);

      expect(rendered).toContain('var form = await ApiEndpointSupport.ReadFormAsync(request, cancellationToken);');
      expect(rendered).toContain('ApiEndpointSupport.FormFile(form, "file")');
      expect(rendered).toContain('ApiEndpointSupport.FormValue(form, "note")');
    });
  });

  describe('handler', () => {
    it('is protected and abstract', () => {
      const endpoint = createEndpoint('getPet', { responses: [createResponse('204')], description: 'Gets a pet.' });
      const ctx = createGeneratorContext(createService('Pets', [endpoint]));

      expect(new TestGenerator().handler(ctx, endpoint)).toContain(
        'protected abstract Task<GetPetResult> GetPetAsync(CancellationToken cancellationToken);',
      );
    });
  });

  describe('names', () => {
    it('derives the endpoint name from the operation', () => {
      const ctx = createGeneratorContext(createService('Pets', []));

      expect(new TestGenerator().endpointName(ctx, createEndpoint('get pet by id'))).toBe('GetPetByIdEndpointBase');
    });
  });

  describe('generate', () => {
    it('writes an endpoint and a result per operation, once for an operation of several services', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'goast-fastendpoints-'));
      tempDirs.push(dir);
      const shared = createEndpoint('shared', { responses: [createResponse('204')] });
      const own = createEndpoint('own', { responses: [createResponse('204')] });
      const first = createService('First', [shared, own]);
      const second = createService('Second', [shared]);
      const ctx = createGeneratorContext(first, dir);
      const generator = new DefaultCSharpFastEndpointGenerator();

      const firstOutput = await generator.generate(ctx);
      ctx.output.csharp.fastEndpoints[first.id] = firstOutput;
      const secondOutput = await generator.generate({ ...ctx, service: second });

      expect(readdirSync(join(dir, 'FastEndpoints')).sort()).toEqual([
        'OwnEndpointBase.cs',
        'OwnResult.cs',
        'SharedEndpointBase.cs',
        'SharedResult.cs',
      ]);
      expect(Object.keys(firstOutput.endpoints)).toEqual([shared.id, own.id]);
      expect(firstOutput.endpoints[shared.id].name).toBe('SharedEndpointBase');
      expect(Object.keys(secondOutput.results)).toEqual([shared.id]);
      expect(readFileSync(join(dir, 'FastEndpoints', 'SharedEndpointBase.cs'), 'utf8')).toContain(
        'namespace OpenApi.Generated.FastEndpoints;',
      );
    });

    it('keeps the handler name clear of the members of the endpoint base class', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'goast-fastendpoints-'));
      tempDirs.push(dir);
      const execute = createEndpoint('execute', { responses: [createResponse('204')] });
      const ctx = createGeneratorContext(createService('Clash', [execute]), dir);

      await new DefaultCSharpFastEndpointGenerator().generate(ctx);

      const text = readFileSync(join(dir, 'FastEndpoints', 'ExecuteEndpointBase.cs'), 'utf8');
      expect(text).toContain('protected abstract Task<ExecuteResult> ExecuteAsync_2(');
    });

    it('writes the support types once, in the namespace of the endpoints', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'goast-fastendpoints-'));
      tempDirs.push(dir);
      const ctx = createGeneratorContext(createService('Empty', []), dir);

      await new DefaultCSharpFastEndpointGenerator().generateSupportFiles(ctx);

      expect(readdirSync(join(dir, 'FastEndpoints')).sort()).toEqual([
        'ApiEndpointResponse.cs',
        'ApiEndpointSupport.cs',
        'ApiJsonSupport.cs',
        'ApiRequestException.cs',
        'ApiRequestSupport.cs',
        'ApiResponseSupport.cs',
      ]);
      const response = readFileSync(join(dir, 'FastEndpoints', 'ApiEndpointResponse.cs'), 'utf8');
      expect(response).toContain('namespace OpenApi.Generated.FastEndpoints;');
      expect(response).toContain('public sealed class ApiEndpointResponse');
      expect(response).toContain('public Task WriteAsync(HttpResponse response, CancellationToken cancellationToken)');
    });
  });
});
