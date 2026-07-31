import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { parseTscDiagnostics } from './parse-tsc.ts';

describe('parseTscDiagnostics', () => {
  it('extracts file, position, code, and message', () => {
    expect(parseTscDiagnostics("/tree/models/pet.ts(12,5): error TS2322: Type 'a' is not assignable.\n"))
      .toEqual([{
        file: '/tree/models/pet.ts',
        line: 12,
        column: 5,
        message: "TS2322 Type 'a' is not assignable.",
      }]);
  });

  it('keeps a diagnostic with no file position', () => {
    expect(parseTscDiagnostics('error TS18003: No inputs were found in config file.\n'))
      .toEqual([{ file: '', line: null, column: null, message: 'TS18003 No inputs were found in config file.' }]);
  });

  it('joins a continuation line into the message it belongs to', () => {
    const output = [
      "/tree/a.ts(1,1): error TS2345: Argument of type 'X' is not assignable.",
      "  Type 'X' is missing the following properties: y",
      '',
    ].join('\n');

    expect(parseTscDiagnostics(output)).toEqual([{
      file: '/tree/a.ts',
      line: 1,
      column: 1,
      message: "TS2345 Argument of type 'X' is not assignable. Type 'X' is missing the following properties: y",
    }]);
  });

  it('ignores warnings and the trailing summary', () => {
    expect(parseTscDiagnostics('/tree/a.ts(1,1): warning TS6133: unused.\nFound 0 errors.\n')).toEqual([]);
  });

  it('finds nothing in empty output', () => {
    expect(parseTscDiagnostics('')).toEqual([]);
  });

  it('parses the captured fixture, so a tsc upgrade that changes the format fails here first', async () => {
    const fixture = await Deno.readTextFile(new URL('../fixtures/tsc-errors.txt', import.meta.url));
    const diagnostics = parseTscDiagnostics(fixture);
    expect(diagnostics.length).toBeGreaterThan(0);
  });
});
