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
    const apiCase: ApiCase = { ...base, method: 'get', expectRequest: { path: '/x/abc%20def' } };
    const server = await startRefServer([{ ...apiCase, pathTemplate: '/x/{id}' }]);
    try {
      const response = await issueCase(server.baseUrl, { ...apiCase, pathTemplate: '/x/{id}' });
      await response.body?.cancel();

      expect(server.recorded.get('x/ok')!.path).toBe('/x/abc%20def');
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
});
