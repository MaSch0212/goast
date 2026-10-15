import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import {
  buildImage,
  type CompileUnit,
  type Diagnostic,
  normalizeMessageUrls,
  relativizeDiagnostic,
  repoRootDir,
  runContainer,
  walkFiles,
} from '@goast/test-harness';
import { parseTscDiagnostics } from '../../harness/compile/parse-tsc.ts';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'node');
const TREE_MOUNT = '/tree';
const CONFIG_MOUNT = '/run';

/** Prefix `check.mjs` puts before each root file it reports — see that file's doc comment. */
const ROOT_MARKER = /^##GOAST-ROOT## (.+)$/;

/** Prefix `check.mjs` puts before a reason its result cannot be trusted. */
const FATAL_MARKER = '##GOAST-FATAL## ';

/** Every file `tsc` takes as a source under `allowJs`. */
const SOURCE_FILE = /\.[cm]?[jt]sx?$/;

/**
 * Type-checks a containerized TypeScript profile with one `tsc` program.
 *
 * The generated `tsconfig.json` extends the image's base and lists every unit's directory, so one
 * program covers the whole profile. Units never import across unit boundaries, so a shared program is
 * safe; if that ever changes, a cross-unit import would surface as a resolution error naming both
 * paths, which is the right way to find out.
 *
 * The container's entrypoint is `check.mjs`, not the `tsc` binary: the TypeScript 7 CLI reports only
 * syntax errors for the whole program as soon as any file has one, and every profile's
 * `v3/non-ascii-names` unit has one (defect 21). One plain `tsc -p` per profile would hide every other
 * unit's real diagnostics behind it — `code !== 0` with `diagnostics.length > 0`, so the vacuous-green
 * guard below does not catch it. `check.mjs` reruns without the unparseable files instead; see its doc
 * comment.
 *
 * The container's working directory is the mounted tree root (`/tree`), because `tsc` reports each
 * diagnostic's file relative to the process's current directory. Running from `/tree` is what makes a
 * diagnostic's `file` come back as `<versionDir>/<spec>/...` — exactly the shape {@link attribute}
 * matches against.
 *
 * Roots go into the tsconfig's `files`, listed from the host tree, not an `include` glob: TypeScript 7's
 * wildcard matcher never matches a dot-prefixed entry, not even with a `.*` pattern or the exact name,
 * which would silently drop `models/.ts` (defect 18/21's empty-named model file) from
 * `v3/extreme-names` and `v3/non-ascii-names`.
 */
