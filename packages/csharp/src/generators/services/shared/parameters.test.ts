import { describe, expect, it } from 'vitest';

import { cs } from '../../../ast/index.ts';
import {
  createContext,
  createEndpoint,
  createParameter,
  createSchema,
  modelType,
  render,
} from './endpoint.test-utils.ts';
import { getDefaultLiteral, getEndpointParameters, getHandlerMethod, type ParameterPlan } from './parameters.ts';

const options = { supportNamespace: 'OpenApi.Generated.Controllers' };

const string = createSchema('string');
const integer = createSchema('integer', { format: 'int32' });
const status = createSchema('string', { enum: ['available', 'sold'] });
const stringList = createSchema('array', { items: string });
const filter = createSchema('object');
const payload = createSchema('object');
const binary = createSchema('string', { format: 'binary' });
const binaryList = createSchema('array', { items: binary });

const ctx = createContext(
  new Map([
    [string, cs.refs.system.string() as never],
    [integer, cs.refs.system.int() as never],
    [status, modelType('PetStatus')],
    [stringList, cs.refs.system.iReadOnlyList([cs.refs.system.string()]) as never],
    [filter, modelType('Filter')],
    [payload, modelType('Payload')],
    [binary, cs.refs.system.stream() as never],
    [binaryList, cs.refs.system.iReadOnlyList([cs.refs.system.stream()]) as never],
  ]),
);

function plansOf(parameters: ReturnType<typeof createParameter>[], overrides: Record<string, unknown> = {}) {
  return getEndpointParameters(ctx, createEndpoint('op', { parameters, ...overrides }), options);
}

function bound(plan: ParameterPlan) {
  if (plan.binding.kind !== 'bound') throw new Error(`${plan.name} is not bound`);
  return plan.binding;
}

const type = (plan: ParameterPlan) => render(plan.type);
const actionType = (plan: ParameterPlan) => render(bound(plan).actionType);
const converted = (plan: ParameterPlan) => {
  const binding = plan.binding;
  const expression =
    binding.kind === 'request'
      ? binding.convert('Request', 'cancellationToken')
      : binding.convert?.(binding.actionName);
  return expression === undefined ? undefined : render(expression);
};

