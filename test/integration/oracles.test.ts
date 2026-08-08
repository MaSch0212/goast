import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { diffRequest, formatDeviations, issueCase, startRefServer } from '@goast/test-harness';

import { cases } from '../cases/cases.ts';

/**
 * The contract proof.
 *
 * Both sides of this test are handwritten and share no code: `issueCase` builds a request from a
 * case, `startRefServer` parses it back. If they disagree, the case table is wrong or one oracle is,
 * and every deviation a *generated* client produces afterwards is unattributable.
 *
 * **What this proves.** For every one of the 19 cases: that the declared `expectRequest` is
 * representable on the wire at all; that what arrives is recovered byte-for-byte identical to what
 * was sent (so `buildBody` in `ref-client.ts` and `readBody` in `wire.ts` are inverses of each other
 * for every body kind the table uses — json, form, multipart, text, and binary); and that the request
 * is attributed to the correct case id, in table order, including the two cases sharing one
 * `PUT /pets/{id}` queue.
 *
 * **What this does NOT prove.** It does not prove any case matches the kitchen-sink spec —
 * `issueCase` issues `expectRequest` verbatim, so the expected and actual values it round-trips come
 * from the same object, and mutating a case's path, a query value, a header value, or body content
 * would still pass here. Only Task 7, which drives a *generated* client against these same cases,
 * checks the table against something independent. Nor does it prove header parity beyond what a case
 * declares: `diffRequest` compares only headers the expectation names, so an undeclared header is
 * invisible by design, and 11 of the 19 cases declare no headers at all. And `diffRequest` never
 * compares the HTTP method — a case issued with the wrong verb does not surface as a method deviation,
 * only as "the server never matched a request for this case" plus an extra entry in `server.surplus`
 * (the request that its intended queue never got, waiting under some other route or none).
 */
describe('reference client against reference server', () => {
  it('round-trips every case in the table with zero deviations', async () => {
    const server = await startRefServer(cases);
    try {
      for (const apiCase of cases) {
        const response = await issueCase(server.baseUrl, apiCase);
        // Converts two failure modes that would otherwise surface only as "never matched" (a wrong
        // HTTP verb, or a path the server's route pattern can no longer match after decoding) into a
        // direct, per-case diagnostic instead.
        expect(response.status).toBe(apiCase.response.status);
        await response.body?.cancel();
      }

      const problems: string[] = [];
      for (const apiCase of cases) {
        const recorded = server.recorded.get(apiCase.id);
        if (recorded === undefined) {
          problems.push(`${apiCase.id}\n  the server never matched a request for this case\n`);
          continue;
        }
        const deviations = diffRequest(apiCase.expectRequest, recorded);
        if (deviations.length > 0) problems.push(`${apiCase.id}\n${formatDeviations(deviations)}`);
      }

      expect(problems.join('')).toBe('');
      expect(server.surplus).toEqual([]);
    } finally {
      await server.close();
    }
  });
});
