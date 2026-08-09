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
const MSG_FIELD = /msg="((?:[^"\\]|\\.)*)"/s;

export function formatLoadFailure(output: string): string {
  const match = MSG_FIELD.exec(output);
  if (match === null) return '';

  return match[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .trim();
}
