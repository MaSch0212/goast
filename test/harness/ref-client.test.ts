import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { ApiCase } from '../cases/types.ts';
import { buildQueryString, describeTransportFailure, issueCase } from './ref-client.ts';
import { startRefServer } from './ref-server.ts';

const base: ApiCase = {
  id: 'x/ok',
  operationId: 'x',
  method: 'post',
  pathTemplate: '/x',
  expectRequest: { path: '/x' },
  response: { status: 200, body: { ok: true } },
  expectResult: { ok: true },
  directions: ['server'],
};

/**
 * The encoder is unit-tested against raw bytes rather than only through `issueCase`, because the round
 * trip cannot see it: the reference server decodes what arrives, and both `+` and `%20` decode back to a
 * space, both `,` and `%2C` back to a comma. Every claim below is about what leaves the process, which is
 * the only thing a generated *server* parsing the raw wire can react to.
 */
describe('buildQueryString', () => {
  it('leaves a comma literal, because form/explode:false emits one as a sub-delimiter', () => {
    expect(buildQueryString({ formUnexploded: ['a,b'] })).toBe('formUnexploded=a,b');
  });

  it('encodes a space as %20, not as the form-encoding +', () => {
    // `style: spaceDelimited` specifies percent-encoding. `URLSearchParams`, which this replaced, wrote
    // `spaceDelimited=a+b` — a byte sequence no URL decoder is obliged to read as a space.
    expect(buildQueryString({ spaceDelimited: ['a b'] })).toBe('spaceDelimited=a%20b');
  });

  it('still encodes the characters that would otherwise restructure the query', () => {
    // `getEncoded/ok`'s value. An `&` or `=` surviving literally would split one parameter into two.
    expect(buildQueryString({ raw: ['a&b=c'] })).toBe('raw=a%26b%3Dc');
  });

  it('encodes the key the same way it encodes the value', () => {
    expect(buildQueryString({ 'a&k=y': ['v'] })).toBe('a%26k%3Dy=v');
  });

  it('repeats the key once per value, in declaration order', () => {
    expect(buildQueryString({ formExploded: ['a', 'b'], other: ['c'] }))
      .toBe('formExploded=a&formExploded=b&other=c');
  });

  it('renders an absent or empty query as the empty string, so the caller can omit the ?', () => {
    expect(buildQueryString(undefined)).toBe('');
    expect(buildQueryString({})).toBe('');
    expect(buildQueryString({ a: [] })).toBe('');
  });

  it('encodes a literal percent sign, so no substitution can be confused for one', () => {
    // The `%2C` -> `,` substitution is a plain string replace; this pins its premise that a literal `%`
    // in the input can never produce the substring it looks for.
    expect(buildQueryString({ v: ['a%2Cb'] })).toBe('v=a%252Cb');
  });
});

