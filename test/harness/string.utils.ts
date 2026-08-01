import { EOL } from 'node:os';

/**
 * Strips `indentCharCount` leading spaces from every line.
 *
 * Tests compare generated output against indented template literals, so the literal carries the
 * surrounding code's indentation and the expectation does not. This removes exactly that prefix and
 * nothing else: a line indented less than the prefix is left alone rather than partially trimmed, so a
 * mis-specified count shows up as a failing test instead of silently eating real leading whitespace.
 *
 * It deliberately does **not** touch line endings. The predecessor (`normalizeEOL` below) rewrote `\n`
 * to the host's `EOL`, which made every expectation depend on which OS ran the suite; the convention is
 * that tests use literal `\n` everywhere.
 */
export function dedent(indentCharCount: number): (str: string) => string {
  const prefix = new RegExp(`^ {${indentCharCount}}`, 'gm');
  return (str: string) => str.replace(prefix, '');
}

function _normalizeEOL(str: string, indentCharCount?: number): string {
  let result = str.replace(/\r/gm, '').replace(/\n/g, EOL);
  if (indentCharCount !== undefined) {
    result = result.replace(new RegExp(`^ {${indentCharCount}}`, 'gm'), '');
  }
  return result;
}

export function normalizeEOL(str: string): string;
export function normalizeEOL(indentCharCount: number): (str: string) => string;
export function normalizeEOL(arg1: string | number): string | ((str: string) => string) {
  if (typeof arg1 === 'string') {
    return _normalizeEOL(arg1);
  }
  return (str: string) => _normalizeEOL(str, arg1);
}
