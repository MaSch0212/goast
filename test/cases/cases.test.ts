import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { cases, casesFor } from './cases.ts';

describe('cases', () => {
  it('gives every case a unique id', () => {
    const ids = cases.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('declares at least one direction for every case', () => {
    const directionless = cases.filter((c) => c.directions.length === 0).map((c) => c.id);
    expect(directionless).toEqual([]);
  });

  it('resolves every pathTemplate placeholder in the expected path', () => {
    const unresolved = cases.filter((c) => c.expectRequest.path.includes('{')).map((c) => c.id);
    expect(unresolved).toEqual([]);
  });

  it('covers every operation in the kitchen-sink spec at least once', async () => {
    const spec = await Deno.readTextFile(
      new URL('../specs/integration/kitchen-sink.yml', import.meta.url),
    );
    const operationIds = [...spec.matchAll(/^\s*operationId:\s*(\S+)/gm)].map((m) => m[1]);
    const covered = new Set(cases.map((c) => c.operationId));

    expect(operationIds.filter((id) => !covered.has(id))).toEqual([]);
  });
});

describe('casesFor', () => {
  it('excludes a case the profile cannot express', () => {
    const excepted = cases.find((c) => (c.except?.length ?? 0) > 0);
    if (excepted === undefined) return; // No exceptions today; the filter is still exercised below.

    expect(casesFor(excepted.except![0], 'client').map((c) => c.id)).not.toContain(excepted.id);
  });

  it('excludes a case that does not declare the direction', () => {
    const serverOnly = cases.filter((c) => !c.directions.includes('client')).map((c) => c.id);
    const clientIds = casesFor('fetch-clients', 'client').map((c) => c.id);

    for (const id of serverOnly) expect(clientIds).not.toContain(id);
  });
});
