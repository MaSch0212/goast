import { decodeFileUrl } from './diagnostics.ts';
import type { Diagnostic } from './types.ts';

const POSITIONED = /^e: (?<url>file:\/\/\S*?):(?<line>\d+):(?<column>\d+) (?<message>.*)$/;
const BARE = /^e: (?<message>.*)$/;

/**
 * Parses Kotlin compiler diagnostics out of a Gradle build log.
 *
 * Kotlin prefixes severity: `e:` for an error, `w:` for a warning. Only errors are kept — warnings
 * churn on a compiler upgrade and say nothing about whether the generated code is valid. Everything
 * without a severity prefix is Gradle's own output (task names, the failure summary, timings) and is
 * discarded, which is also why the parser never sees a subproject name and attribution has to happen
 * by file path.
 *
 * A diagnostic whose message spans more than one line (Kotlin's `Redeclaration:` prints the
 * conflicting declaration on a second, unprefixed line — see the captured fixture) is kept with only
 * its first line: the continuation carries no `e:`/`w:` prefix, so it matches neither pattern here and
 * is dropped as Gradle noise like everything else without a prefix. That is an acceptable loss of
 * detail, not a correctness bug — the file, position, and headline message are exactly what
 * `formatDiagnostics` snapshots, and the dropped line is source code already visible in the tree the
 * diagnostic is attributed to.
 *
 * The URL is decoded with {@link decodeFileUrl}, not `node:url`'s `fileURLToPath`. Verified directly:
 * every diagnostic Kotlin emits (from a Linux-image compiler run, over the POSIX tree mounted at
 * `/output`) is a POSIX-style `file:///...` URL, and `fileURLToPath` throws `TypeError: File URL path
 * must be absolute` for exactly that URL flavor when the harness itself runs on Windows — the same
 * host-coupled bug `decodeFileUrl`'s own doc comment in `diagnostics.ts` describes.
 */
export function parseKotlinDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const line of output.split('\n')) {
    const positioned = POSITIONED.exec(line.trimEnd());
    if (positioned?.groups !== undefined) {
      diagnostics.push({
        file: decodeFileUrl(positioned.groups.url) ?? positioned.groups.url,
        line: Number(positioned.groups.line),
        column: Number(positioned.groups.column),
        message: positioned.groups.message,
      });
      continue;
    }

    const bare = BARE.exec(line.trimEnd());
    if (bare?.groups !== undefined) {
      diagnostics.push({ file: '', line: null, column: null, message: bare.groups.message });
    }
  }

  return diagnostics;
}