describe('getEndpointParameters', () => {
  describe('scalars the framework binds natively', () => {
    it('binds a required string as is', () => {
      const [plan] = plansOf([createParameter('name', 'query', string, { required: true })]);

      expect(plan.source).toBe('query');
      expect(plan.wireName).toBe('name');
      expect(type(plan)).toBe('string');
      expect(actionType(plan)).toBe('string');
      expect(bound(plan).convert).toBeNull();
      expect(plan.valueName).toBe('name');
    });

    it('makes an optional parameter nullable', () => {
      const [plan] = plansOf([createParameter('X-Header-Param', 'header', string)]);

      expect(plan.name).toBe('xHeaderParam');
      expect(plan.wireName).toBe('X-Header-Param');
      expect(type(plan)).toBe('string?');
      expect(bound(plan).convert).toBeNull();
    });

    it('binds a required value type as nullable and rejects a missing value', () => {
      const [plan] = plansOf([createParameter('limit', 'query', integer, { required: true })]);

      expect(type(plan)).toBe('int');
      expect(actionType(plan)).toBe('int?');
      expect(converted(plan)).toBe(
        'limit ?? throw new ApiRequestException("The query parameter \'limit\' is required.")',
      );
    });

    it('uses a default the schema has that C# can express as a constant', () => {
      const withDefault = createSchema('integer', { format: 'int32', default: 10 });
      const context = createContext(new Map([[withDefault, cs.refs.system.int() as never]]));

      const [plan] = getEndpointParameters(
        context,
        createEndpoint('op', { parameters: [createParameter('limit', 'query', withDefault)] }),
        options,
      );

      expect(type(plan)).toBe('int');
      expect(actionType(plan)).toBe('int?');
      expect(converted(plan)).toBe('limit ?? 10');
    });

    it('decodes the encoded slash ASP.NET Core leaves in a path segment', () => {
      const [plan] = plansOf([createParameter('id', 'path', string, { required: true })]);

      expect(actionType(plan)).toBe('string');
      expect(converted(plan)).toBe('ApiRequestSupport.DecodePathSegment(id)');
      expect(plan.valueName).toBe('idValue');
    });
  });

  describe('everything else is bound raw and converted from its wire form', () => {
    it('converts an enum by its wire name', () => {
      const [plan] = plansOf([createParameter('status', 'query', status)]);

      expect(type(plan)).toBe('PetStatus?');
      expect(actionType(plan)).toBe('string?');
      expect(converted(plan)).toBe('(PetStatus?)ApiRequestSupport.ParseValue(status, typeof(PetStatus))');
    });

    it('does not accept null for a required enum', () => {
      const [plan] = plansOf([createParameter('status', 'query', status, { required: true })]);

      expect(converted(plan)).toBe('(PetStatus)ApiRequestSupport.ParseValue(status, typeof(PetStatus))!');
    });

    it('binds an exploded form array from repeated keys', () => {
      const [plan] = plansOf([createParameter('tags', 'query', stringList, { style: 'form', explode: true })]);

      expect(actionType(plan)).toBe('string[]?');
      expect(converted(plan)).toBe('ApiRequestSupport.ParseList<string>(tags, false)');
    });

    it('splits a non-exploded array at the delimiter of its style', () => {
      const cases: [string, string][] = [
        ['form', ','],
        ['spaceDelimited', ' '],
        ['pipeDelimited', '|'],
      ];
      for (const [style, delimiter] of cases) {
        const [plan] = plansOf([createParameter('tags', 'query', stringList, { style, explode: false })]);

        expect(actionType(plan)).toBe('string?');
        expect(converted(plan)).toBe(`ApiRequestSupport.ParseDelimitedList<string>(tags, "${delimiter}")`);
      }
    });

    it('reads a simple-style path array', () => {
      const [plan] = plansOf([
        createParameter('values', 'path', stringList, { required: true, style: 'simple', explode: false }),
      ]);

      expect(type(plan)).toBe('IReadOnlyList<string>');
      expect(converted(plan)).toBe(
        'ApiRequestSupport.ParseDelimitedList<string>(ApiRequestSupport.DecodePathSegment(values), ",")!',
      );
    });

    it('reads label and matrix path arrays with their prefixes', () => {
      const label = plansOf([createParameter('values', 'path', stringList, { required: true, style: 'label' })])[0];
      const matrix = plansOf([
        createParameter('values', 'path', stringList, { required: true, style: 'matrix', explode: true }),
      ])[0];

      expect(converted(label)).toBe(
        'ApiRequestSupport.ParsePathList<string>(ApiRequestSupport.DecodePathSegment(values), "label", false, "values")!',
      );
      expect(converted(matrix)).toBe(
        'ApiRequestSupport.ParsePathList<string>(ApiRequestSupport.DecodePathSegment(values), "matrix", true, "values")!',
      );
    });

    it('reads a cookie from the request', () => {
      const [plan] = plansOf([createParameter('session', 'cookie', string)]);

      expect(plan.binding.kind).toBe('request');
      expect(converted(plan)).toBe('(string?)ApiRequestSupport.ParseValue(Request.Cookies["session"], typeof(string))');
    });

    it('rejects a request that lacks a required cookie, cookie list or query object', () => {
      const [cookie, list, object] = plansOf([
        createParameter('session', 'cookie', string, { required: true }),
        createParameter('ids', 'cookie', stringList, { required: true }),
        createParameter('filter', 'query', filter, { required: true, style: 'deepObject', explode: true }),
      ]);
      const missing = (name: string) =>
        `throw new ApiRequestException("The ${name.split(':')[0]} parameter '${name.split(':')[1]}' is required.")`;

      expect(converted(cookie)).toBe(
        `(string)(ApiRequestSupport.ParseValue(Request.Cookies["session"], typeof(string)) ?? ${missing('cookie:session')})`,
      );
      expect(converted(list)).toContain(`?? ${missing('cookie:ids')})`);
      expect(converted(list)).not.toContain('!');
      expect(converted(object)).toBe(
        `(Filter)(ApiRequestSupport.ReadQueryObject(Request, typeof(Filter), "filter", "deepObject", true) ?? ${missing('query:filter')})`,
      );
    });

    it('assembles an object of the query string from its style', () => {
      const [plan] = plansOf([createParameter('filter', 'query', filter, { style: 'deepObject', explode: true })]);

      expect(plan.binding.kind).toBe('request');
      expect(converted(plan)).toBe(
        '(Filter?)ApiRequestSupport.ReadQueryObject(Request, typeof(Filter), "filter", "deepObject", true)',
      );
    });
  });

  describe('request bodies', () => {
    const jsonBody = (required: boolean) => ({
      requestBody: { required, description: 'The payload.', content: [{ type: 'application/json', schema: payload }] },
    });

    it('reads a required body from the request', () => {
      const [plan] = plansOf([], jsonBody(true));

      expect(plan.source).toBe('body');
      expect(plan.name).toBe('body');
      expect(plan.description).toBe('The payload.');
      expect(type(plan)).toBe('Payload');
      expect(converted(plan)).toBe(
        '(Payload)(await ApiRequestSupport.ReadBodyAsync(Request, typeof(Payload), true, cancellationToken))!',
      );
    });

    it('makes an optional body nullable', () => {
      const [plan] = plansOf([], jsonBody(false));

      expect(type(plan)).toBe('Payload?');
      expect(converted(plan)).toBe(
        '(Payload?)(await ApiRequestSupport.ReadBodyAsync(Request, typeof(Payload), false, cancellationToken))',
      );
    });

    it('binds the parts of a multipart body one by one', () => {
      const multipart = createSchema('object', {
        required: new Set(['file']),
        properties: new Map([
          ['file', { name: 'file', schema: binary }],
          ['attachments', { name: 'attachments', schema: binaryList }],
          ['caption', { name: 'caption', schema: string }],
        ]),
        allOf: [],
        anyOf: [],
      });
      const plans = plansOf([], {
        requestBody: { required: true, content: [{ type: 'multipart/form-data', schema: multipart }] },
      });

      expect(plans.map((p) => [p.name, p.source, p.wireName, p.isFile])).toEqual([
        ['file', 'form', 'file', true],
        ['attachments', 'form', 'attachments', true],
        ['caption', 'form', 'caption', false],
      ]);
      expect(plans.map((p) => type(p))).toEqual(['IFormFile', 'IFormFileCollection?', 'string?']);
      expect(actionType(plans[0])).toBe('IFormFile');
      expect(bound(plans[0]).convert).toBeNull();
      expect(actionType(plans[1])).toBe('IFormFileCollection?');
      expect(bound(plans[1]).convert).toBeNull();
      expect(bound(plans[2]).convert).toBeNull();
    });
  });

  it('ignores the headers the spec says a framework sets', () => {
    const plans = plansOf([
      createParameter('Authorization', 'header', string),
      createParameter('Accept', 'header', string),
      createParameter('Content-Type', 'header', string),
      createParameter('X-Other', 'header', string),
    ]);

    expect(plans.map((p) => p.wireName)).toEqual(['X-Other']);
  });

  it('keeps the names of the handler parameters unique and clear of the cancellation token', () => {
    const plans = plansOf(
      [
        createParameter('id', 'path', string, { required: true }),
        createParameter('id', 'query', string),
        createParameter('cancellationToken', 'query', string),
        createParameter('class', 'query', string),
      ],
      {},
    );

    expect(plans.map((p) => p.name)).toEqual(['id', 'id_2', 'cancellationToken_2', '@class']);
  });
});

