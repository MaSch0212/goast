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

    // Captured from a real `check.mjs` run over `angular-services/v3/non-ascii-names`, with the whole
    // profile (not just the one unit) mounted at `/tree` — the same shape `runTsc` itself produces, so
    // the file's path carries the `v3/non-ascii-names/...` prefix a lone-unit mount would not have shown.
    // An exact `toEqual` (not just "some diagnostics came out") is what makes a partial format drift —
    // say, the code losing its digits, or a column shifting by one — fail here instead of silently
    // reshaping a committed snapshot.
    expect(parseTscDiagnostics(fixture)).toEqual([
      {
        file: 'v3/non-ascii-names/models/.ts',
        line: 1,
        column: 14,
        message: "TS1005 '{' expected.",
      },
      {
        file: 'v3/non-ascii-names/models/.ts',
        line: 2,
        column: 5,
        message: "TS2304 Cannot find name 'value'.",
      },
      {
        file: 'v3/non-ascii-names/models/.ts',
        line: 2,
        column: 11,
        message: 'TS1109 Expression expected.',
      },
      {
        file: 'v3/non-ascii-names/models/.ts',
        line: 2,
        column: 13,
        message: "TS2693 'string' only refers to a type, but is being used as a value here.",
      },
      {
        file: 'v3/non-ascii-names/models/_1.ts',
        line: 1,
        column: 14,
        message: "TS1005 '{' expected.",
      },
      {
        file: 'v3/non-ascii-names/models/_1.ts',
        line: 2,
        column: 5,
        message: "TS2304 Cannot find name 'value'.",
      },
      {
        file: 'v3/non-ascii-names/models/_1.ts',
        line: 2,
        column: 11,
        message: 'TS1109 Expression expected.',
      },
      {
        file: 'v3/non-ascii-names/models/_1.ts',
        line: 2,
        column: 13,
        message: "TS2693 'string' only refers to a type, but is being used as a value here.",
      },
      {
        file: 'v3/non-ascii-names/models/_2.ts',
        line: 1,
        column: 14,
        message: "TS1005 '{' expected.",
      },
      {
        file: 'v3/non-ascii-names/models/_2.ts',
        line: 2,
        column: 5,
        message: "TS2304 Cannot find name 'value'.",
      },
      {
        file: 'v3/non-ascii-names/models/_2.ts',
        line: 2,
        column: 11,
        message: 'TS1109 Expression expected.',
      },
      {
        file: 'v3/non-ascii-names/models/_2.ts',
        line: 2,
        column: 13,
        message: "TS2693 'string' only refers to a type, but is being used as a value here.",
      },
    ]);
  });
});
