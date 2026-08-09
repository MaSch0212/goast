import type { Direction } from '../cases/types.ts';

/** One tier-4 target: a generated-code profile and the side of the contract it exercises. */
export type WireTarget = { profile: string; direction: Direction };

/**
 * Every profile tier 4 records deviations for, and the direction each one drives.
 *
 * This is the single source of truth for "which `test/wire/<profile>/` directories are legitimate".
 * The orphan sweep builds its expected file set from every entry here, so adding a target without
 * adding it to this list makes the sweep fail with that target's artifacts reported as orphans — which
 * is how this list stays honest, and is exactly what happened when the Kotlin targets landed before
 * this registry existed.
 *
 * `direction` is not cosmetic: it selects the `casesFor(profile, direction)` filter the corresponding
 * driver uses, and the sweep must filter identically or it claims filenames for cases the driver never
 * drives — letting a stale artifact survive forever with the sweep still green.
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
];