describe('getHandlerMethod', () => {
  it('declares an abstract method that returns the result and takes a cancellation token last', () => {
    const plans = plansOf([createParameter('id', 'path', string, { required: true, description: 'The id.' })]);

    const method = getHandlerMethod('GetThingAsync', plans, cs.reference('GetThingResult'), {
      doc: 'Gets a thing.',
      accessModifier: 'protected',
    });

    expect(render(method)).toBe(
      [
        '/// <summary>',
        '/// Gets a thing.',
        '/// </summary>',
        '/// <param name="id">The id.</param>',
        '/// <param name="cancellationToken">Signals that the request was aborted.</param>',
        'protected abstract Task<GetThingResult> GetThingAsync(string id, CancellationToken cancellationToken);',
        '',
      ].join('\n'),
    );
  });
});

describe('getDefaultLiteral', () => {
  const literal = (schema: ReturnType<typeof createSchema>, ref: cs.Reference<never>) =>
    getDefaultLiteral(schema, ref as never);

  it('writes the defaults of the plain scalar types', () => {
    expect(literal(createSchema('string', { default: 'a"b' }), cs.refs.system.string() as never)).toBe('"a\\"b"');
    expect(literal(createSchema('boolean', { default: true }), cs.refs.system.bool() as never)).toBe('true');
    expect(literal(createSchema('integer', { default: 5 }), cs.refs.system.int() as never)).toBe('5');
    expect(literal(createSchema('integer', { default: 5 }), cs.refs.system.long() as never)).toBe('5L');
    expect(literal(createSchema('number', { default: 1.5 }), cs.refs.system.float() as never)).toBe('1.5f');
    expect(literal(createSchema('number', { default: 1.5 }), cs.refs.system.double() as never)).toBe('1.5d');
    expect(literal(createSchema('number', { default: 1.5 }), cs.refs.system.decimal() as never)).toBe('1.5m');
  });

  it('writes nothing for types other than the plain scalars, enums and out-of-range numbers', () => {
    expect(literal(createSchema('string', { default: 'x' }), modelType('Other'))).toBeUndefined();
    expect(
      literal(createSchema('string', { default: 'x', enum: ['x'] }), cs.refs.system.string() as never),
    ).toBeUndefined();
    expect(literal(createSchema('integer', { default: 2 ** 40 }), cs.refs.system.int() as never)).toBeUndefined();
    expect(literal(createSchema('string'), cs.refs.system.string() as never)).toBeUndefined();
    expect(literal(createSchema('string', { default: 5 }), cs.refs.system.string() as never)).toBeUndefined();
  });
});
