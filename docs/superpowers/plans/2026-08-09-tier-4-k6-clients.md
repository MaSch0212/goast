# Tier 4 `k6-clients` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `k6-clients` target to tier 4, and record — as a committed, reviewable, regression-guarding
artifact — the fact that the generated k6 client **cannot be loaded by k6 at all**.

**Architecture:** This is phase 7b, and it is deliberately unlike every tier-4 leg before it. The other legs drive 19
cases and commit a deviation artifact per non-conforming case. This one cannot drive a single case: two independent
defects stop the generated module from loading, both measured (defects 55 and 56 in the register). So this plan builds
the one thing tier 4 is missing — a way to record a **target-level** failure that explicitly suppresses the per-case
conformance claim — and then uses it. When the generator is fixed, the artifact disappears and the leg starts driving
cases, exactly as a tier-3 diagnostics file does.

**Tech Stack:** Deno (harness, test), Docker (`grafana/k6:2.1.0`, wrapped in a repo Dockerfile so the existing
content-hash image tagging applies).

## Global Constraints

- The repo may require **only Deno and Docker**. Every other toolchain lives in a container.
- **No production code under `packages/` may change.** A generator fix would change generated output and break tier 2's
  byte-exact snapshots; defects are recorded here, never fixed.
- **The committed tree is mounted read-only and never modified.** This constraint is the whole reason this plan exists
  in the shape it does — see the design decision below.
- **Tier 3 must still have exactly 67 committed diagnostic files.** This plan adds a new Docker context
  (`test/docker/k6/`) but must not touch `test/docker/node/`, so tier 3's images are untouched. Verify anyway.
- Deviations are committed **as snapshots**; never an `except` entry in `test/cases/cases.ts`.
- `test/harness` is JSR-published: every exported symbol needs an explicit type annotation or `deno lint` fails
  `no-slow-types`.
- `deno fmt --check` and `deno lint` clean at every commit.

---

## The design decision this plan rests on, stated so it can be overruled

**An absent artifact means "this case conforms."** That rule is what makes tier 4's committed artifacts meaningful, and
it is why this leg cannot simply run, fail, and leave 19 empty spaces: nineteen absent artifacts would be nineteen
false claims that the generated k6 client handles those cases correctly, when in truth it was never loaded.

Two options were considered.

**Chosen — record a target-level load failure, and drive nothing.** The leg attempts the load, captures k6's own error,
and commits it as a single target-level artifact. `WIRE_TARGETS` marks the target as being in that state, and the
orphan sweep and `test/README.md` both treat the absence of per-case artifacts for such a target as carrying **no**
conformance claim. This keeps the spec's property that what runs is byte-identical to what was reviewed, and it is a
real regression guard: the artifact is deleted the day the generator is fixed, and that deletion is reviewable.

**Rejected — rewrite the imports so the cases can be driven.** Adding `.js` to the generated tree's specifiers in a
writable copy would let all 19 cases run and produce ordinary per-case artifacts, which is more coverage. It was
rejected because it would mean the leg no longer runs the reviewed output: every artifact it produced would describe a
*patched* client, and the patch is precisely the defect under measurement. Note the distinction from phase 7a, where the
Angular leg **does** add `.js` extensions — there it rewrites the **emitted JavaScript** produced by `tsc` from the
tree, which is what a bundler would do and what every real Angular consumer does. Here it would mean editing the
delivered artifact to work around a defect in the delivered artifact.

**If the owner prefers the rejected option, this plan should be replaced rather than amended** — the harness concept in
Task 1 exists only to serve the chosen one. A middle path also exists and is not planned here: do both, recording the
load failure *and* a clearly-labelled patched run, at the cost of a second artifact directory whose meaning has to be
explained every time someone reads it.

---

## What has already been measured, so no task rediscovers it

Measured with `test/output/typescript/k6-clients/integration/kitchen-sink` mounted read-only, and reproduced
independently by a reviewer:

