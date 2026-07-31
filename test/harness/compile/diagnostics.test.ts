import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { formatDiagnostics } from './diagnostics.ts';
import type { Diagnostic } from './types.ts';

const d = (file: string, line: number | null, column: number | null, message: string): Diagnostic => ({
  file,
  line,
  column,
  message,
});

describe('formatDiagnostics', () => {
  it('renders one diagnostic per line as file:line:col message', () => {
    expect(formatDiagnostics([d('models/pet.ts', 3, 7, 'Type error')]))
      .toBe('models/pet.ts:3:7 Type error\n');
  });

  it('sorts by file, then line, then column, then message', () => {
    const text = formatDiagnostics([
      d('b.ts', 1, 1, 'second file'),
      d('a.ts', 2, 1, 'later line'),
      d('a.ts', 1, 2, 'later column'),
      d('a.ts', 1, 1, 'zzz'),
      d('a.ts', 1, 1, 'aaa'),
    ]);

    expect(text).toBe(
      'a.ts:1:1 aaa\na.ts:1:1 zzz\na.ts:1:2 later column\na.ts:2:1 later line\nb.ts:1:1 second file\n',
    );
  });

  it('dedupes identical diagnostics, which a parallel build can report twice', () => {
    expect(formatDiagnostics([d('a.ts', 1, 1, 'same'), d('a.ts', 1, 1, 'same')]))
      .toBe('a.ts:1:1 same\n');
  });

  it('omits position when the compiler gave none, and renders a missing file as <no file>', () => {
    expect(formatDiagnostics([d('a.kt', null, null, 'no position'), d('', null, null, 'no file')]))
      .toBe('<no file> no file\na.kt no position\n');
  });

  it('orders file-less diagnostics numerically too, not by string', () => {
    expect(formatDiagnostics([d('', 10, 1, 'ten'), d('', 9, 1, 'nine')]))
      .toBe('<no file>:9:1 nine\n<no file>:10:1 ten\n');
  });

  it('sorts a position-less diagnostic before a positioned one in the same file', () => {
    expect(formatDiagnostics([d('a.kt', 5, 1, 'positioned'), d('a.kt', null, null, 'bare')]))
      .toBe('a.kt bare\na.kt:5:1 positioned\n');
  });

  it('collapses a multi-line message onto one line so a diagnostic is always one snapshot line', () => {
    expect(formatDiagnostics([d('a.kt', 1, 1, 'first\n  second\n\n  third')]))
      .toBe('a.kt:1:1 first second third\n');
  });

  it('returns the empty string for no diagnostics', () => {
    expect(formatDiagnostics([])).toBe('');
  });
});
