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
 * All entries are `'client'` today. The server direction (`spring-controllers`, driven by the reference
 * *client* against a generated server) arrives with `diffResponse` in a later phase; note that
 * `wireSnapshotFile` has no direction segment, so a profile ever driven in both directions would need
 * one before it could appear here twice.
 */
export const WIRE_TARGETS: readonly WireTarget[] = [
  { profile: 'fetch-clients', direction: 'client' },
  { profile: 'okhttp3-clients@sb3', direction: 'client' },
  { profile: 'okhttp3-clients@sb4', direction: 'client' },
  { profile: 'spring-reactive-web-clients@sb3', direction: 'client' },
  { profile: 'spring-reactive-web-clients@sb4', direction: 'client' },
];
