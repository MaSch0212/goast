import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { RecordedResponse } from '../cases/types.ts';
import {
  diffRequest,
  diffResponse,
  diffResult,
  formatDeviations,
  IGNORED_HEADERS,
  normalizeHeaders,
  parseQuery,
  readBody,
  readResponse,
} from './wire.ts';

describe('IGNORED_HEADERS', () => {
  it('ignores the incidental transport headers', () => {
    expect(IGNORED_HEADERS.has('host')).toBe(true);
    expect(IGNORED_HEADERS.has('user-agent')).toBe(true);
    expect(IGNORED_HEADERS.has('accept-encoding')).toBe(true);
    expect(IGNORED_HEADERS.has('content-length')).toBe(true);
    expect(IGNORED_HEADERS.has('connection')).toBe(true);
  });

  it('does not ignore headers a generator controls', () => {
    expect(IGNORED_HEADERS.has('content-type')).toBe(false);
    expect(IGNORED_HEADERS.has('authorization')).toBe(false);
  });
});

describe('normalizeHeaders', () => {
  it('lower-cases names and drops the incidental ones', () => {
    const headers = new Headers({
      'X-Request-Id': 'r1',
      'Host': 'localhost:8080',
      'User-Agent': 'Deno',
      'Accept-Encoding': 'gzip',
      'Content-Length': '12',
    });

    expect(normalizeHeaders(headers)).toEqual({ 'x-request-id': 'r1' });
  });
});

describe('parseQuery', () => {
  it('collects a repeated key into one array, preserving value order', () => {
    expect(parseQuery(new URL('http://x/p?tags=a&tags=b&q=1'))).toEqual({ tags: ['a', 'b'], q: ['1'] });
  });

  it('keeps an unexploded comma-joined value as a single element', () => {
    expect(parseQuery(new URL('http://x/p?tags=a,b'))).toEqual({ tags: ['a,b'] });
  });
});

describe('readBody', () => {
  it('parses a JSON body structurally', async () => {
    const request = new Request('http://x/p', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"b":2,"a":1}',
    });

    expect(await readBody(request)).toEqual({ kind: 'json', value: { a: 1, b: 2 } });
  });

  it('reports no body for a bodyless request', async () => {
    expect(await readBody(new Request('http://x/p'))).toEqual({ kind: 'none' });
  });

  it('parses a multipart body into named parts', async () => {
    const form = new FormData();
    form.append('name', 'Rex');
    form.append('photo', new File(['data'], 'p.txt', { type: 'text/plain' }));
    const request = new Request('http://x/p', { method: 'POST', body: form });

    const body = await readBody(request);

    expect(body.kind).toBe('multipart');
    expect(body.kind === 'multipart' && body.parts).toEqual([
      { name: 'name', value: 'Rex' },
      { name: 'photo', filename: 'p.txt', contentType: 'text/plain', value: 'data' },
    ]);
  });

  it('parses a form-urlencoded body into a multi-map', async () => {
    const request = new Request('http://x/p', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'name=Rex&tag=a&tag=b',
    });

    expect(await readBody(request)).toEqual({ kind: 'form', fields: { name: ['Rex'], tag: ['a', 'b'] } });
  });

  it('reads a text/plain body verbatim', async () => {
    const request = new Request('http://x/p', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'plain text body',
    });

    expect(await readBody(request)).toEqual({ kind: 'text', value: 'plain text body' });
  });

  it('base64-encodes a body whose content type is none of the above', async () => {
    const request = new Request('http://x/p', {
      method: 'POST',
      headers: { 'content-type': 'application/octet-stream' },
      body: new Uint8Array([104, 101, 108, 108, 111]), // "hello"
    });

    expect(await readBody(request)).toEqual({ kind: 'binary', base64: 'aGVsbG8=' });
  });
});

describe('diffRequest', () => {
  const actual = {
    method: 'get' as const,
    path: '/pets/abc def',
    query: { tags: ['a,b'] },
    headers: {},
    body: { kind: 'none' as const },
  };

  it('reports the path and the query separately', () => {
    const deviations = diffRequest({ path: '/pets/abc%20def', query: { tags: ['a', 'b'] } }, actual);

    expect(deviations.map((d) => d.field)).toEqual(['path', 'query.tags']);
  });

  it('reports nothing when the request matches', () => {
    expect(diffRequest({ path: '/pets/abc def', query: { tags: ['a,b'] } }, actual)).toEqual([]);
  });

  it('ignores a header the expectation does not mention', () => {
    const withHeader = { ...actual, headers: { 'x-trace': 't' } };

    expect(diffRequest({ path: '/pets/abc def', query: { tags: ['a,b'] } }, withHeader)).toEqual([]);
  });

  it('reports a query parameter the expectation does not declare, unlike a header', () => {
    const withQuery = { ...actual, query: { extra: ['x'] } };

    expect(diffRequest({ path: '/pets/abc def' }, withQuery)).toEqual([
      { field: 'query.extra', expected: 'undefined', actual: '["x"]' },
    ]);
  });

  it('reports a body the expectation does not declare, unlike a header', () => {
    const withBody = { ...actual, query: {}, body: { kind: 'text' as const, value: 'surprise' } };

    expect(diffRequest({ path: '/pets/abc def' }, withBody)).toEqual([
      { field: 'body', expected: '{"kind":"none"}', actual: '{"kind":"text","value":"surprise"}' },
    ]);
  });
});

