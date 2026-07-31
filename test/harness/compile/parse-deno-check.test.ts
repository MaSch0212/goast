import { fileURLToPath } from 'node:url';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { parseDenoCheckDiagnostics } from './parse-deno-check.ts';

// `fileURLToPath` resolves a file URL to an OS-native absolute path (backslashes and a drive letter on
// Windows, forward slashes on POSIX), so a fake URL needs a drive letter to be valid on every platform,
// and the expected value is derived with the same function rather than hardcoded — hardcoding a POSIX
// path here would make this suite fail on Windows, which is exactly the mismatch this fixture exists
// to catch for the real `deno check` case.
const PET_URL = 'file:///C:/repo/test/output/typescript/models/v3/a/models/pet.ts';
const A_URL = 'file:///C:/repo/a.ts';
const B_URL = 'file:///C:/repo/b.ts';

describe('parseDenoCheckDiagnostics', () => {
  it('extracts code, message, and position from one error', () => {
    const output = [
      `error: TS2322 [ERROR]: Type 'string' is not assignable to type 'number'.`,
      'const x: number = "a";',
      '      ^',
      `    at ${PET_URL}:1:7`,
      '',
    ].join('\n');

    expect(parseDenoCheckDiagnostics(output)).toEqual([{
      file: fileURLToPath(PET_URL),
      line: 1,
      column: 7,
      message: `TS2322 Type 'string' is not assignable to type 'number'.`,
    }]);
  });

  it('extracts several errors from one run', () => {
    const output = [
      `error: TS1005 [ERROR]: ';' expected.`,
      `    at ${A_URL}:2:3`,
      '',
      `error: TS2456 [ERROR]: Type alias 'X' circularly references itself.`,
      `    at ${B_URL}:9:1`,
      '',
      'Found 2 errors.',
    ].join('\n');

    expect(parseDenoCheckDiagnostics(output).map((d) => d.file)).toEqual([
      fileURLToPath(A_URL),
      fileURLToPath(B_URL),
    ]);
  });

  it('keeps an error that carries no position', () => {
    const output = 'error: Module not found "file:///repo/models/.ts".\n';

    expect(parseDenoCheckDiagnostics(output)).toEqual([{
      file: '',
      line: null,
      column: null,
      message: 'Module not found "file:///repo/models/.ts".',
    }]);
  });

  it('finds no diagnostics in clean output', () => {
    expect(parseDenoCheckDiagnostics('Check file:///repo/a.ts\n')).toEqual([]);
  });

  it('drops the fixed "Type checking failed." trailer, which carries no location or new information', () => {
    const output = [
      `error: TS1005 [ERROR]: ';' expected.`,
      `    at ${A_URL}:2:3`,
      '',
      'Found 1 error.',
      '',
      'error: Type checking failed.',
    ].join('\n');

    expect(parseDenoCheckDiagnostics(output)).toEqual([{
      file: fileURLToPath(A_URL),
      line: 2,
      column: 3,
      message: `TS1005 ';' expected.`,
    }]);
  });

  it('parses the captured fixture, so a Deno upgrade that changes the format fails here first', async () => {
    const fixture = await Deno.readTextFile(
      new URL('../fixtures/deno-check-errors.txt', import.meta.url),
    );
    const diagnostics = parseDenoCheckDiagnostics(fixture);

    expect(diagnostics.length).toBeGreaterThan(0);
    for (const diagnostic of diagnostics) expect(diagnostic.message).not.toBe('');
  });
});
