import type { Direction } from '../cases/types.ts';

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

/** One tier-4 target: a generated-code profile and the side of the contract it exercises. */
export type WireTarget = { profile: string; direction: Direction; state?: WireTargetState };

/**
 * Every profile tier 4 records something for, and the direction each one drives.
 *
 * "Records something" rather than "records deviations": most entries record per-case deviations, but a target
 * carrying `state: 'load-failure'` records no deviations at all, because its generated code cannot be loaded and
 * so no case was ever driven. See {@link WireTargetState}.
 *
 * This is the single source of truth for "which `test/wire/<profile>/` directories are legitimate".
 * The orphan sweep builds its expected file set from every entry here, so adding a target without
 * adding it to this list makes the sweep fail with that target's artifacts reported as orphans — which
 * is how this list stays honest, and is exactly what happened when the Kotlin targets landed before
 * this registry existed.
 *
 * `direction` is not cosmetic: it selects the `casesFor(profile, direction)` filter the corresponding
 * driver uses, and the sweep must filter identically or it claims filenames for cases the driver never
 * drives — letting a stale artifact survive forever with the sweep still green. A load-failed target has no
 * driver, so its `direction` describes only what it *would* be once it can run.
 *
 * Both directions are represented. The `'client'` entries are generated clients driven against the
 * reference server, compared with `diffRequest`/`diffResult`; the four `spring-controllers@*` entries
 * are generated servers driven by the reference client (`issueCase`), compared with `diffResponse`.
 *
 * No profile appears twice, and none can: `wireSnapshotFile` has no direction segment, so a profile ever
 * driven in *both* directions would need one before it could be registered for both — its two runs would
 * otherwise write the same `test/wire/<profile>/<case>.txt` path.
 */
export const WIRE_TARGETS: readonly WireTarget[] = [
  { profile: 'fetch-clients', direction: 'client' },
  { profile: 'angular-services', direction: 'client' },
  { profile: 'okhttp3-clients@sb3', direction: 'client' },
  { profile: 'okhttp3-clients@sb4', direction: 'client' },
  { profile: 'spring-reactive-web-clients@sb3', direction: 'client' },
  { profile: 'spring-reactive-web-clients@sb4', direction: 'client' },
  { profile: 'spring-controllers@sb3', direction: 'server' },
  { profile: 'spring-controllers@sb4', direction: 'server' },
  { profile: 'spring-controllers@sb3-strict', direction: 'server' },
  { profile: 'spring-controllers@sb4-strict', direction: 'server' },
  // Cannot be driven: k6 cannot resolve the generated client's extensionless relative imports, and the request
  // builder imports a CDN polyfill at run time. Defects 55 and 56. `direction` is still `'client'` — that is
  // what the target *is*, and it becomes meaningful the moment the load failure is fixed.
  { profile: 'k6-clients', direction: 'client', state: 'load-failure' },
];
