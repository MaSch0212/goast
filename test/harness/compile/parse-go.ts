import type { Diagnostic } from './types.ts';

const DIAGNOSTIC = /^(?:vet: )?(?:\.\/)?(?<file>[^\s:][^:]*\.go):(?<line>\d+)(?::(?<column>\d+))?: (?<message>.*)$/;

/**
 * Parses the output of `go build` and `go vet` into diagnostics.
 *
 * A `# <package>` line only names the package of the diagnostics that follow, so it is skipped. A line
 * indented with a tab continues the message before it (e.g. `have` and `want` of a mismatched call) and
 * is folded into it, because a diagnostic must occupy exactly one snapshot line. Any other line is kept
 * as a diagnostic without a file, so output in an unexpected format shows up in the snapshot instead of
 * being dropped.
 */
export function parseGoDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  let current: Diagnostic | undefined;

  for (const line of output.split('\n')) {
    if (line.trim() === '' || line.startsWith('# ')) {
      current = undefined;
      continue;
    }

    if (current !== undefined && line.startsWith('\t')) {
      current.message = `${current.message} ${line.trim()}`;
      continue;
    }

    const match = DIAGNOSTIC.exec(line);
    current =
      match?.groups === undefined
        ? { file: '', line: null, column: null, message: line.trim() }
        : {
            file: match.groups.file,
            line: Number(match.groups.line),
            column: match.groups.column === undefined ? null : Number(match.groups.column),
            message: match.groups.message,
          };
    diagnostics.push(current);
  }

  return diagnostics;
}
