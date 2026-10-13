import type { Diagnostic } from './types.ts';

const DIAGNOSTIC =
  /^(?:(?<file>[^(]+)\((?<line>\d+),(?<column>\d+)\): )?(?<severity>error|warning) (?<code>TS\d+): (?<message>.*)$/;

/**
 * Parses `tsc --noEmit` output into diagnostics.
 *
 * Only errors are kept. Warnings churn on a compiler upgrade without indicating anything about the
 * generated code, and a snapshot that churns for that reason stops being read.
 *
 * A line indented under a diagnostic is a continuation of its message — `tsc` elaborates a type
 * mismatch that way — and is folded into the message it follows, because a diagnostic must occupy
 * exactly one snapshot line.
 */
export function parseTscDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  let current: Diagnostic | undefined;
  let currentIsError = false;

  for (const line of output.split('\n')) {
    const match = DIAGNOSTIC.exec(line);
    if (match?.groups !== undefined) {
      currentIsError = match.groups.severity === 'error';
      current = {
        file: match.groups.file ?? '',
        line: match.groups.line === undefined ? null : Number(match.groups.line),
        column: match.groups.column === undefined ? null : Number(match.groups.column),
        message: `${match.groups.code} ${match.groups.message}`,
      };
      if (currentIsError) diagnostics.push(current);
      continue;
    }

    if (current !== undefined && currentIsError && /^\s+\S/.test(line)) {
      current.message = `${current.message} ${line.trim()}`;
      continue;
    }
    current = undefined;
  }

  return diagnostics;
}
