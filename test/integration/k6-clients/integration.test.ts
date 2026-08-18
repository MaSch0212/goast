/**
 * Tier 4's `k6-clients` leg.
 *
 * Unlike every other leg, this one drives no cases. Two independent generator defects (55 and 56 in the
 * register) stop the generated client from loading in k6 at all, so there is nothing to compare against the
 * reference server — see `test/integration/targets.ts`'s `k6-clients` entry and
 * `test/harness/integration/target-state.ts` for why that is recorded as a target-level state rather than left
 * to be inferred from 19 absent per-case artifacts.
 *
 * This leg's whole job is to run the smallest possible k6 script against the committed tree and record whether
 * it loaded.
 */
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import {
  buildImage,
  repoRootDir,
  requireDocker,
  runContainer,
  targetFailureFile,
  verifyTargetLoadFailure,
  wireRootDir,
} from '@goast/test-harness';

import { formatLoadFailure } from './format-load-failure.ts';

/** Same gate as tier 4's other Docker legs: `deno task test` must never start a container on its own. */
const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';

/** The generator profile this leg drives. */
const PROFILE = 'k6-clients';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'k6');

/**
 * Host path mounted read-only at `/tree` — the profile's kitchen-sink directory, not `test/output/` as a whole,
 * for the same reason `angular-services/build.ts` mounts its own tree that way: `probe.js` imports
 * `/tree/clients/pets-client.js` directly.
 */
const TREE_DIR = join(repoRootDir, 'test', 'output', 'typescript', PROFILE, 'integration', 'kitchen-sink');

/** Host path mounted read-only at `/scripts`, holding `probe.js`. */
const SCRIPTS_DIR = join(repoRootDir, 'test', 'integration', PROFILE);

if (enabled) await requireDocker();

if (enabled) {
  describe(`integration/${PROFILE}`, () => {
    it('records whether k6 can load the generated client', async () => {
      // The generated file `probe.js` imports must exist on the host before the container runs, and this is not
      // a paranoid check — it closes a real hole. k6's "couldn't be found on local disk" error is byte-for-byte
      // the same whether the specifier is unresolvable *within* a correctly mounted tree (defect 55, the
      // finding) or the tree was not mounted at all. Measured: running the pinned image with an empty `/tree`
      // produces the same envelope, `formatLoadFailure` returns it, the guard below passes, and write mode
      // overwrites the committed record with what is really a mount bug dressed up as a generator defect.
      //
      // Asserting the file's presence rather than matching the error text is deliberate: the day defect 55 is
      // fixed the error text changes completely, and a text assertion would have to be rewritten while this one
      // keeps holding.
      const entryModule = join(TREE_DIR, 'clients', 'pets-client.js');
      await Deno.lstat(entryModule).catch(() => {
        throw new Error(
          `${entryModule} does not exist, so this leg cannot distinguish a generator defect from a missing ` +
            `mount. Has the committed output tree moved?`,
        );
      });

      const image = await buildImage('k6', CONTEXT_DIR);
      // No `hostGateway`: this leg reaches nothing over the network, only the mounted tree on disk. No
      // `entrypoint` override either — unlike the `node` and `kotlin` images, this one's `ENTRYPOINT ["k6"]`
      // belongs to this leg, not to tier 3, so `run /scripts/probe.js` is passed as plain `args`.
      const result = await runContainer({
        image,
        args: ['run', '/scripts/probe.js'],
        mounts: [
          { source: TREE_DIR, target: '/tree', readOnly: true },
          { source: SCRIPTS_DIR, target: '/scripts', readOnly: true },
        ],
      });

      expect(result.timedOut, `the container timed out\n${result.stdout}${result.stderr}`).toBe(false);

      const output = result.stdout + result.stderr;
      // `code === 0` as well as the sentinel: the sentinel string also exists in the mounted `probe.js`, so a
      // k6 that ever echoed source would satisfy a substring test alone — and a load that succeeded is exactly
      // the case where this leg must *delete* the committed record, so a false positive here erases a finding.
      const loaded = result.code === 0 && output.includes('GOAST-K6-LOADED');

      // Both outcomes are recorded, and neither is a test failure by itself: a load failure is this leg's
      // finding, and a successful load means the generator was fixed and the committed record must go.
      const failure = loaded ? '' : formatLoadFailure(output);

      // **This guard runs before `verifyTargetLoadFailure`, and the order is the point.** `runContainer`
      // returns a non-zero code rather than throwing, so an output with no recognizable k6 error — a
      // docker-run failure, truncated stdout, k6 printing nothing — leaves `failure === ''`, which is
      // indistinguishable from "the target loaded fine". Verifying first would then take the delete-the-stale-
      // record branch and erase the finding in write mode, or report "this target no longer fails to load" in
      // check mode, which is a lie about what happened. Asserting first means such a run fails loudly with the
      // container's own output and the committed record untouched.
      expect(loaded || failure !== '', `k6 neither loaded the client nor reported why\n\n${output}`).toBe(true);

      await verifyTargetLoadFailure(targetFailureFile(wireRootDir, PROFILE), failure, {
        updateCommand: 'deno task test:integration:k6',
      });
    });
  });
}