describe('issueCase', () => {
  it('sends the declared path, query, headers and JSON body verbatim', async () => {
    const apiCase: ApiCase = {
      ...base,
      expectRequest: {
        path: '/x',
        query: { tags: ['a', 'b'] },
        headers: { 'x-api-key': 'k' },
        body: { kind: 'json', value: { name: 'Rex' } },
      },
    };
    const server = await startRefServer([apiCase]);
    try {
      const response = await issueCase(server.baseUrl, apiCase);

      expect(response.status).toBe(200);
      await response.body?.cancel();
      const recorded = server.recorded.get('x/ok')!;
      expect(recorded.query).toEqual({ tags: ['a', 'b'] });
      expect(recorded.headers['x-api-key']).toBe('k');
      expect(recorded.body).toEqual({ kind: 'json', value: { name: 'Rex' } });
    } finally {
      await server.close();
    }
  });

  it('does not re-encode an already-encoded path', async () => {
    // `%2F` is the case that actually pins this: an implementation that ran `decodeURIComponent` over
    // the path before sending it would turn this into a raw `/`, which `fetch`'s URL parser then reads
    // as a path separator rather than re-encoding back to `%2F` — splitting one segment into two and
    // changing which route matches. A `%20` fixture does not catch that: a raw space gets percent-
    // encoded back to `%20` by the URL parser regardless, so the old fixture passed whether or not
    // `issueCase` decoded first.
    const apiCase: ApiCase = { ...base, method: 'get', expectRequest: { path: '/x/abc%2Fdef' } };
    const server = await startRefServer([{ ...apiCase, pathTemplate: '/x/{id}' }]);
    try {
      const response = await issueCase(server.baseUrl, { ...apiCase, pathTemplate: '/x/{id}' });
      await response.body?.cancel();

      expect(server.recorded.get('x/ok')!.path).toBe('/x/abc%2Fdef');
    } finally {
      await server.close();
    }
  });

  it('sends a form body as application/x-www-form-urlencoded', async () => {
    const apiCase: ApiCase = { ...base, expectRequest: { path: '/x', body: { kind: 'form', fields: { a: ['1'] } } } };
    const server = await startRefServer([apiCase]);
    try {
      const response = await issueCase(server.baseUrl, apiCase);
      await response.body?.cancel();

      expect(server.recorded.get('x/ok')!.body).toEqual({ kind: 'form', fields: { a: ['1'] } });
    } finally {
      await server.close();
    }
  });

  it('sends no body when the case declares kind: none', async () => {
    // Distinct from the other tests' `body: undefined`: this exercises `buildBody`'s explicit
    // `body.kind === 'none'` branch rather than its `body === undefined` one.
    const apiCase: ApiCase = { ...base, expectRequest: { path: '/x', body: { kind: 'none' } } };
    const server = await startRefServer([apiCase]);
    try {
      const response = await issueCase(server.baseUrl, apiCase);
      await response.body?.cancel();

      expect(server.recorded.get('x/ok')!.body).toEqual({ kind: 'none' });
    } finally {
      await server.close();
    }
  });

  it('prefers a case-declared content-type over the body kind default', async () => {
    // `addPetNote/text` in the real case table relies on exactly this: a `text/plain` body kind whose
    // default content-type happens to match its declared header, so this test uses a body kind whose
    // default does NOT match the declared header, to prove the declared one actually wins rather than
    // being silently overwritten.
    const apiCase: ApiCase = {
      ...base,
      expectRequest: {
        path: '/x',
        headers: { 'content-type': 'application/vnd.custom+json' },
        body: { kind: 'json', value: { name: 'Rex' } },
      },
    };
    const server = await startRefServer([apiCase]);
    try {
      const response = await issueCase(server.baseUrl, apiCase);
      await response.body?.cancel();

      expect(server.recorded.get('x/ok')!.headers['content-type']).toBe('application/vnd.custom+json');
    } finally {
      await server.close();
    }
  });
});

describe('describeTransportFailure', () => {
  // Deno's actual shape, captured against a container that destroyed the socket mid-request. The point
  // of the helper is that `error.message` here is only `fetch failed`.
  const denoShape = new TypeError('fetch failed', {
    cause: new Error(
      'error sending request from 127.0.0.1:62673 for http://127.0.0.1:62661/styles/a,b ' +
        '(127.0.0.1:62661): client error (SendRequest): connection closed before message completed',
    ),
  });

  it('keeps the cause text, which is the only part that says what failed', () => {
    expect(describeTransportFailure(denoShape)).toContain('connection closed before message completed');
  });

  it('is stable across runs that differ only in ephemeral ports', () => {
    const other = new TypeError('fetch failed', {
      cause: new Error(
        'error sending request from 127.0.0.1:51004 for http://127.0.0.1:50990/styles/a,b ' +
          '(127.0.0.1:50990): client error (SendRequest): connection closed before message completed',
      ),
    });

    // Not a tautology: the two inputs differ, and the assertion below proves it before comparing the
    // outputs. An earlier helper elsewhere in this repo compared a value with itself for a year.
    expect(other.cause).not.toEqual(denoShape.cause);
    expect(describeTransportFailure(other)).toEqual(describeTransportFailure(denoShape));
  });

  it('tells a destroyed socket apart from a server that was never there', () => {
    // Both are `TypeError: fetch failed`. Recording only the message would commit the same bytes for a
    // generated-code finding and for a harness fault.
    const refused = new TypeError('fetch failed', {
      cause: new Error('error sending request for url (http://127.0.0.1:1/x): connection refused'),
    });

    expect(describeTransportFailure(refused)).not.toEqual(describeTransportFailure(denoShape));
  });

  it('handles a thrown value that is not an Error', () => {
    expect(describeTransportFailure('boom')).toBe('boom');
  });
});