export async function runTsc(profile: string, units: readonly CompileUnit[]): Promise<Map<string, Diagnostic[]>> {
  const results = new Map<string, Diagnostic[]>(units.map((unit) => [unit.id, []]));
  if (units.length === 0) return results;

  const image = await buildImage('node', CONTEXT_DIR);

  const runDir = await mkdtemp(join(tmpdir(), 'goast-tsc-'));
  try {
    const treeRoot = join(repoRootDir, 'test', 'output', 'typescript', profile);
    const files = ['/opt/goast/k6-jslib.d.ts'];
    for (const unit of units) {
      for (const file of await walkFiles(unit.treeDir)) {
        if (!SOURCE_FILE.test(file)) continue;
        const path = relative(unit.treeDir, file).replace(/\\/g, '/');
        files.push(`${TREE_MOUNT}/${unit.versionDir}/${unit.spec}/${path}`);
      }
    }
    await writeFile(
      join(runDir, 'tsconfig.json'),
      JSON.stringify(
        {
          extends: '/opt/goast/tsconfig.base.json',
          files,
        },
        null,
        2,
      ) + '\n',
    );

    const { code, stdout, stderr, timedOut } = await runContainer({
      image,
      args: [`${CONFIG_MOUNT}/tsconfig.json`],
      mounts: [
        { source: treeRoot, target: TREE_MOUNT, readOnly: true },
        { source: runDir, target: CONFIG_MOUNT, readOnly: true },
      ],
      workdir: TREE_MOUNT,
    });

    // A killed run's output is whatever happened to be flushed before the signal landed — neither
    // "clean" nor "these are all the diagnostics" is a safe reading of it, so this is a harness failure,
    // not a unit result, exactly like the vacuous-green check below treats a format break.
    if (timedOut) {
      throw new Error(
        `tsc timed out for profile ${profile}. Its output cannot be trusted as a complete result.\n\n` +
          stdout +
          stderr,
      );
    }

    const output = stdout + stderr;
    if (output.split('\n').some((line) => line.startsWith(FATAL_MARKER))) {
      throw new Error(`check.mjs could not check profile ${profile}.\n\n${output}`);
    }

    const rootFiles: string[] = [];
    const diagnosticLines: string[] = [];
    for (const line of output.split('\n')) {
      const match = ROOT_MARKER.exec(line);
      if (match !== null) {
        rootFiles.push(match[1]);
      } else {
        diagnosticLines.push(line);
      }
    }

    // A unit that contributed zero files to the program compiles trivially and reports nothing — the
    // same "vacuously clean" shape as a real pass.
    const uncovered = units.filter((unit) => {
      const prefix = `${unit.versionDir}/${unit.spec}/`;
      return !rootFiles.some((file) => file.startsWith(prefix));
    });
    if (uncovered.length > 0) {
      throw new Error(
        `${uncovered.length} unit(s) in profile ${profile} contributed no files to the tsc program: ` +
          `${uncovered.map((u) => u.id).join(', ')}. Their tree holds no TypeScript or JavaScript source; ` +
          'a unit reporting no diagnostics for this reason has not actually been checked.',
      );
    }

    const diagnostics = parseTscDiagnostics(diagnosticLines.join('\n'))
      // `check.mjs` passes on `tsc`'s output, which reports each file relative to the container's working
      // directory, which `runContainer` sets to `TREE_MOUNT` above. Restoring the `TREE_MOUNT` prefix
      // here is what lets `attribute`, `relativizeDiagnostic`, and `normalizeMessageUrls` below treat a
      // diagnostic's file exactly like the host `tsc` runner does: an absolute, container-rooted
      // path to relativize against a unit's own tree.
      .map((diagnostic) =>
        diagnostic.file === '' ? diagnostic : { ...diagnostic, file: `${TREE_MOUNT}/${diagnostic.file}` },
      );

    if (code !== 0 && diagnostics.length === 0) {
      throw new Error(
        `tsc exited ${code} for profile ${profile} but no diagnostics were parsed. ` +
          'The output format has probably changed; the gate would be vacuously green.\n\n' +
          output,
      );
    }

    for (const diagnostic of diagnostics) {
      const unit = attribute(diagnostic, units);
      if (unit === undefined) {
        throw new Error(
          `Could not attribute a diagnostic to a unit in profile ${profile}: ` +
            `${diagnostic.file}:${diagnostic.line} ${diagnostic.message}`,
        );
      }
      const treeDir = `${TREE_MOUNT}/${unit.versionDir}/${unit.spec}`;
      results.get(unit.id)!.push({
        ...relativizeDiagnostic(diagnostic, treeDir),
        message: normalizeMessageUrls(diagnostic.message, treeDir),
      });
    }

    return results;
  } finally {
    await rm(runDir, { recursive: true, force: true });
  }
}

/** Longest matching prefix, so `v3/a` never claims a diagnostic belonging to `v3/ab`. */
function attribute(diagnostic: Diagnostic, units: readonly CompileUnit[]): CompileUnit | undefined {
  let best: CompileUnit | undefined;
  for (const unit of units) {
    const prefix = `${TREE_MOUNT}/${unit.versionDir}/${unit.spec}/`;
    if (!diagnostic.file.startsWith(prefix)) continue;
    if (best === undefined || prefix.length > `${TREE_MOUNT}/${best.versionDir}/${best.spec}/`.length) {
      best = unit;
    }
  }
  return best;
}
