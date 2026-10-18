/**
 * Tier 4's `go-clients` case loop: runs the handwritten driver, which calls the generated kitchen-sink clients
 * for every client case, against the reference server, and commits one deviation artifact per case that misbehaves.
 *
 * Model: `test/integration/kotlin-clients/integration.test.ts`. Same direction: a generated client driven against
 * `startRefServer` and compared with `diffRequest` and `diffResult`. The driver runs in a container that reaches
 * the host through `host.docker.internal`, and its case lines are asserted after the run.
 */
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildImage,
  type Deviation,
  diffRequest,
  diffResult,
  formatDeviations,
  repoRootDir,
  requireDocker,
  runContainer,
  startRefServer,
  verifyWireDeviations,
  wireRootDir,
  wireSnapshotFile,
} from '@goast/test-harness';

import { casesFor } from '../../cases/cases.ts';
import { attributeSurplus } from '../attribute-surplus.ts';
import { CASE_LINE_PREFIX, parseCaseLines } from '../case-lines.ts';
import { buildCommand, DRIVER_DIR, DRIVER_MOUNT, PROFILE, TREE_DIR, TREE_MOUNT } from './build.ts';

/** Same gate as tier 4's other Docker legs. `pnpm test:integration:go-clients` sets this. */
const enabled = (process.env.GOAST_INTEGRATION ?? '') !== '';

/** The tier-3 image: Go and a warm standard-library build cache, which is all the driver needs. */
const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'go');

// Checked once, before the first container: a missing daemon should fail immediately.
if (enabled) await requireDocker();

describe.skipIf(!enabled)(`integration/${PROFILE}`, () => {
  it('drives every client case and records its deviations', async () => {
    const cases = casesFor(PROFILE, 'client');
    // `0.0.0.0`, not loopback: the driver runs inside a container and reaches the server through
    // `host.docker.internal`, which only routes to an interface the host actually bound.
    const server = await startRefServer(cases, { hostname: '0.0.0.0' });

    let output: string;
    try {
      const image = await buildImage('go', CONTEXT_DIR);
      const result = await runContainer({
        image,
        entrypoint: 'sh',
        args: ['-c', buildCommand()],
        mounts: [
          { source: TREE_DIR, target: TREE_MOUNT, readOnly: true },
          { source: DRIVER_DIR, target: DRIVER_MOUNT, readOnly: true },
        ],
        env: { GOAST_BASE_URL: `http://host.docker.internal:${server.port}` },
        hostGateway: true,
      });

      // A killed run's output is whatever happened to flush before the signal landed.
      if (result.timedOut) {
        throw new Error(
          `The ${PROFILE} driver timed out. Its output cannot be trusted as a complete result.\n\n${result.stdout}${result.stderr}`,
        );
      }
      expect(result.code, `driver container exited ${result.code}\n${result.stdout}\n${result.stderr}`).toBe(0);
      output = result.stdout + result.stderr;
    } finally {
      await server.close();
    }

    const lines = parseCaseLines(output);
    const reported = new Map<string, unknown>();
    for (const { caseId, result } of lines) reported.set(caseId, result);

    // A duplicated id would be silently collapsed by the `Map`, so the sizes are compared.
    expect(lines.length, `duplicate ${CASE_LINE_PREFIX} case id(s)`).toBe(reported.size);

    // Drift protection: a forgotten case must fail loudly, not quietly shrink coverage.
    expect([...reported.keys()].sort(), `no ${CASE_LINE_PREFIX} line for one or more cases`).toEqual(
      cases.map((c) => c.id).sort(),
    );

    // A call can fail before it reaches the network, so unmatched cases are attributed to surplus requests by
    // route shape, as in the Kotlin leg.
    const unmatchedCases = cases.filter((c) => !server.recorded.has(c.id));
    const surplusQueue = [...server.surplus];
    const attributedSurplus = attributeSurplus(unmatchedCases, surplusQueue);

    // Whatever is left matches no unmatched case's route at all: a stray retry or a duplicate call.
    expect(
      surplusQueue.map((req) => `${req.method} ${req.path}`),
      "surplus request(s) matching no unmatched case's route",
    ).toEqual([]);

    for (const apiCase of cases) {
      const recorded = server.recorded.get(apiCase.id);
      let deviations: Deviation[];

      if (recorded !== undefined) {
        deviations = [
          ...diffRequest(apiCase.expectRequest, recorded),
          ...diffResult(apiCase.expectResult, reported.get(apiCase.id)),
        ];
      } else {
        const surplus = attributedSurplus.get(apiCase.id);
        deviations =
          surplus === undefined
            ? [
                {
                  field: 'request',
                  expected: "one request matching this case's route",
                  actual: `no request received at all (driver reported ${JSON.stringify(reported.get(apiCase.id))})`,
                },
              ]
            : [
                {
                  field: 'request',
                  expected: "one request matching this case's route",
                  actual: `${surplus.method} ${surplus.path} matched no route (server answered 418)`,
                },
                // The rest of the request is compared too: a route mismatch is one of several things that can be
                // wrong with it, and an absent deviation in a committed artifact reads as conformance.
                ...diffRequest(apiCase.expectRequest, surplus),
              ];
      }

      await verifyWireDeviations(wireSnapshotFile(wireRootDir, PROFILE, apiCase.id), formatDeviations(deviations), {
        updateCommand: 'pnpm test:integration:go-clients',
      });
    }
  });
});