1. **Extensionless imports (defect 55).** A probe importing `clients/pets-client.js` fails identically with and without
   network:
   ```
   The moduleSpecifier "../utils/request-builder" couldn't be found on local disk.
   ```

   **The wording is version-dependent, and this is why Task 2 pins the image.** `grafana/k6:latest` is currently
   **v2.1.0**, and the failure was first measured there, wrapped as
   `could not initialize '/scripts/probe.js': could not load JS test …`. On **0.54.0** the same probe fails with the same specifier but a different envelope:
   `GoError: The moduleSpecifier \"../utils/request-builder\" couldn't be found on local disk. …`. Both carry a
   `time="…" level=error msg="…"` prefix whose timestamp changes every run. So the artifact text belongs to one pinned
   k6 version, and **Task 2 must re-measure against the pinned image rather than reusing either quote above.**

   **The pin is `2.1.0` — the newest release — by the owner's decision.** An earlier revision of this plan pinned
   `0.54.0` on the grounds that tier 3 type-checks this corpus against `@types/k6@0.54.0`
   (`test/docker/node/package.json`), so that the two gates would agree about what the target runtime is. The owner
   ruled for the current version instead, which is the better default: a defect recorded against a runtime nearly
   two years old says much less about whether today's users are affected.

   **The consequence is worth stating rather than burying.** Tier 3's typings are now far behind the runtime tier 4
   executes, so the two gates no longer describe the same k6. That does not weaken either defect — both are module
   *resolution* failures, reproduced on 0.54.0 and 2.1.0 alike — but it does mean a future type-level finding from
   tier 3 could describe an API that no longer exists, and a future runtime finding here could describe one tier 3
   cannot see. **Bumping `@types/k6` to match is the follow-up**, and it is deliberately not done in this plan: it
   changes the `node` image's content hash and so re-runs tier 3's whole TypeScript leg, whose committed diagnostics
   would have to be re-reviewed rather than assumed unchanged. That is its own change with its own review.
2. **CDN dependency (defect 56).** In a scratch copy with `.js` extensions added, the same probe **succeeds** with
   network (`LOADED typeof PetsClient=function`) and fails with `--network none`:
   ```
   The moduleSpecifier "https://jslib.k6.io/formdata/0.0.2/index.js" couldn't be retrieved from the resolved url
   ```

So the two defects are independent and compounding, and the first is what the leg will actually record: it fires first,
and it fires regardless of network.

**Also known:** the image's entrypoint is `k6`, so a container run passes `run /scripts/probe.js`. Under Git
Bash, prefix `docker` invocations with `MSYS_NO_PATHCONV=1` or a container path like `/scripts/probe.js` is rewritten
into a Windows path — this cost real time during the spike.

---

## File Structure

- `test/docker/k6/Dockerfile` (create) — `FROM grafana/k6:2.1.0`, so `buildImage`'s content-hash tagging applies
  uniformly and no test hardcodes an upstream tag.
- `test/harness/integration/target-state.ts` (create) — `TargetLoadFailure`, `targetFailureFile`,
  `verifyTargetLoadFailure`.
- `test/harness/integration/target-state.test.ts` (create).
- `test/harness/integration/mod.ts` (modify) — re-export.
- `test/integration/targets.ts` (modify) — add the `k6-clients` entry with its state, and teach the type about it.
- `test/integration-tests/orphans.test.ts` (modify) — expect the target-level filename, and expect **no** per-case
  files for a load-failed target.
- `test/integration/k6-clients/probe.js` (create) — the smallest possible k6 script that imports the generated client.
- `test/integration/k6-clients/integration.test.ts` (create).
- `test/wire/k6-clients/__load-failure.txt` (generated, then committed).
- `deno.json` (modify) — `test:integration:k6` and `:check`; extend `test:all`.
- `test/README.md`, `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md` (modify) — docs and register
  cross-links.

---

### Task 1: A target-level load-failure record

**Files:**

- Create: `test/harness/integration/target-state.ts`
- Test: `test/harness/integration/target-state.test.ts`
- Modify: `test/harness/integration/mod.ts`

**Interfaces:**

