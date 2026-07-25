import * as util from 'node:util';

/**
 * Renders a value as snapshot text. Keys are sorted, so a snapshot does not depend on property
 * insertion order. Strings pass through so callers can mix pre-rendered text into the same snapshot.
 */
export function serializeValue(value: unknown, depth: number = 100): string {
  return typeof value === 'string' ? value : util.inspect(value, { depth, sorted: true });
}
