import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { resolveSnapshotMode } from './mode.ts';

function env(vars: Record<string, string>): (key: string) => string | undefined {
  return (key) => vars[key];
}

describe('resolveSnapshotMode', () => {
  it('should default to write mode when nothing is set', () => {
    expect(resolveSnapshotMode(env({}))).toBe('write');
  });

  it('should default to check mode when CI is set', () => {
    expect(resolveSnapshotMode(env({ CI: 'true' }))).toBe('check');
  });

  it('should not treat a falsy CI value as CI', () => {
    expect(resolveSnapshotMode(env({ CI: 'false' }))).toBe('write');
    expect(resolveSnapshotMode(env({ CI: '0' }))).toBe('write');
    expect(resolveSnapshotMode(env({ CI: '' }))).toBe('write');
  });

  it('should let GOAST_SNAPSHOT override the CI default', () => {
    expect(resolveSnapshotMode(env({ CI: 'true', GOAST_SNAPSHOT: 'write' }))).toBe('write');
    expect(resolveSnapshotMode(env({ GOAST_SNAPSHOT: 'check' }))).toBe('check');
  });

  it('should throw on an invalid GOAST_SNAPSHOT value', () => {
    expect(() => resolveSnapshotMode(env({ GOAST_SNAPSHOT: 'yes' }))).toThrow(
      'Invalid GOAST_SNAPSHOT value: "yes". Expected "write" or "check".',
    );
  });
});
