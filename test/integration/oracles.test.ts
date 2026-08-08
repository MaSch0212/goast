import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { diffRequest, formatDeviations, issueCase, startRefServer } from '@goast/test-harness';

import { cases } from '../cases/cases.ts';

/**
 * The contract proof.
 *
 * Both sides of this test are handwritten and share no code: `issueCase` builds a request from a
 * case, `startRefServer` parses it back. If they disagree, the case table is wrong or one oracle is,
 * and every deviation a *generated* client produces afterwards is unattributable. Nothing else in
 * tier 4 means anything until this passes.
 */
describe('reference client against reference server', () => {
  it('round-trips every case in the table with zero deviations', async () => {
    const server = await startRefServer(cases);
    try {
      for (const apiCase of cases) {
        const response = await issueCase(server.baseUrl, apiCase);
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
