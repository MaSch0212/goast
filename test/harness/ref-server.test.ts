import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { ApiCase } from '../cases/types.ts';
import { startRefServer } from './ref-server.ts';

/** Reads and discards a response body so an unconsumed `ReadableStream` never trips Deno's leak
 * sanitizer, then hands back the status the test actually cares about. */
const drainStatus = async (response: Promise<Response>): Promise<number> => {
  const r = await response;
  await r.body?.cancel();
  return r.status;
};

const petCase = (id: string, status: number): ApiCase => ({
  id,
  operationId: 'getPet',
  method: 'get',
  pathTemplate: '/pets/{id}',
  expectRequest: { path: '/pets/x' },
  response: { status, headers: { 'content-type': 'application/json' }, body: { id } },
  expectResult: { id },
  directions: ['client'],
});

describe('startRefServer', () => {
  it('serves a case response and records the request that fetched it', async () => {
    const server = await startRefServer([petCase('getPet/ok', 200)]);
    try {
      const response = await fetch(`${server.baseUrl}/pets/x?q=1`, { headers: { 'x-trace': 't' } });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ id: 'getPet/ok' });

      const recorded = server.recorded.get('getPet/ok')!;
      expect(recorded.path).toBe('/pets/x');
      expect(recorded.query).toEqual({ q: ['1'] });
      expect(recorded.headers['x-trace']).toBe('t');
    } finally {
      await server.close();
    }
  });

  it('pops cases in table order within one endpoint', async () => {
    const server = await startRefServer([petCase('getPet/ok', 200), petCase('getPet/missing', 404)]);
    try {
      expect(await drainStatus(fetch(`${server.baseUrl}/pets/x`))).toBe(200);
      expect(await drainStatus(fetch(`${server.baseUrl}/pets/x`))).toBe(404);
    } finally {
      await server.close();
    }
  });

  it('attributes each recorded request to the correct case id within a shared queue', async () => {
    const server = await startRefServer([petCase('getPet/first', 200), petCase('getPet/second', 200)]);
    try {
      await drainStatus(fetch(`${server.baseUrl}/pets/x`, { headers: { 'x-request': 'first' } }));
      await drainStatus(fetch(`${server.baseUrl}/pets/x`, { headers: { 'x-request': 'second' } }));

      expect(server.recorded.get('getPet/first')!.headers['x-request']).toBe('first');
      expect(server.recorded.get('getPet/second')!.headers['x-request']).toBe('second');
    } finally {
      await server.close();
    }
  });

  it('routes by path template, so two endpoints do not share a queue', async () => {
    const other: ApiCase = { ...petCase('listPets/ok', 200), pathTemplate: '/pets', expectRequest: { path: '/pets' } };
    const server = await startRefServer([petCase('getPet/ok', 200), other]);
    try {
      expect(await drainStatus(fetch(`${server.baseUrl}/pets`))).toBe(200);
      expect(server.recorded.has('listPets/ok')).toBe(true);
      expect(server.recorded.has('getPet/ok')).toBe(false);
    } finally {
      await server.close();
    }
  });

  it('buckets an unmatched request as surplus instead of desynchronizing the queue', async () => {
    const server = await startRefServer([petCase('getPet/ok', 200)]);
    try {
      expect(await drainStatus(fetch(`${server.baseUrl}/unknown`))).toBe(418);

      expect(await drainStatus(fetch(`${server.baseUrl}/pets/x`))).toBe(200);
      expect(server.surplus).toHaveLength(1);
      expect(server.surplus[0].path).toBe('/unknown');
    } finally {
      await server.close();
    }
  });

  it('buckets an extra request to a drained endpoint as surplus', async () => {
    const server = await startRefServer([petCase('getPet/ok', 200)]);
    try {
      await drainStatus(fetch(`${server.baseUrl}/pets/x`));
      const extraStatus = await drainStatus(fetch(`${server.baseUrl}/pets/x`));

      expect(extraStatus).toBe(418);
      expect(server.surplus).toHaveLength(1);
    } finally {
      await server.close();
    }
  });
});
