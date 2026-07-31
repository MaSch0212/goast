import { fileURLToPath } from 'node:url';

import type { Diagnostic } from './types.ts';

/**
 * Opens a diagnostic. Real `deno check` output (2.6.8) does **not** prefix a coded diagnostic with
 * `error: ` — it reads `TS2307 [ERROR]: message` directly — but a positionless, uncoded failure (a
 * top-level module-resolution failure that never reaches the type checker) reads `error: message`
 * with no code at all. Both forms are matched as their own alternative, deliberately, rather than
 * making every piece optional in one alternative: a fully-optional prefix would make this pattern
 * match *any* line (since the message group still matches on its own), which breaks its second use
 * below as a lookahead boundary that must reject plain source-excerpt and caret lines.
 */
const ERROR_LINE = /^(?:(?:error: )?(?<code>TS\d+) \[ERROR\]: (?<message>.*)|error: (?<messageOnly>.*))$/;
const AT_LINE = /^\s+at (?<url>file:\/\/\S*?):(?<line>\d+):(?<column>\d+)$/;

/**
 * `deno check`'s fixed trailer, printed once at the end of any run that found at least one error.
 * It carries no code, no position, and no information beyond "some error above exists" — which every
 * kept diagnostic already conveys — so it is excluded rather than kept as a positionless diagnostic.
 */
const SUMMARY_LINE = 'error: Type checking failed.';

/**
 * Parses `deno check` output into diagnostics.
 *
 * The format is human-oriented and has no machine alternative, so this is anchored on the two lines
 * that carry meaning: a diagnostic-opening line (see {@link ERROR_LINE}) and the following indented
 * `at file://…:line:col` locates it. Everything between them is the source excerpt and the caret,
 * which are derivable from the position and would only add churn to a snapshot.
 *
 * An error with no `at` line — a module-resolution failure, for instance — is kept with no position
 * rather than dropped. Dropping it would let a whole unit fail to resolve while the gate reported
 * nothing.
 */
export function parseDenoCheckDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const lines = output.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === SUMMARY_LINE) continue;

    const error = ERROR_LINE.exec(lines[i]);
    if (error?.groups === undefined) continue;

    const code = error.groups.code;
    const message = code === undefined ? error.groups.messageOnly ?? '' : `${code} ${error.groups.message}`;

    let position: { file: string; line: number; column: number } | undefined;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j] !== SUMMARY_LINE && ERROR_LINE.test(lines[j])) break;
      const at = AT_LINE.exec(lines[j]);
      if (at?.groups === undefined) continue;
      position = {
        file: fileURLToPath(at.groups.url),
        line: Number(at.groups.line),
        column: Number(at.groups.column),
      };
      break;
    }

    diagnostics.push({
      file: position?.file ?? '',
      line: position?.line ?? null,
      column: position?.column ?? null,
      message,
    });
  }

  return diagnostics;
}
