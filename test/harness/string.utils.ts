/**
 * Strips `indentCharCount` leading spaces from every line.
 *
 * Tests compare generated output against indented template literals, so the literal carries the
 * surrounding code's indentation and the expectation does not. This removes exactly that prefix and
 * nothing else: a line indented less than the prefix is left alone rather than partially trimmed, so a
 * mis-specified count shows up as a failing test instead of silently eating real leading whitespace.
 *
 * It deliberately does **not** touch line endings, and there is no helper here that does. Its
 * predecessor (`normalizeEOL`) rewrote `\n` to the host's `EOL`, which made every expectation depend on
 * which OS ran the suite — two tests could pass on Windows and fail on Linux for reasons unrelated to
 * what they asserted. Tests use literal `\n` everywhere instead.
 */
export function dedent(indentCharCount: number): (str: string) => string {
  const prefix = new RegExp(`^ {${indentCharCount}}`, 'gm');
  return (str: string) => str.replace(prefix, '');
}
