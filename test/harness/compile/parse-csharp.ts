import type { Diagnostic } from './types.ts';

/**
 * `<file>(<line>,<col>[,<endLine>,<endCol>]): error CS1002: <message> [<project>]`, or, for diagnostics
 * with no position, `<file-or-tool> : error NU1101: <message> [<project>]`.
 */
const DIAGNOSTIC =
  /^(?<file>.+?)(?:\((?<line>\d+),(?<column>\d+)(?:,\d+,\d+)?\))?\s*: (?:fatal )?error (?<code>[A-Za-z]+\d+): (?<message>.*?)(?: \[(?<project>[^\]]+)\])?$/;

/**
 * Parses MSBuild/csc diagnostics out of a `dotnet build` log.
 *
 * Only errors are kept. The build runs with `TreatWarningsAsErrors`, so every compiler warning already
 * arrives as `error CS…` and a plain `warning` line is by construction something the gate does not
 * judge. The code is kept at the start of the message (`CS1002: ; expected`) because it is the stable
 * part of a C# diagnostic.
 *
 * MSBuild prints each error twice when the build summary is on — once inline and once in the summary —
 * and prints it once per project that compiles the same file, so identical diagnostics (file, position,
 * message, project) are collapsed. The project path is *not* part of the returned shape; a diagnostic
 * with no position (`NU1101`, an MSB error) is reported against the project file instead, so it can still
 * be attributed to its unit.
 */
export function parseCSharpDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const seen = new Set<string>();

  for (const rawLine of output.split('\n')) {
    const match = DIAGNOSTIC.exec(rawLine.trim());
    if (match?.groups === undefined) continue;
    const { file, line, column, code, message, project } = match.groups;

    const hasPosition = line !== undefined;
    const diagnostic: Diagnostic = {
      file: hasPosition ? file.trim() : (project ?? file).trim(),
      line: hasPosition ? Number(line) : null,
      column: hasPosition ? Number(column) : null,
      message: `${code}: ${message}`,
    };

    const key = JSON.stringify([diagnostic, project ?? null]);
    if (seen.has(key)) continue;
    seen.add(key);
    diagnostics.push(diagnostic);
  }

  return diagnostics;
}
