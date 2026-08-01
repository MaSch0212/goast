import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

import { verifyCompileDiagnostics } from './verify.ts';
import type { Diagnostic } from './types.ts';

const one: Diagnostic[] = [{ file: 'a.kt', line: 1, column: 1, message: 'boom' }];

describe('verifyCompileDiagnostics', () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await Deno.makeTempDir();
    file = join(dir, 'nested', 'unit.txt');
  });
  afterEach(async () => {
    await Deno.remove(dir, { recursive: true });
  });

  it('write mode creates the snapshot for a failing unit, parent directories included', async () => {
    await verifyCompileDiagnostics(file, one, { mode: 'write' });
    expect(await Deno.readTextFile(file)).toBe('a.kt:1:1 boom\n');
  });

  it('check mode passes when the committed snapshot matches', async () => {
    await verifyCompileDiagnostics(file, one, { mode: 'write' });
    await verifyCompileDiagnostics(file, one, { mode: 'check' });
  });

  it('check mode fails when a failing unit has no committed snapshot', async () => {
    await expect(verifyCompileDiagnostics(file, one, { mode: 'check' })).rejects.toThrow(
      'does not exist',
    );
  });

  it('write mode deletes a stale snapshot when the unit now compiles', async () => {
    await verifyCompileDiagnostics(file, one, { mode: 'write' });
    await verifyCompileDiagnostics(file, [], { mode: 'write' });
    await expect(Deno.stat(file)).rejects.toThrow(Deno.errors.NotFound);
  });

  it('check mode fails when the unit now compiles but a snapshot is still committed', async () => {
    await verifyCompileDiagnostics(file, one, { mode: 'write' });
    await expect(verifyCompileDiagnostics(file, [], { mode: 'check' })).rejects.toThrow(
      'no longer fails to compile',
    );
  });

  it('passes in both modes for a clean unit with no snapshot', async () => {
    await verifyCompileDiagnostics(file, [], { mode: 'write' });
    await verifyCompileDiagnostics(file, [], { mode: 'check' });
  });

  // Every check-mode failure this function can produce must name tier 3's task. Two of the three
  // reach the message through `verifyText`, whose own default is tier 2's `deno task test:output` —
  // running that regenerates nothing under `test/compile/` and leaves the run red with the same
  // message, so a wrong command here is worse than no command.
  describe('names the tier 3 task in every check-mode failure', () => {
    async function messageFor(promise: Promise<void>): Promise<string> {
      const error = await promise.catch((e: Error) => e) as Error;
      expect(error).toBeInstanceOf(Error);
      return error.message;
    }

    it('when a failing unit has no committed snapshot', async () => {
      const message = await messageFor(verifyCompileDiagnostics(file, one, { mode: 'check' }));
      expect(message).toContain('deno task test:compile');
      expect(message).not.toContain('test:output');
    });

    it('when a committed snapshot no longer matches', async () => {
      await verifyCompileDiagnostics(file, one, { mode: 'write' });
      const other: Diagnostic[] = [{ file: 'a.kt', line: 2, column: 1, message: 'different' }];
      const message = await messageFor(verifyCompileDiagnostics(file, other, { mode: 'check' }));
      expect(message).toContain('deno task test:compile');
      expect(message).not.toContain('test:output');
    });

    it('when the unit now compiles but a snapshot is still committed', async () => {
      await verifyCompileDiagnostics(file, one, { mode: 'write' });
      const message = await messageFor(verifyCompileDiagnostics(file, [], { mode: 'check' }));
      expect(message).toContain('deno task test:compile');
      expect(message).not.toContain('test:output');
    });
  });
});
