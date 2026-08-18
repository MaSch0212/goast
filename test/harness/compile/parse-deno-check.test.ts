import { fileURLToPath } from 'node:url';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { isUnparseableModuleMessage, parseDenoCheckDiagnostics } from './parse-deno-check.ts';

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

  // A real Deno 2.6.8 abort, captured verbatim: the position is inline rather than on a following `at`
  // line, and `ERROR_LINE`'s uncoded alternative would otherwise swallow the whole line — position and
  // all — into one positionless diagnostic's message.
  it('extracts the position from the unparseable-module abort, which carries it inline', () => {
    const output = [
      `error: The module's source code could not be parsed: Expected '{', got '=' at ${B_URL}:1:14`,
      '',
      '  export type  = {',
      '               ~',
    ].join('\n');

    expect(parseDenoCheckDiagnostics(output)).toEqual([{
      file: fileURLToPath(B_URL),
      line: 1,
      column: 14,
      message: `The module's source code could not be parsed: Expected '{', got '='`,
    }]);
  });

  it('keeps the whole detail when the abort detail itself contains " at "', () => {
    const output = `error: The module's source code could not be parsed: unexpected token at line 3 at ${B_URL}:3:1\n`;

    expect(parseDenoCheckDiagnostics(output)).toEqual([{
      file: fileURLToPath(B_URL),
      line: 3,
      column: 1,
      message: `The module's source code could not be parsed: unexpected token at line 3`,
    }]);
  });

  // The prefix, not the position, is what `runDenoCheck` keys its abort handling on — so a future Deno
  // that stops printing a parseable position must still be recognised as an abort (and then fail loudly
  // for having no file to exclude), never mistaken for an ordinary diagnostic.
  it('still reports the abort prefix when no position is attached', () => {
    const output = `error: The module's source code could not be parsed: Expected '{', got '='\n`;

    expect(parseDenoCheckDiagnostics(output)).toEqual([{
      file: '',
      line: null,
      column: null,
      message: `The module's source code could not be parsed: Expected '{', got '='`,
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

    // `toEqual` here, not just a shape check: the hand-written cases above pin `error: TS2322 [ERROR]:`,
    // a shape real Deno 2.6.8 does not actually produce (see `ERROR_LINE`'s doc comment) — the fixture
    // is the only case in this file pinning what a real run looks like, so it needs to assert the real
    // parsed value, not merely that parsing produced *something*.
    const FIXTURE_URL = 'file:///C:/repo/test/output/typescript/models/v3/extreme-names/models.ts';
    expect(parseDenoCheckDiagnostics(fixture)).toEqual([{
      file: fileURLToPath(FIXTURE_URL),
      line: 1,
      column: 23,
      message: `TS2307 Import "<output>/models/.ts" not a dependency and not in import map from "${FIXTURE_URL}"`,
    }]);
  });
});

describe('isUnparseableModuleMessage', () => {
  // Deno 2.9 reworded the graph-load abort and moved its position onto the ordinary `at` line. The
  // runner kept keying on the old prefix, silently stopped retrying, and one unit's committed
  // diagnostics went from four to one with nothing failing. Both wordings are recognised so a future
  // rewording is the only thing that can break this again — and it will show up as a shrinking snapshot.
  it('recognises the pre-2.9 wording', () => {
    expect(isUnparseableModuleMessage("The module's source code could not be parsed: Expected '{', got '='"))
      .toBe(true);
  });

  it('recognises the 2.9+ wording', () => {
    expect(isUnparseableModuleMessage("SyntaxError: Expected '{', got '='")).toBe(true);
  });

  it('does not mistake a type error for a graph-load abort', () => {
    // Type errors reach here already prefixed with their code by `parseDenoCheckDiagnostics`. If this
    // returned true for one, the runner would drop a perfectly parseable file from its root list and
    // stop reporting everything that file was responsible for.
    expect(isUnparseableModuleMessage('TS2307 Import "./x.ts" not a dependency')).toBe(false);
    expect(isUnparseableModuleMessage("TS2322 Type 'Timeout' is not assignable to type 'number'.")).toBe(false);
  });
});
