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
import { DefaultCSharpControllerGenerator } from './controller-generator.ts';
import type { CSharpControllerGeneratorContext } from './models.ts';

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
): CSharpControllerGeneratorContext {
  const base = createContext(types, { outputDir, existingFileBehavior: 'override', ...config } as never);
  return {
    ...base,
    service,
    data: { documents: [{ $src: { file: 'spec.yml' } }], services: [service], endpoints: [], schemas: [] },
    output: { csharp: { controllers: {} } },
    existingServiceResults: new Map(),
  } as unknown as CSharpControllerGeneratorContext;
}

class TestGenerator extends DefaultCSharpControllerGenerator {
  public render(ctx: CSharpControllerGeneratorContext, endpoint: ApiEndpoint) {
    const info = this.info(ctx, endpoint);
    return render(this.getAction(ctx, { info }));
  }

  public attributes(ctx: CSharpControllerGeneratorContext, endpoint: ApiEndpoint) {
    return this.getActionAttributes(ctx, { info: this.info(ctx, endpoint) }).map((a) => render(a).trim());
  }

  public controllerAttributes(ctx: CSharpControllerGeneratorContext) {
    return this.getControllerAttributes(ctx, {}).map((a) => render(a).trim());
  }

  public controllerName(ctx: CSharpControllerGeneratorContext) {
    return this.getControllerName(ctx, {});
  }

  public handler(ctx: CSharpControllerGeneratorContext, endpoint: ApiEndpoint) {
    return render(this.getHandlerMethod(ctx, { info: this.info(ctx, endpoint) }));
  }

  private info(ctx: CSharpControllerGeneratorContext, endpoint: ApiEndpoint) {
    const name = endpoint.name.charAt(0).toUpperCase() + endpoint.name.slice(1);
    return {
      endpoint,
      plans: getEndpointParameters(ctx, endpoint, { supportNamespace: 'OpenApi.Generated.Controllers' }),
      result: buildStrictResult(ctx, endpoint, { namespace: 'OpenApi.Generated.Controllers' }),
      actionName: name,
      handlerName: `${name}Async`,
    };
  }
}

const json = (schema: ReturnType<typeof createSchema>) => [{ type: 'application/json', schema }];