describe('readResponse', () => {
  it('parses a json body and lower-cases headers', async () => {
    const response = new Response(JSON.stringify({ id: 'abc' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Rate-Limit': '42' },
    });

    expect(await readResponse(response)).toEqual({
      status: 200,
      headers: { 'content-type': 'application/json', 'x-rate-limit': '42' },
      body: { kind: 'json', value: { id: 'abc' } },
    });
  });

  it('reports a bodyless response as kind none', async () => {
    expect((await readResponse(new Response(null, { status: 204 }))).body).toEqual({ kind: 'none' });
  });

  it('reports a text body as kind text', async () => {
    const response = new Response('MISMATCH getPet.id expected <abc> but was <xyz>', {
      status: 599,
      headers: { 'content-type': 'text/plain' },
    });

    expect((await readResponse(response)).body).toEqual({
      kind: 'text',
      value: 'MISMATCH getPet.id expected <abc> but was <xyz>',
    });
  });
});

describe('diffResponse', () => {
  const recorded = (over: Partial<RecordedResponse> = {}): RecordedResponse => ({
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: { kind: 'json', value: { id: 'abc' } },
    ...over,
  });

  it('finds nothing when status, declared headers and body all match', () => {
    const expected = { status: 200, headers: { 'content-type': 'application/json' }, body: { id: 'abc' } };
    expect(diffResponse(expected, recorded())).toEqual([]);
  });

  it('reports a status deviation', () => {
    const expected = { status: 200, body: { id: 'abc' } };
    expect(diffResponse(expected, recorded({ status: 599 }))).toEqual([
      { field: 'status', expected: '200', actual: '599' },
    ]);
  });

  it('reports a declared header that is absent', () => {
    const expected = { status: 200, headers: { 'x-rate-limit': '42' }, body: { id: 'abc' } };
    expect(diffResponse(expected, recorded())).toEqual([
      { field: 'header.x-rate-limit', expected: '42', actual: '<absent>' },
    ]);
  });

  it('ignores an undeclared header the runtime added', () => {
    const expected = { status: 200, body: { id: 'abc' } };
    expect(diffResponse(expected, recorded({ headers: { date: 'Sat, 09 Aug 2026 00:00:00 GMT' } }))).toEqual([]);
  });

  // The whole point of comparing the body unconditionally: an extra property in the response is a
  // deviation even though the case's `response` never mentions it. This is the shape the generated
  // server is expected to produce for every `Pet`-bodied case (every unset optional field as an
  // explicit `null`), so a conditional comparison would make this phase blind to its own main finding.
  it('reports an extra property in the body', () => {
    const expected = { status: 200, body: { id: 'abc' } };
    const deviations = diffResponse(expected, recorded({ body: { kind: 'json', value: { id: 'abc', age: null } } }));
    expect(deviations).toEqual([
      {
        field: 'body',
        expected: '{"kind":"json","value":{"id":"abc"}}',
        actual: '{"kind":"json","value":{"age":null,"id":"abc"}}',
      },
    ]);
  });

  it('reports a body on a response the case declares none for', () => {
    const expected = { status: 204 };
    const deviations = diffResponse(expected, recorded({ status: 204, body: { kind: 'json', value: {} } }));
    expect(deviations).toEqual([
      { field: 'body', expected: '{"kind":"none"}', actual: '{"kind":"json","value":{}}' },
    ]);
  });

  it('reports a body that arrived as text where json was declared', () => {
    const expected = { status: 200, body: { id: 'abc' } };
    const deviations = diffResponse(expected, recorded({ body: { kind: 'text', value: 'nope' } }));
    expect(deviations).toEqual([
      { field: 'body', expected: '{"kind":"json","value":{"id":"abc"}}', actual: '{"kind":"text","value":"nope"}' },
    ]);
  });
});

describe('diffResult', () => {
  it('reports nothing when the result matches, regardless of key order', () => {
    expect(diffResult({ id: 'abc', name: 'Rex' }, { name: 'Rex', id: 'abc' })).toEqual([]);
  });

  it('reports a deviation when the actual result is missing an expected field', () => {
    expect(diffResult({ id: 'abc', name: 'Rex' }, { id: 'abc' })).toEqual([
      { field: 'result', expected: '{"id":"abc","name":"Rex"}', actual: '{"id":"abc"}' },
    ]);
  });

  it('reports a deviation when the actual result has an unexpected extra field', () => {
    expect(diffResult({ id: 'abc' }, { id: 'abc', name: 'Rex' })).toEqual([
      { field: 'result', expected: '{"id":"abc"}', actual: '{"id":"abc","name":"Rex"}' },
    ]);
  });

  it('reports a deviation when a shared field has a different value', () => {
    expect(diffResult({ id: 'abc' }, { id: 'xyz' })).toEqual([
      { field: 'result', expected: '{"id":"abc"}', actual: '{"id":"xyz"}' },
    ]);
  });
});

describe('formatDeviations', () => {
  it('renders one stanza per deviation, in the order given', () => {
    const text = formatDeviations([
      { field: 'path', expected: '/a', actual: '/b' },
      { field: 'query.tags', expected: '["a","b"]', actual: '["a,b"]' },
    ]);

    expect(text).toBe(
      'path\n' +
        '  expected /a\n' +
        '  actual   /b\n' +
        'query.tags\n' +
        '  expected ["a","b"]\n' +
        '  actual   ["a,b"]\n',
    );
  });
});
