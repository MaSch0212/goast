import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { diffRequest, formatDeviations, normalizeHeaders, parseQuery, readBody } from './wire.ts';

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
