import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import * as YAML from 'yaml';

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

  it('resolves every case to a real (operationId, method, pathTemplate) triple in the kitchen-sink spec', async () => {
    // The other direction from the test above: that spec coverage does not by itself prove a case's own
    // pathTemplate/method/operationId are correct. cases.ts:69-73 documents a case that once claimed a
    // pathTemplate the spec didn't actually declare that operation under, and still passed every other
    // check — the contract proof issues expectRequest verbatim, so a wrong pathTemplate still routes and
    // still round-trips, and the resulting deviation gets attributed to the generator instead of to the
    // table. This test is what would have caught that.
    const specText = await Deno.readTextFile(
      new URL('../specs/integration/kitchen-sink.yml', import.meta.url),
    );
    const spec = YAML.parse(specText) as { paths: Record<string, Record<string, { operationId?: string }>> };

    const unresolved = cases.filter((c) => {
      const operation = spec.paths[c.pathTemplate]?.[c.method];
      return operation?.operationId !== c.operationId;
    }).map((c) => c.id);

    expect(unresolved).toEqual([]);
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
