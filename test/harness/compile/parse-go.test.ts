import { describe, expect, it } from 'vitest';

import { parseGoDiagnostics } from './parse-go.ts';

describe('parseGoDiagnostics', () => {
  it('extracts file, position, and message of a build error', () => {
    const output = ['# example.com/generated/api', 'api/pet.go:12:5: undefined: Owner', ''].join('\n');

    expect(parseGoDiagnostics(output)).toEqual([
      { file: 'api/pet.go', line: 12, column: 5, message: 'undefined: Owner' },
    ]);
  });

  it('strips the prefixes of a vet diagnostic', () => {
    expect(parseGoDiagnostics('vet: ./api/pet.go:3:1: unreachable code\n')).toEqual([
      { file: 'api/pet.go', line: 3, column: 1, message: 'unreachable code' },
    ]);
  });

  it('keeps a diagnostic without a column', () => {
    expect(parseGoDiagnostics('api/pet.go:7: misplaced compiler directive\n')).toEqual([
      { file: 'api/pet.go', line: 7, column: null, message: 'misplaced compiler directive' },
    ]);
  });

  it('joins a continuation line into the message it belongs to', () => {
    const output = ['api/pet.go:1:2: not enough arguments in call to f', '\thave ()', '\twant (int)', ''].join('\n');

    expect(parseGoDiagnostics(output)).toEqual([
      { file: 'api/pet.go', line: 1, column: 2, message: 'not enough arguments in call to f have () want (int)' },
    ]);
  });

  it('keeps a line in an unknown format as a diagnostic without a file', () => {
    expect(parseGoDiagnostics('go: cannot find main module\n')).toEqual([
      { file: '', line: null, column: null, message: 'go: cannot find main module' },
    ]);
  });
});
