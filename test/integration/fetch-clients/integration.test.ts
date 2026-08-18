import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import {
  type Deviation,
  diffRequest,
  diffResult,
  formatDeviations,
  startRefServer,
  verifyWireDeviations,
  wireRootDir,
  wireSnapshotFile,
} from '@goast/test-harness';

import { casesFor } from '../../cases/cases.ts';

const PROFILE = 'fetch-clients';

describe(`integration/${PROFILE}`, () => {
  it('drives every client case and records its deviations', async () => {
    const cases = casesFor(PROFILE, 'client');
    const server = await startRefServer(cases);

    let output: string;
    try {
      const command = new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '-A',
          '--check',
          '--unstable-sloppy-imports',
          new URL('./driver.ts', import.meta.url).pathname,
          server.baseUrl,
        ],
        stdout: 'piped',
        stderr: 'piped',
      });
      const result = await command.output();
      const stderr = new TextDecoder().decode(result.stderr);
      expect(result.code, `driver exited ${result.code}\n${stderr}`).toBe(0);
      output = new TextDecoder().decode(result.stdout);
    } finally {
      await server.close();
    }

    const lines = output.split('\n').filter((l) => l.trim() !== '')
      .map((line) => JSON.parse(line) as { caseId: string; result: unknown });
    const reported = new Map<string, unknown>();
    for (const { caseId, result } of lines) reported.set(caseId, result);

    // Drift protection: a forgotten case must fail loudly, not quietly shrink coverage.
    expect([...reported.keys()].sort()).toEqual(cases.map((c) => c.id).sort());

    // A `Map` keeps only the last result for a repeated id, and the key-set check above compares
    // *distinct* ids — so 20 lines covering 19 ids would pass it with one result silently discarded.
    // Comparing the line count against the map size is what makes a duplicated id loud.
    expect(lines.length, 'duplicate case id(s) in the driver output').toBe(reported.size);

    // Unlike the oracle round-trip (task 6), a *generated* client can send a request the reference
    // server's route pattern does not recognize at all — the untouched `UrlBuilder.build()` never
    // percent-encodes a path parameter, so a value containing `/` splits into an extra path segment
    // and the request lands in `server.surplus` (418) instead of the case's queue. That is a real,
    // attributable deviation, not a harness failure, so it is folded into the affected case's artifact
    // below rather than failing the whole run outright. What remains a hard failure is a surplus count
    // that does not match the number of cases nothing was recorded for — that combination means a
    // request went missing for a reason this loop cannot explain (a stray retry, a duplicate call), and
    // must not be silently absorbed into some other case's deviation text.
    const unmatchedCases = cases.filter((c) => !server.recorded.has(c.id));
    expect(server.surplus.length, 'unattributed surplus request(s) — see comment above').toBe(unmatchedCases.length);
    const surplusQueue = [...server.surplus];

    // Pairing `unmatchedCases` (walked below in `cases` table order) against `surplusQueue.shift()`
    // (server arrival order) is only correct because the two orders coincide: `driver.ts:9-12` documents
    // that the driver issues its calls in `casesFor('fetch-clients', 'client')` table order, so a request
    // that goes unmatched arrives at the server in the same relative order its case appears in `cases`.
    // Without that guarantee this loop could attribute one case's surplus request to a different case
    // entirely — exactly the "absorbed into some other case's deviation text" failure the comment above
    // rules out for the count, but not, on its own, for the pairing.
    for (const apiCase of cases) {
      const recorded = server.recorded.get(apiCase.id);
      let deviations: Deviation[];

      if (recorded !== undefined) {
        deviations = [
          ...diffRequest(apiCase.expectRequest, recorded),
          ...diffResult(apiCase.expectResult, reported.get(apiCase.id)),
        ];
      } else {
        const unmatched = surplusQueue.shift();
        deviations = unmatched === undefined
          ? [{
            field: 'request',
            expected: "one request matching this case's route",
            actual: 'no request received at all',
          }]
          : [
            {
              field: 'request',
              expected: "one request matching this case's route",
              actual: `${unmatched.method} ${unmatched.path} matched no route (server answered 418)`,
            },
            // A route mismatch is *one* thing wrong with a request that can be wrong in several ways at
            // once, so the rest of the request is compared here too rather than discarded. Measured, not
            // hypothetical: `getEncoded/ok` fails to encode the `/` inside its path parameter (the route
            // mismatch above) *and* emits `raw=a` + `b=c` where the case declares one `raw` value of
            // `a&b=c` — and the second deviation went unrecorded for as long as this branch reported only
            // the method and path. An absent deviation in a committed artifact reads as conformance, so
            // dropping the other dimensions understated what the client got wrong.
            //
            // `diffRequest` re-reports `path`, which the line above already names. That redundancy is the
            // cheap side of the trade: repeating one field in a diagnostic costs a reader nothing, whereas
            // omitting a field costs them the truth.
            ...diffRequest(apiCase.expectRequest, unmatched),
          ];
      }

      await verifyWireDeviations(wireSnapshotFile(wireRootDir, PROFILE, apiCase.id), formatDeviations(deviations));
    }
  });
});
