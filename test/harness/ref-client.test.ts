import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { ApiCase } from '../cases/types.ts';
import { issueCase } from './ref-client.ts';
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
