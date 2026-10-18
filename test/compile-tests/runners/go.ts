import { join } from 'node:path';

import {
  buildImage,
  type CompileUnit,
  type Diagnostic,
  parseGoDiagnostics,
  repoRootDir,
  runContainer,
} from '@goast/test-harness';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'go');
const TREE_MOUNT = '/tree';

const UNIT_MARKER = /^##GOAST-UNIT## (.+)$/;
const GOFMT_MARKER = /^##GOAST-GOFMT## (?:\.\/)?(.+)$/;
const EXIT_MARKER = /^##GOAST-EXIT## (\d+)$/;

/**
 * Checks a Go profile in the `go` container: every unit must be gofmt-formatted and pass `go build`
 * and `go vet`.
 *
 * Each unit is its own module (`example.com/generated`, the default `modulePath` of the generators), so
 * `check.sh` copies it out of the read-only tree, adds a `go.mod` and checks it on its own. It reports
 * every unit between markers, which is how a diagnostic is attributed to its unit; its file paths are
 * already relative to the unit.
 */
export async function runGo(profile: string, units: readonly CompileUnit[]): Promise<Map<string, Diagnostic[]>> {
  const results = new Map<string, Diagnostic[]>();
  if (units.length === 0) return results;

  const image = await buildImage('go', CONTEXT_DIR);
  const unitDirs = new Map(units.map((unit) => [`${unit.versionDir}/${unit.spec}`, unit]));

  const { code, stdout, stderr, timedOut } = await runContainer({
    image,
    args: [...unitDirs.keys()],
    mounts: [{ source: join(repoRootDir, 'test', 'output', 'go', profile), target: TREE_MOUNT, readOnly: true }],
  });

  if (timedOut) {
    throw new Error(`go timed out for profile ${profile}. Its output cannot be trusted.\n\n${stdout}${stderr}`);
  }
  if (code !== 0) {
    throw new Error(`check.sh exited ${code} for profile ${profile}.\n\n${stdout}${stderr}`);
  }

  let unit: CompileUnit | undefined;
  let lines: string[] = [];
  let gofmt: Diagnostic[] = [];
  for (const line of stdout.split('\n')) {
    const unitMatch = UNIT_MARKER.exec(line);
    if (unitMatch !== null) {
      unit = unitDirs.get(unitMatch[1]);
      if (unit === undefined) throw new Error(`check.sh reported an unknown unit ${unitMatch[1]}.`);
      lines = [];
      gofmt = [];
      continue;
    }
    if (unit === undefined) continue;

    const gofmtMatch = GOFMT_MARKER.exec(line);
    if (gofmtMatch !== null) {
      gofmt.push({ file: gofmtMatch[1], line: null, column: null, message: 'not formatted with gofmt' });
      continue;
    }

    const exitMatch = EXIT_MARKER.exec(line);
    if (exitMatch !== null) {
      const diagnostics = [...gofmt, ...parseGoDiagnostics(lines.join('\n'))];
      // A failed check with nothing to show for it would be vacuously green.
      if (exitMatch[1] !== '0' && diagnostics.length === 0) {
        throw new Error(`go exited ${exitMatch[1]} for ${unit.id} but no diagnostics were parsed.\n\n${stdout}`);
      }
      results.set(unit.id, diagnostics);
      unit = undefined;
      continue;
    }
    lines.push(line);
  }

  const unchecked = units.filter((u) => !results.has(u.id));
  if (unchecked.length > 0) {
    throw new Error(
      `check.sh reported no result for ${unchecked.map((u) => u.id).join(', ')} in profile ${profile}.\n\n` +
        stdout +
        stderr,
    );
  }
  return results;
}
