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
 * How every `deno check` failure that is a *graph-load* error rather than a type error begins.
 *
 * `deno check` refuses to build a module graph at all when any module in it — a root or one merely
 * imported — fails to parse: it prints this one error, exits non-zero, and type-checks nothing. The
 * whole unit's remaining diagnostics are lost with it, which is why {@link runDenoCheck} has to detect
 * this case by name rather than treat it as one diagnostic among others. Exported for exactly that.
 */
export const UNPARSEABLE_MODULE_PREFIX = "The module's source code could not be parsed";

/**
 * How Deno words the same graph-load failure since 2.9.
 *
 * The wording changed from {@link UNPARSEABLE_MODULE_PREFIX} to a bare `SyntaxError: <detail>`, and the
 * position moved from inline to the ordinary following `at` line. Both shapes are recognised because the
 * *consequence* is what matters and has not changed: `deno check` aborts the whole graph, so a unit with
 * three unparseable files reports one diagnostic unless the runner drops the named file and retries.
 *
 * Not hypothetical — this is exactly what a Deno upgrade did to this gate. The runner kept keying on the
 * old prefix, stopped recognising the abort, and `typescript/models/v3/non-ascii-names` silently went
 * from four committed diagnostics to one. Nothing failed; the snapshot simply got smaller.
 */
export const SYNTAX_ERROR_PREFIX = 'SyntaxError: ';

/**
 * Whether a diagnostic message is a graph-load abort rather than one diagnostic among many.
 *
 * A bare `SyntaxError:` cannot be confused with a type error: `deno check` renders those as
 * `TS<code> [ERROR]: …`, which {@link parseDenoCheckDiagnostics} prefixes with the code.
 */
export function isUnparseableModuleMessage(message: string): boolean {
  return message.startsWith(UNPARSEABLE_MODULE_PREFIX) || message.startsWith(SYNTAX_ERROR_PREFIX);
}

/**
 * The graph-load error above, whose position is inline rather than on a following `at` line.
 *
 * Matched before {@link ERROR_LINE}, whose uncoded `error: <message>` alternative would otherwise
 * swallow the whole line — position included — into a positionless diagnostic's message. The trailing
 * `at <url>:<line>:<column>` is anchored to the end of the line, so the greedy message group cannot
 * eat it even when the parser's own detail text contains ` at `.
 */
const UNPARSEABLE_LINE = new RegExp(
  `^error: (?<message>${UNPARSEABLE_MODULE_PREFIX}.*) at (?<url>file://\\S*?):(?<line>\\d+):(?<column>\\d+)$`,
);

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
 *
 * {@link UNPARSEABLE_MODULE_PREFIX}'s graph-load error is the one exception to the two-line shape: it
 * carries its position inline, and is matched first for that reason.
 */
export function parseDenoCheckDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const lines = output.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === SUMMARY_LINE) continue;

    const unparseable = UNPARSEABLE_LINE.exec(lines[i]);
    if (unparseable?.groups !== undefined) {
      diagnostics.push({
        file: fileURLToPath(unparseable.groups.url),
        line: Number(unparseable.groups.line),
        column: Number(unparseable.groups.column),
        message: unparseable.groups.message,
      });
      continue;
    }

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
