import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { dedent } from './string.utils.ts';

describe('dedent', () => {
  it('strips exactly the requested number of leading spaces from every line', () => {
    expect(dedent(4)('    a\n    b\n')).toBe('a\nb\n');
  });

  it('leaves deeper indentation intact beyond the stripped prefix', () => {
    expect(dedent(4)('    a\n        b\n')).toBe('a\n    b\n');
  });

  it('leaves a line shorter than the prefix untouched rather than trimming what it can', () => {
    expect(dedent(4)('  a\n    b\n')).toBe('  a\nb\n');
  });

  it('leaves an empty line empty', () => {
    expect(dedent(4)('    a\n\n    b\n')).toBe('a\n\nb\n');
  });

  it('does not convert line endings — a literal \\n stays a literal \\n', () => {
    expect(dedent(0)('a\nb')).toBe('a\nb');
  });

  it('does not strip tabs, only spaces', () => {
    expect(dedent(2)('\t\ta\n  b\n')).toBe('\t\ta\nb\n');
  });
});