- Consumes: `resolveSnapshotMode`, `VerifyOptions` from `../snapshot/mode.ts`; `verifyText` from
  `../snapshot/verify-text.ts`. Read `test/harness/integration/verify.ts` first — this is its sibling and must follow
  its shape exactly.
- Produces:
  - `targetFailureFile(wireRootDir: string, profile: string): string` — `<wireRootDir>/<profile>/__load-failure.txt`.
  - `verifyTargetLoadFailure(snapshotFile: string, failure: string, options?: VerifyOptions): Promise<void>` — the
    same contract as `verifyWireDeviations`: write when non-empty, delete a stale file in write mode, refuse in check
    mode.

**Context.** `verifyWireDeviations` already implements exactly this contract for a per-case artifact, including the
subtle half — a case that *stops* deviating must delete its committed file, and check mode must refuse rather than
silently pass. Read it and mirror it. The difference is only the filename and the doc comment's explanation of what the
file means.

`__load-failure.txt` starts with a double underscore deliberately: case ids become filenames by replacing `/` with
`__`, so no case id can ever produce a name starting with `__`, and the target-level file therefore cannot collide with
a per-case one.

- [ ] **Step 1: Write the failing tests**

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { targetFailureFile, verifyTargetLoadFailure } from './target-state.ts';

describe('targetFailureFile', () => {
  it('is a per-profile file whose name no case id can produce', () => {
    expect(targetFailureFile('/wire', 'k6-clients')).toBe(join('/wire', 'k6-clients', '__load-failure.txt'));
  });
});