describe('DefaultCSharpControllerGenerator', () => {
  describe('action', () => {
    it('binds by wire name, calls the handler and converts every documented result', () => {
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

      expect(new TestGenerator().render(ctx, endpoint)).toBe(
        [
          '/// <summary>',
          '/// Handles the getWidget operation.',
          '/// </summary>',
          '[HttpGet("widgets/{id}")]',
          '[ProducesResponseType(typeof(Pet), 200, "application/json")]',
          '[ProducesResponseType(404)]',
          '[ProducesDefaultResponseType(typeof(Error))]',
          'public async Task<IActionResult> GetWidget(',
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
          '        return StatusCode(requestException.StatusCode, requestException.Message);',
          '    }',
          '',
          '    var result = await GetWidgetAsync(idValue, xTrace, cancellationToken);',
          '',
          '    return result switch',
          '    {',
          '        GetWidgetResult.OkResponse response => new ApiActionResult(',
          '            200,',
          '            "application/json",',
          '            response.Body,',
          '            ("X-Rate-Limit", response.XRateLimit)',
          '        ),',
          '        GetWidgetResult.NotFoundResponse => new ApiActionResult(404, null, null),',
          '        GetWidgetResult.DefaultResponse response => new ApiActionResult(response.StatusCode, "application/json", response.Body),',
          '        _ => throw new InvalidOperationException("The result is not one of the documented responses.")',
          '    };',
          '}',
          '',
        ].join('\n'),
      );
    });

    it('takes the content type of the response from a result with several', () => {
      const endpoint = createEndpoint('multi', {
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

      expect(new TestGenerator().render(ctx, endpoint)).toContain(
        'MultiResult.OkResponse response => new ApiActionResult(200, response.ContentType, response.Body),',
      );
    });

    it('declares a body the generated code reads and answers a request it cannot bind', () => {
      const endpoint = createEndpoint('createPet', {
        method: 'post',
        path: '/pets',
        requestBody: { required: true, content: json(pet) },
        responses: [createResponse('201', { content: json(pet) })],
      });
      const ctx = createGeneratorContext(createService('Pets', [endpoint]));

      const rendered = new TestGenerator().render(ctx, endpoint);

      expect(rendered).toContain('[HttpPost("pets")]');
      expect(rendered).toContain('[Consumes("application/json")]');
      expect(rendered).toContain('public async Task<IActionResult> CreatePet(CancellationToken cancellationToken)');
      expect(rendered).toContain(
        'body = (Pet)(await ApiRequestSupport.ReadBodyAsync(Request, typeof(Pet), true, cancellationToken))!;',
      );
      expect(rendered).toContain('return StatusCode(requestException.StatusCode, requestException.Message);');
    });

    it('calls the handler directly when every parameter is bound natively', () => {
      const endpoint = createEndpoint('search', {
        parameters: [createParameter('q', 'query', string, { required: true })],
        responses: [createResponse('204')],
      });
      const ctx = createGeneratorContext(createService('Search', [endpoint]));

      const rendered = new TestGenerator().render(ctx, endpoint);

      expect(rendered).not.toContain('try');
      expect(rendered).toContain('var result = await SearchAsync(q, cancellationToken);');
    });
  });

  describe('attributes', () => {
    it('routes below the base path of the service and relative to it', () => {
      const endpoint = createEndpoint('getPet', { path: '/pets/{id}' });
      const ctx = createGeneratorContext(createService('Pets', [endpoint]));
      const generator = new TestGenerator();

      expect(generator.controllerAttributes(ctx)).toEqual(['[ApiController]', '[Route("v1")]']);
      expect(generator.attributes(ctx, endpoint)).toEqual(['[HttpGet("pets/{id}")]']);
    });

    it('has no route attribute on the controller when the server has no path', () => {
      const endpoint = createEndpoint('getPet');
      const ctx = createGeneratorContext(createService('Pets', [endpoint], 'https://api.example.com'));

      expect(new TestGenerator().controllerAttributes(ctx)).toEqual(['[ApiController]']);
    });

    it('lets the config replace the base path and modify endpoint paths', () => {
      const endpoint = createEndpoint('getPet', { path: '/pets' });
      const ctx = createGeneratorContext(createService('Pets', [endpoint]), 'unused', {
        basePath: '/api/',
        pathModifier: (path: string) => `${path}/x`,
      });
      const generator = new TestGenerator();

      expect(generator.controllerAttributes(ctx)).toEqual(['[ApiController]', '[Route("api")]']);
      expect(generator.attributes(ctx, endpoint)).toEqual(['[HttpGet("pets/x")]']);
    });

    it('escapes the characters of a path that are tokens of a route template', () => {
      const endpoint = createEndpoint('odd', { path: '/a[b]/{id}' });
      const ctx = createGeneratorContext(createService('Odd', [endpoint]));

      expect(new TestGenerator().attributes(ctx, endpoint)).toEqual(['[HttpGet("a[[b]]/{id}")]']);
    });

    it('maps every HTTP method, and TRACE to AcceptVerbs', () => {
      const ctx = createGeneratorContext(createService('Verbs', []));
      const generator = new TestGenerator();
      const attribute = (method: string) => generator.attributes(ctx, createEndpoint('op', { method, path: '/op' }))[0];

      expect(['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].map(attribute)).toEqual([
        '[HttpGet("op")]',
        '[HttpPost("op")]',
        '[HttpPut("op")]',
        '[HttpPatch("op")]',
        '[HttpDelete("op")]',
        '[HttpHead("op")]',
        '[HttpOptions("op")]',
      ]);
      expect(attribute('trace')).toBe('[AcceptVerbs("TRACE", Route = "op")]');
    });

    it('lists the content types a body is consumed as, except wildcards', () => {
      const endpoint = createEndpoint('upload', {
        method: 'post',
        requestBody: {
          required: true,
          content: [
            { type: 'application/json', schema: pet },
            { type: 'application/x-www-form-urlencoded', schema: pet },
            { type: '*/*', schema: pet },
          ],
        },
      });
      const ctx = createGeneratorContext(createService('Upload', [endpoint]));

      expect(new TestGenerator().attributes(ctx, endpoint)).toContain(
        '[Consumes("application/json", "application/x-www-form-urlencoded")]',
      );
    });
  });

  describe('handler', () => {
    it('is protected, so it is not an action', () => {
      const endpoint = createEndpoint('getPet', { responses: [createResponse('204')], description: 'Gets a pet.' });
      const ctx = createGeneratorContext(createService('Pets', [endpoint]));

      expect(new TestGenerator().handler(ctx, endpoint)).toContain(
        'protected abstract Task<GetPetResult> GetPetAsync(CancellationToken cancellationToken);',
      );
    });
  });

  describe('names', () => {
    it('derives the controller name from the service', () => {
      const ctx = createGeneratorContext(createService('pet store', []));

      expect(new TestGenerator().controllerName(ctx)).toBe('PetStoreControllerBase');
    });
  });

  describe('generate', () => {
    it('writes a controller, a result per endpoint and, once, the result of an endpoint of several services', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'goast-controllers-'));
      tempDirs.push(dir);
      const shared = createEndpoint('shared', { responses: [createResponse('204')] });
      const own = createEndpoint('own', { responses: [createResponse('204')] });
      const first = createService('First', [shared, own]);
      const second = createService('Second', [shared]);
      const ctx = createGeneratorContext(first, dir);
      const generator = new DefaultCSharpControllerGenerator();

      const firstOutput = await generator.generate(ctx);
      ctx.output.csharp.controllers[first.id] = firstOutput;
      const secondOutput = await generator.generate({ ...ctx, service: second });

      expect(readdirSync(join(dir, 'Controllers')).sort()).toEqual([
        'FirstControllerBase.cs',
        'OwnResult.cs',
        'SecondControllerBase.cs',
        'SharedResult.cs',
      ]);
      expect(firstOutput.controller.name).toBe('FirstControllerBase');
      expect(Object.keys(firstOutput.results)).toEqual([shared.id, own.id]);
      expect(Object.keys(secondOutput.results)).toEqual([shared.id]);
      expect(readFileSync(join(dir, 'Controllers', 'SharedResult.cs'), 'utf8')).toContain(
        'namespace OpenApi.Generated.Controllers;',
      );
    });

    it('writes the support types once, in the namespace of the controllers', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'goast-controllers-'));
      tempDirs.push(dir);
      const ctx = createGeneratorContext(createService('Empty', []), dir);

      await new DefaultCSharpControllerGenerator().generateSupportFiles(ctx);

      expect(readdirSync(join(dir, 'Controllers')).sort()).toEqual([
        'ApiActionResult.cs',
        'ApiJsonSupport.cs',
        'ApiRequestException.cs',
        'ApiRequestSupport.cs',
        'ApiResponseSupport.cs',
      ]);
      const actionResult = readFileSync(join(dir, 'Controllers', 'ApiActionResult.cs'), 'utf8');
      expect(actionResult).toContain('namespace OpenApi.Generated.Controllers;');
      expect(actionResult).toContain('public sealed class ApiActionResult : IActionResult');
    });
  });
});
