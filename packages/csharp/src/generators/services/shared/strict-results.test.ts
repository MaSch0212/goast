import { describe, expect, it } from 'vitest';

import { cs } from '../../../ast/index.ts';
import {
  createContext,
  createEndpoint,
  createHeader,
  createResponse,
  createSchema,
  modelType,
  render,
} from './endpoint.test-utils.ts';
import { buildStrictResult } from './strict-results.ts';

const namespace = 'OpenApi.Generated.Controllers';

function setup() {
  const pet = createSchema('object');
  const error = createSchema('object');
  const text = createSchema('string');
  const integer = createSchema('integer');
  const ctx = createContext(
    new Map([
      [pet, modelType('Pet')],
      [error, modelType('Error')],
      [text, cs.refs.system.string() as never],
      [integer, cs.refs.system.int() as never],
    ]),
  );
  return { ctx, pet, error, text, integer };
}

describe('buildStrictResult', () => {
  it('builds an abstract record with a private constructor, a factory and a case record per response key', () => {
    const { ctx, pet, error } = setup();
    const endpoint = createEndpoint('getPetById', {
      responses: [
        createResponse('200', { description: 'The pet.', content: [{ type: 'application/json', schema: pet }] }),
        createResponse('404', { description: 'Not found.' }),
        createResponse('default', {
          description: 'Unexpected.',
          content: [{ type: 'application/json', schema: error }],
        }),
      ],
    });

    const result = buildStrictResult(ctx, endpoint, { namespace });

    expect(render(result.record)).toBe(
      [
        '/// <summary>',
        '/// The documented results of the getPetById operation.',
        '/// </summary>',
        'public abstract record GetPetByIdResult',
        '{',
        '    private GetPetByIdResult()',
        '    {',
        '    }',
        '',
        '    /// <summary>',
        '    /// The pet.',
        '    /// </summary>',
        '    /// <param name="body">The response body.</param>',
        '    public static GetPetByIdResult Ok(Pet body) => new OkResponse(body);',
        '',
        '    /// <summary>',
        '    /// Not found.',
        '    /// </summary>',
        '    public static GetPetByIdResult NotFound() => new NotFoundResponse();',
        '',
        '    /// <summary>',
        '    /// Unexpected.',
        '    /// </summary>',
        '    /// <param name="statusCode">The status code.</param>',
        '    /// <param name="body">The response body.</param>',
        '    public static GetPetByIdResult Default(int statusCode, Error body)',
        '    {',
        '        if (statusCode is < 100 or > 599)',
        '        {',
        '            throw new ArgumentOutOfRangeException(nameof(statusCode), statusCode, "The status code must be in the range 100 to 599.");',
        '        }',
        '',
        '        return new DefaultResponse(statusCode, body);',
        '    }',
        '',
        '    /// <summary>',
        '    /// The pet.',
        '    /// </summary>',
        '    public sealed record OkResponse(Pet Body) : GetPetByIdResult;',
        '',
        '    /// <summary>',
        '    /// Not found.',
        '    /// </summary>',
        '    public sealed record NotFoundResponse() : GetPetByIdResult;',
        '',
        '    /// <summary>',
        '    /// Unexpected.',
        '    /// </summary>',
        '    public sealed record DefaultResponse(int StatusCode, Error Body) : GetPetByIdResult;',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('describes every case for a framework-specific conversion', () => {
    const { ctx, pet, error } = setup();
    const endpoint = createEndpoint('listPets', {
      responses: [
        createResponse('200', { content: [{ type: 'application/json', schema: pet }] }),
        createResponse('2XX', { content: [{ type: 'application/json', schema: pet }] }),
        createResponse('404'),
        createResponse('default', { content: [{ type: 'application/json', schema: error }] }),
      ],
    });

    const { cases, name, reference } = buildStrictResult(ctx, endpoint, { namespace });

    expect(name).toBe('ListPetsResult');
    expect(reference.name).toBe('ListPetsResult');
    expect(cases.map((c) => [c.factoryName, c.caseTypeName, c.statusKey, c.statusCode, c.range, c.isDefault])).toEqual([
      ['Ok', 'OkResponse', '200', 200, undefined, false],
      ['Status2XX', 'Status2XXResponse', '2XX', undefined, { min: 200, max: 299 }, false],
      ['NotFound', 'NotFoundResponse', '404', 404, undefined, false],
      ['Default', 'DefaultResponse', 'default', undefined, undefined, true],
    ]);
    expect(cases.map((c) => [c.statusCodeProperty, c.bodyProperty, c.contentTypeProperty])).toEqual([
      [undefined, 'Body', undefined],
      ['StatusCode', 'Body', undefined],
      [undefined, undefined, undefined],
      ['StatusCode', 'Body', undefined],
    ]);
    expect(cases[0].caseType.name).toBe('ListPetsResult.OkResponse');
    expect(cases[0].caseType.namespace).toBe(namespace);
    expect(cases[0].contentTypes).toEqual(['application/json']);
    expect(cases[2].contentTypes).toEqual([]);
  });

  it('takes the status code of a range response and rejects codes outside of the range', () => {
    const { ctx, pet } = setup();
    const endpoint = createEndpoint('ranges', {
      responses: [createResponse('2XX', { content: [{ type: 'application/json', schema: pet }] })],
    });

    const text = render(buildStrictResult(ctx, endpoint, { namespace }).record);

    expect(text).toContain('public static RangesResult Status2XX(int statusCode, Pet body)');
    expect(text).toContain('if (statusCode is < 200 or > 299)');
    expect(text).toContain('public sealed record Status2XXResponse(int StatusCode, Pet Body) : RangesResult;');
  });

  it('turns response headers into factory parameters, required ones first', () => {
    const { ctx, pet, integer, text } = setup();
    const endpoint = createEndpoint('getWidget', {
      responses: [
        createResponse('200', {
          content: [{ type: 'application/json', schema: pet }],
          headers: [
            createHeader('X-Rate-Limit', integer, { description: 'Remaining requests.' }),
            createHeader('X-Request-Id', text, { required: true }),
          ],
        }),
      ],
    });

    const result = buildStrictResult(ctx, endpoint, { namespace });
    const rendered = render(result.record);

    expect(rendered).toContain(
      'public static GetWidgetResult Ok(Pet body, string xRequestId, int? xRateLimit = null) => new OkResponse(body, xRateLimit, xRequestId);',
    );
    expect(rendered).toContain(
      'public sealed record OkResponse(Pet Body, int? XRateLimit, string XRequestId) : GetWidgetResult;',
    );
    expect(result.cases[0].headers.map((h) => [h.name, h.property, h.parameter, h.required])).toEqual([
      ['X-Rate-Limit', 'XRateLimit', 'xRateLimit', false],
      ['X-Request-Id', 'XRequestId', 'xRequestId', true],
    ]);
  });

  it('takes the content type as a trailing parameter when a response has several', () => {
    const { ctx, pet, text } = setup();
    const endpoint = createEndpoint('multi', {
      responses: [
        createResponse('200', {
          content: [
            { type: 'application/json', schema: pet },
            { type: 'text/plain', schema: text },
          ],
        }),
      ],
    });

    const result = buildStrictResult(ctx, endpoint, { namespace });
    const rendered = render(result.record);

    expect(rendered).toContain(
      'public static MultiResult Ok(object body, string contentType = "application/json") => new OkResponse(body, contentType);',
    );
    expect(rendered).toContain('public sealed record OkResponse(object Body, string ContentType) : MultiResult;');
    expect(result.cases[0].contentTypes).toEqual(['application/json', 'text/plain']);
    expect(result.cases[0].contentTypeProperty).toBe('ContentType');
    expect(result.cases[0].defaultContentType).toBe('application/json');
  });

  it('keeps the body type when all content types agree on it', () => {
    const { ctx, pet } = setup();
    const endpoint = createEndpoint('same', {
      responses: [
        createResponse('200', {
          content: [
            { type: 'application/json', schema: pet },
            { type: 'application/xml', schema: pet },
          ],
        }),
      ],
    });

    const rendered = render(buildStrictResult(ctx, endpoint, { namespace }).record);

    expect(rendered).toContain('public static SameResult Ok(Pet body, string contentType = "application/json")');
  });

  it('types a body without a schema by its content type', () => {
    const { ctx } = setup();
    const endpoint = createEndpoint('raw', {
      responses: [
        createResponse('200', { content: [{ type: 'application/json' }] }),
        createResponse('201', { content: [{ type: 'application/octet-stream' }] }),
      ],
    });

    const rendered = render(buildStrictResult(ctx, endpoint, { namespace }).record);

    expect(rendered).toContain('public static RawResult Ok(JsonElement body)');
    expect(rendered).toContain('public static RawResult Created(Stream body)');
  });

  it('names unknown status codes after the code and keeps every name unique', () => {
    const { ctx } = setup();
    const endpoint = createEndpoint('odd', {
      responses: [createResponse('299'), createResponse('2XX'), createResponse('2xx')],
    });

    const { cases } = buildStrictResult(ctx, endpoint, { namespace });

    expect(cases.map((c) => c.factoryName)).toEqual(['Status299', 'Status2XX', 'Status2XX_2']);
  });

  it('omits a Content-Type header, which the content type of the body already covers', () => {
    const { ctx, text } = setup();
    const endpoint = createEndpoint('ct', {
      responses: [createResponse('200', { headers: [createHeader('Content-Type', text)] })],
    });

    expect(buildStrictResult(ctx, endpoint, { namespace }).cases[0].headers).toEqual([]);
  });

  it('honors a custom result name', () => {
    const { ctx } = setup();
    const endpoint = createEndpoint('getThing', { responses: [createResponse('204')] });

    const result = buildStrictResult(ctx, endpoint, { namespace, name: 'ThingOutcome' });

    expect(result.name).toBe('ThingOutcome');
    expect(render(result.record)).toContain('public sealed record NoContentResponse() : ThingOutcome;');
  });
});