describe('verifyTargetLoadFailure', () => {
  it('writes the failure in write mode', async () => {
    const dir = await Deno.makeTempDir();
    try {
      const file = targetFailureFile(dir, 'k6-clients');
      await verifyTargetLoadFailure(file, 'boom\n', { mode: 'write' });

      expect(await Deno.readTextFile(file)).toBe('boom\n');
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  // The half that is easy to omit and is the whole point of the contract: a target that starts loading again
  // must lose its file, and that deletion has to be reviewable rather than silent.
  it('deletes a stale file in write mode when the target now loads', async () => {
    const dir = await Deno.makeTempDir();
    try {
      const file = targetFailureFile(dir, 'k6-clients');
      await Deno.mkdir(join(dir, 'k6-clients'), { recursive: true });
      await Deno.writeTextFile(file, 'old\n');

      await verifyTargetLoadFailure(file, '', { mode: 'write' });

      await expect(Deno.lstat(file)).rejects.toThrow(Deno.errors.NotFound);
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('refuses in check mode when the target now loads', async () => {
    const dir = await Deno.makeTempDir();
    try {
      const file = targetFailureFile(dir, 'k6-clients');
      await Deno.mkdir(join(dir, 'k6-clients'), { recursive: true });
      await Deno.writeTextFile(file, 'old\n');

      await expect(verifyTargetLoadFailure(file, '', { mode: 'check' })).rejects.toThrow('no longer fails to load');
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('refuses in check mode when the failure text changed', async () => {
    const dir = await Deno.makeTempDir();
    try {
      const file = targetFailureFile(dir, 'k6-clients');
      await Deno.mkdir(join(dir, 'k6-clients'), { recursive: true });
      await Deno.writeTextFile(file, 'old\n');

      await expect(verifyTargetLoadFailure(file, 'new\n', { mode: 'check' })).rejects.toThrow();
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('does nothing when the target loads and no file is committed', async () => {
    const dir = await Deno.makeTempDir();
    try {
      await verifyTargetLoadFailure(targetFailureFile(dir, 'k6-clients'), '', { mode: 'check' });
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
deno test -A test/harness/integration/target-state.test.ts
```

Expected: FAIL, module not found.

- [ ] **Step 3: Write `target-state.ts`**

```ts
import { join } from 'node:path';

import { resolveSnapshotMode, type VerifyOptions } from '../snapshot/mode.ts';
import { verifyText } from '../snapshot/verify-text.ts';

/** The task that regenerates the `k6-clients` target's record. */
const K6_UPDATE_COMMAND = 'deno task test:integration:k6';

/**
 * Where a target's load failure is committed.
 *
 * `__load-failure.txt` cannot collide with a per-case artifact: `wireSnapshotFile` builds those by replacing
 * `/` with `__` in a case id, and no case id starts with a separator, so no per-case name can begin `__`.
 */
export function targetFailureFile(wireRootDir: string, profile: string): string {
  return join(wireRootDir, profile, '__load-failure.txt');
}

/**
 * Compares a target's load failure against its committed record.
 *
 * The sibling of `verifyWireDeviations`, with the same three-way contract — write, delete-when-fixed, refuse in
 * check — and for the same reason: a generator fix has to show up as a reviewable deletion rather than as a
 * silent pass.
 *
 * What differs is what the file *means*. A per-case artifact says "this case behaves differently from the
 * contract". This one says "the generated code could not be loaded at all, so **no case was measured**". That
 * distinction is load-bearing, because tier 4's central rule is that an absent per-case artifact means the case
 * conforms — and for a target in this state, the absence of all 19 means nothing of the sort. The orphan sweep
 * and `test/README.md` both have to know that, which is why `WIRE_TARGETS` carries the state rather than it
 * being inferred from a file's presence.
 */
export async function verifyTargetLoadFailure(
  snapshotFile: string,
  failure: string,
  options: VerifyOptions = {},
): Promise<void> {
  const mode = options.mode ?? resolveSnapshotMode();
  const updateCommand = options.updateCommand ?? K6_UPDATE_COMMAND;

  if (failure !== '') {
    await verifyText(snapshotFile, failure, { mode, updateCommand });
    return;
  }

  let exists = true;
  try {
    await Deno.lstat(snapshotFile);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
    exists = false;
  }
  if (!exists) return;

  if (mode === 'check') {
    throw new Error(
      `${snapshotFile} is committed, but this target no longer fails to load.\n\n` +
        `A generator fix probably landed. Run \`${updateCommand}\` and commit the deletion — and note that ` +
        `this target can now drive cases, so its entry in test/integration/targets.ts should lose its ` +
        `\`state: 'load-failure'\` and the leg should start recording per-case artifacts.`,
    );
  }

  await Deno.remove(snapshotFile);
  console.info(`target load failure removed ${snapshotFile}`);
}
```

Add `export * from './target-state.ts';` to `test/harness/integration/mod.ts`.

- [ ] **Step 4: Run the tests**

```bash
deno test -A test/harness && deno fmt --check && deno lint
```

- [ ] **Step 5: Commit**

```bash
git add test/harness/integration
git commit -m "test: add a target-level load-failure record to tier 4"
```

---

### Task 2: Teach the registry and the orphan sweep about a load-failed target

**Files:**

- Modify: `test/integration/targets.ts`
- Modify: `test/integration-tests/orphans.test.ts`

**Interfaces:**

- Consumes: `targetFailureFile` (Task 1).
- Produces: `WireTarget` gains `state?: 'load-failure'`; `WIRE_TARGETS` gains the `k6-clients` entry.

**Context.** Read `test/integration/targets.ts` and `test/integration-tests/orphans.test.ts` together — the sweep
builds its expected file set from the registry and walks all of `test/wire/`, so the two must agree exactly. Phase 6a
pushed a red branch by letting them disagree.

The sweep currently claims, for every target, the filenames of every case in `casesFor(profile, direction)`. For a
load-failed target that is wrong in both directions: it would claim 19 filenames that must **not** exist, and it would
not claim the one that must.

- [ ] **Step 1: Extend the type and add the target**

In `test/integration/targets.ts`:

```ts
/**
 * A target that cannot be driven at all, because the generated code does not load in its own runtime.
 *
 * Not a per-case concern and deliberately not expressible as `except` entries: the cases are fine, and the
 * generated code is not. A target in this state commits one `__load-failure.txt` and **no** per-case artifacts,
 * and the absence of those per-case files carries no conformance claim — which is the opposite of what an
 * absent artifact means for every other target, and is why this is a declared state rather than something
 * inferred from what happens to be on disk.
 */
export type WireTargetState = 'load-failure';

export type WireTarget = { profile: string; direction: Direction; state?: WireTargetState };
```

and add:

```ts
  // Cannot be driven: k6 cannot resolve the generated client's extensionless relative imports, and the request
  // builder imports a CDN polyfill at run time. Defects 55 and 56. `direction` is still `'client'` — that is
  // what the target *is*, and it becomes meaningful the moment the load failure is fixed.
  { profile: 'k6-clients', direction: 'client', state: 'load-failure' },
```

- [ ] **Step 2: Write the failing sweep expectations**

Add to `test/integration-tests/orphans.test.ts` a second test, alongside the existing one:

```ts
  it('claims the load-failure file, and no per-case file, for a load-failed target', () => {
    const failed = WIRE_TARGETS.filter((t) => t.state === 'load-failure');
    expect(failed.length, 'this test is vacuous with no load-failed target').toBeGreaterThan(0);

    for (const target of failed) {
      const expected = expectedFilesFor(target);

      expect(expected).toEqual([`${target.profile}/__load-failure.txt`]);
    }
  });
```

and change the existing sweep to build its set through a shared `expectedFilesFor(target)` helper:

```ts
/**
 * The files a target is allowed to have committed.
 *
 * A load-failed target has exactly one, and crucially **no** per-case files: it was never driven, so a per-case
 * artifact could not have been produced honestly, and claiming those filenames here would let a stale one
 * survive the sweep. Every other target claims one filename per case that survives `casesFor`'s filter, for the
 * reason the file's original comment gives.
 */
function expectedFilesFor(target: WireTarget): string[] {
  if (target.state === 'load-failure') return [`${target.profile}/__load-failure.txt`];

  return casesFor(target.profile, target.direction).map((c) =>
    relative(wireRootDir, wireSnapshotFile(wireRootDir, target.profile, c.id)).replace(/\\/g, '/')
  );
}
```

with the existing test becoming `WIRE_TARGETS.flatMap(expectedFilesFor)`.

- [ ] **Step 3: Run, and expect the sweep to be red until this task's later steps**

```bash
deno test -A test/integration-tests
```

At this point the new test passes and the sweep **fails**, because `test/wire/k6-clients/__load-failure.txt` does not
exist yet — the registry now claims a file nothing has produced.

**Do not commit here.** The registry change and the artifact that satisfies it are one commit, deliberately: phase 6a
pushed a red branch by landing artifacts one commit before the registry that legitimised them, and splitting this pair
would reproduce that mistake from the other direction. The remaining steps of this task produce the artifact; commit
once, at the end, with the branch green.

---

### Task 2 (continued): The k6 leg

**Files:**

- Create: `test/docker/k6/Dockerfile`
- Create: `test/integration/k6-clients/probe.js`
- Create: `test/integration/k6-clients/integration.test.ts`
- Create: `test/wire/k6-clients/__load-failure.txt`
- Modify: `deno.json`

**Interfaces:**

- Consumes: `buildImage`, `runContainer`, `requireDocker`, `repoRootDir`, `wireRootDir`, `targetFailureFile`,
  `verifyTargetLoadFailure`.

**Context.** `test/integration/angular-services/smoke.test.ts` is the closest model for the container invocation shape.
This leg is far simpler: no reference server, no driver results, no diffing. It runs one k6 script and records whether
it loaded.

- [ ] **Step 4: The Dockerfile**

`test/docker/k6/Dockerfile`:

```dockerfile
FROM grafana/k6:2.1.0

# No layers of our own. This exists so the image goes through `buildImage`'s content-hash tagging like every
# other tier-4 image, rather than a test hardcoding an upstream tag — pinning the base here means the tag
# changes if the pin changes, and a stale image cannot be silently reused.
```

**Pin the newest release explicitly — `2.1.0` — rather than the floating `latest` tag.** Those are different things and
both halves matter. Newest, because a defect recorded against an old runtime says little about whether today's users
are affected. Explicit, because the recorded load failure *is* k6's own error text, and a floating tag would let an
upstream release rewrite a committed artifact with no repo change to explain it. That is not hypothetical: the
envelope already differs between `0.54.0` (`GoError: The moduleSpecifier …`) and `2.1.0`
(`could not initialize '…': could not load JS test '…': The moduleSpecifier …`).

When this pin moves, expect three things to move with it: this Dockerfile, the committed artifact, and
`format-load-failure.test.ts`'s captured `SAMPLE`. The unresolved specifier — the actual finding — is stable across
versions; only the wrapping is not.

Also note the image's entrypoint is `k6`, so `runContainer` passes `['run', '/scripts/probe.js']` with no
`entrypoint` override — unlike the `node` and `kotlin` images, whose entrypoints belong to tier 3 and have to be
replaced.

- [ ] **Step 5: The probe**

`test/integration/k6-clients/probe.js`:

```js
// The smallest script that answers the only question this leg can currently ask: can k6 load the generated
// client at all? It imports one client and prints one line. It deliberately does not exercise any operation —
// there is nothing to exercise until the module loads, and a probe that tried would obscure the load error with
// its own.
//
// `clients/pets-client.js` and not the `clients.js` barrel: the barrel re-exports through its own extensionless
// specifiers, so importing it would fail one level earlier and the recorded error would name the barrel rather
// than the import that actually cannot be resolved.
import { PetsClient } from '/tree/clients/pets-client.js';

export const options = { vus: 1, iterations: 1 };

export default function () {
  console.log(`GOAST-K6-LOADED typeof PetsClient=${typeof PetsClient}`);
}
```

- [ ] **Step 6: The integration test**

`test/integration/k6-clients/integration.test.ts`, following the gate and container conventions of the other legs:

- Gate on `GOAST_INTEGRATION`.
- `buildImage('k6', join(repoRootDir, 'test', 'docker', 'k6'))`.
- `runContainer` with `args: ['run', '/scripts/probe.js']`, the generated tree mounted read-only at `/tree`
  (`test/output/typescript/k6-clients/integration/kitchen-sink`), the probe's directory read-only at `/scripts`, and
  **no** `hostGateway` — this leg reaches nothing.
- Assert `timedOut` is false first, as every other leg does.
- Then the substance:

```ts
        const output = result.stdout + result.stderr;
        const loaded = output.includes('GOAST-K6-LOADED');

        // Both outcomes are recorded, and neither is a test failure by itself: a load failure is this leg's
        // finding, and a successful load means the generator was fixed and the committed record must go.
        const failure = loaded ? '' : formatLoadFailure(output);

        await verifyTargetLoadFailure(targetFailureFile(wireRootDir, PROFILE), failure, {
          updateCommand: 'deno task test:integration:k6',
        });

        // A non-zero exit with no recognizable k6 error is neither of the two states above — it means the
        // container broke for a reason this leg does not model, and recording it as "the generated code does
        // not load" would be a lie.
        expect(loaded || failure !== '', `k6 neither loaded the client nor reported why\n\n${output}`).toBe(true);
```

`formatLoadFailure(output)` extracts the deterministic part of k6's error and **must** drop anything run-varying.
Measured: k6 prefixes each line with `time="2026-08-09T16:03:09Z" level=error msg="…"`. The timestamp changes every
run, so a naive capture would make the artifact churn — the same trap phase 6b hit with Spring's error body. Keep the
`msg="…"` payload and drop the `time=`/`level=` prefix, and unit-test that function against a captured sample rather
than only through the container.

- [ ] **Step 7: Add the tasks to `deno.json`**

```json
    "test:integration:k6": "GOAST_INTEGRATION=1 GOAST_SNAPSHOT=write deno test -A test/integration/k6-clients",
    "test:integration:k6:check": "GOAST_INTEGRATION=1 GOAST_SNAPSHOT=check deno test -A test/integration/k6-clients",
```

and extend `test:all` with ` && deno task test:integration:k6:check`.

- [ ] **Step 8: Generate and read the artifact**

```bash
deno task test:integration:k6
```

Read `test/wire/k6-clients/__load-failure.txt`. It must name the unresolved specifier
(`../utils/request-builder`), contain no timestamp, and be short enough to read at a glance. Then prove the machinery:

```bash
deno task test:integration:k6:check     # determinism — must pass, and twice
deno task test:integration:check        # the orphan sweep, now satisfied
```

Plant an orphan (`touch "test/wire/k6-clients/getPet__ok.txt"`), confirm `test:integration:check` **fails** naming it —
this is the specific protection Task 2 added, that a load-failed target may not have per-case files — then remove it.

- [ ] **Step 9: Commit — registry and artifact together**

```bash
git add test/docker/k6 test/integration/k6-clients test/wire/k6-clients test/integration/targets.ts test/integration-tests/orphans.test.ts deno.json
git commit -m "test: record that the generated k6 client cannot be loaded by k6"
```

---

### Task 3: Document the state and cross-link the defects

**Files:**

- Modify: `test/README.md`
- Modify: `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`

**Context.** Defects 55 and 56 already exist and already describe both mechanisms in full, with measurements. This task
does **not** rewrite them — it adds the `**Tier 4:**` element each currently lacks (both say "none yet"), pointing at
the committed record.

- [ ] **Step 1: Update both defect entries**

Replace each entry's "**Tier 4:** none yet…" paragraph with one naming `test/wire/k6-clients/__load-failure.txt`,
quoting it, and stating plainly that this target commits no per-case artifacts and that their absence carries no
conformance claim. Defect 56's element must also say that its failure is *masked* by defect 55 — the extension error
fires first, so the CDN error will not appear in the artifact until 55 is fixed, and whoever fixes 55 should expect
this leg to go from one failure to a different one rather than to green.

- [ ] **Step 2: `test/README.md`**

The file already carries a paragraph describing this target as blocked and stating the design question. Replace it with
what was actually built: the target-level record, the `state: 'load-failure'` registry entry, the rule that a
load-failed target's missing per-case artifacts mean nothing, and the two new task names. Update the tier table's
status column and the artifact-count sentence.

Say explicitly which of the two options from the plan was taken and why, so a reader does not have to find this plan to
learn that the alternative was considered.

- [ ] **Step 3: Audit the register's citations**

Write a throwaway script that extracts every `path:NN` and `path:NN-MM` citation, opens each at that line, and prints
what is there. Read the output against the claims and repair what is wrong. Report how many you checked and how many
you repaired — including zero, and if zero, why that is right rather than a broken script.

- [ ] **Step 4: Full gate**

```bash
deno fmt --check && deno lint && deno task test
deno task test:output:check
deno task test:integration:check
deno task test:integration:k6:check
deno task test:integration:angular:check
deno task test:integration:kotlin:check
deno task test:integration:controllers:check
GOAST_COMPILE=1 GOAST_SNAPSHOT=check deno test -A test/compile-tests test/harness/docker.test.ts
find test/compile -name "*.txt" | wc -l
```

The last must still be 67.

- [ ] **Step 5: Commit**

```bash
git add test/README.md docs/superpowers/plans/2026-07-25-generator-bug-fixes.md
git commit -m "docs: document the k6 load-failure record and cross-link its defects"
```

---

## Risks

1. **The recorded error text may not be stable across k6 patch releases.** Pinning the image version (Task 3 Step 1) is
   the mitigation; if the pin ever moves, expect the artifact to move with it and treat that as a reviewable change,
   not a regression.
2. **`formatLoadFailure` is a normalizer, and normalizers are the most dangerous code in this tier** — their job is to
   make a difference stop being reported. Keep it as narrow as the timestamp prefix, unit-test it directly, and do not
   let it grow into something that could swallow a change in *which* specifier failed.
3. **This leg's value is entirely as a regression guard until the generator is fixed.** If defects 55 and 56 are fixed
   before this plan runs, the plan is wrong rather than merely stale — the leg would then need a real driver and 19
   cases, which is a different plan. Check the defects' status before starting.
