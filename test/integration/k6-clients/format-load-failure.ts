/**
 * Extracts the deterministic part of a k6 error line.
 *
 * k6 (via logrus) prefixes every log line with `time="…" level=error msg="…"`. The timestamp changes on every
 * run, so committing the whole line would make the artifact churn on every regeneration — the same trap phase
 * 6b hit with Spring's error body. Only the `msg` field's value is kept, with its backslash escapes undone; the
 * `time=`/`level=`/`hint=` fields carry no information this leg records.
 *
 * Returns `''` when `output` contains no `msg="…"` field, so a caller can distinguish "this was not a
 * recognizable k6 error" from "this was one with an empty message" — the latter is not a shape any observed k6
 * output takes.
 */
/**
 * Anchored to `level=error`, not to a bare `msg=`.
 *
 * Without the anchor this takes the *first* `msg=` in the output, and k6 is free to emit `level=info` or
 * `level=warning` lines before the error — a deprecation notice, a startup message. `2.1.0` currently prints
 * only the one line, so an unanchored regex works today and would silently start recording the wrong line
 * after any upstream change, replacing the finding with `"warming up"` and no test failing.
 *
 * The `[^"\\]|\\.` class cannot cross an unescaped quote, so this stops at the end of the `msg` value rather
 * than running on into a later field.
 */
const ERROR_MSG_FIELD = /level=error[^\n]*?\bmsg="((?:[^"\\]|\\.)*)"/;

export function formatLoadFailure(output: string): string {
  const match = ERROR_MSG_FIELD.exec(output);
  if (match === null) return '';

  // Trailing newline, because every other committed tier-4 artifact ends with one (measured: `0a` is the last
  // byte of `test/wire/fetch-clients/getEncoded__ok.txt` and of every `formatDeviations` output, which ends each
  // block with `\n`). Without it git reports `\ No newline at end of file` on every future diff of this file, and
  // one snapshot in the family would read differently from all the others for no reason a reader could infer.
  // One pass over the escape sequences rather than two sequential `replace`s. Sequential passes get `\\n`
  // wrong: the first turns the `\n` half into a real newline, leaving a stray backslash, so a Windows-style
  // path in a k6 message would come back mangled. One alternation consumes each escape exactly once.
  const message = match[1]
    .replace(/\\(.)/g, (_whole, char: string) => (char === 'n' ? '\n' : char))
    .trim();

  // An error line whose `msg` is empty or whitespace-only is not a usable finding, and returning `"\n"` for it
  // would be worse than returning nothing: `""` is the sentinel the caller and `verifyTargetLoadFailure` both
  // read as "not a recognizable k6 error", so a bare newline would slip past the caller's guard and get
  // committed as an artifact that says nothing at all.
  if (message === '') return '';

  return `${message}\n`;
}
