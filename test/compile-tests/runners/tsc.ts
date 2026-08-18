import { join } from 'node:path';

import {
  buildImage,
  type CompileUnit,
  type Diagnostic,
  normalizeMessageUrls,
  relativizeDiagnostic,
  repoRootDir,
  runContainer,
} from '@goast/test-harness';
import { parseTscDiagnostics } from '../../harness/compile/parse-tsc.ts';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'node');
const TREE_MOUNT = '/tree';
const CONFIG_MOUNT = '/run';

/** Prefix `check.mjs` puts before each root file it reports — see that file's doc comment. */
const ROOT_MARKER = /^##GOAST-ROOT## (.+)$/;

/**
 * Type-checks a containerized TypeScript profile with one `tsc` program.
 *
 * The generated `tsconfig.json` extends the image's base and lists every unit's directory, so one
 * program covers the whole profile. Units never import across unit boundaries, so a shared program is
 * safe; if that ever changes, a cross-unit import would surface as a resolution error naming both
 * paths, which is the right way to find out.
 *
 * The container's entrypoint is `check.mjs`, not the `tsc` binary — see that file's doc comment in
 * `test/docker/node/check.mjs`. Verified directly against this corpus: the `tsc` CLI drops every
 * semantic diagnostic for an entire program the moment *any* file in it has a syntax error, and every
 * profile's `v3/non-ascii-names` unit has one (defect 21). One combined `tsc --noEmit` per profile would
 * therefore silently report only that unit's syntax errors and hide every other unit's real diagnostics
 * — `code !== 0` with `diagnostics.length > 0`, so the vacuous-green guard below does not catch it.
 * `check.mjs` calls the compiler API's `getPreEmitDiagnostics` directly, which has no such short-circuit,
 * while keeping the one-program-per-profile shape (and its cost: a handful of container starts instead
 * of 162).
 *
 * The container's working directory is the mounted tree root (`/tree`), not `/opt/goast`: `tsc`
 * (and `check.mjs`, which renders diagnostics with the same `convertToRelativePath` the CLI uses)
 * reports each diagnostic's file relative to the process's current directory, not as the absolute
 * container path a naive reading of "the tree is mounted at /tree" would suggest. Running from `/tree`
 * is what makes a diagnostic's `file` come back as `<versionDir>/<spec>/...` — exactly the shape
 * {@link attribute} matches against.
 *
 * `include` lists two glob patterns per unit below, not one: the plain recursive-wildcard form, and a
 * second one whose final segment starts with a dot. `tsc`'s wildcard matcher behaves like a shell glob
 * without `dotglob`: the plain form never descends into or matches a dot-prefixed entry. This corpus has
 * exactly one dot-prefixed file per affected spec (`models/.ts`, defect 18/21's empty-named model file),
 * silently dropped from the program by the plain pattern alone. Confirmed directly: `v3/extreme-names`
 * (whose only empty-named schema is that file) exits 0 with only the plain pattern, and reports its real
 * `TS1005`/`TS2304`/`TS1109`/`TS2693` errors once the dot-matching pattern is added; `v3/non-ascii-names`
 * (which also has two non-dot casualties of the same defect, `_1.ts`/`_2.ts`) goes from 8 diagnostics to
 * the correct 12.
 */
export async function runTsc(
  profile: string,
  units: readonly CompileUnit[],
): Promise<Map<string, Diagnostic[]>> {
  const results = new Map<string, Diagnostic[]>(units.map((unit) => [unit.id, []]));
  if (units.length === 0) return results;

  const image = await buildImage('node', CONTEXT_DIR);

  const runDir = await Deno.makeTempDir({ prefix: 'goast-tsc-' });
  try {
    const treeRoot = join(repoRootDir, 'test', 'output', 'typescript', profile);
    const include = units.flatMap((unit) => [
      `${TREE_MOUNT}/${unit.versionDir}/${unit.spec}/**/*`,
      `${TREE_MOUNT}/${unit.versionDir}/${unit.spec}/**/.*`,
    ]);
    await Deno.writeTextFile(
      join(runDir, 'tsconfig.json'),
      JSON.stringify(
        {
          extends: '/opt/goast/tsconfig.base.json',
          include,
          files: ['/opt/goast/k6-jslib.d.ts'],
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
          stdout + stderr,
      );
    }

    const output = stdout + stderr;
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
    // same "vacuously clean" shape as a real pass. `include`'s own dot-file gap above is a real instance
    // of exactly this: before it was fixed, `v3/extreme-names` looked clean for this reason, not because
    // it was.
    const uncovered = units.filter((unit) => {
      const prefix = `${unit.versionDir}/${unit.spec}/`;
      return !rootFiles.some((file) => file.startsWith(prefix));
    });
    if (uncovered.length > 0) {
      throw new Error(
        `${uncovered.length} unit(s) in profile ${profile} contributed no files to the tsc program: ` +
          `${uncovered.map((u) => u.id).join(', ')}. The include pattern is broken for them; ` +
          'a unit reporting no diagnostics for this reason has not actually been checked.',
      );
    }

    const diagnostics = parseTscDiagnostics(diagnosticLines.join('\n'))
      // `check.mjs` (like `tsc` itself) reports each file relative to the container's working
      // directory, which `runContainer` sets to `TREE_MOUNT` above. Restoring the `TREE_MOUNT` prefix
      // here is what lets `attribute`, `relativizeDiagnostic`, and `normalizeMessageUrls` below treat a
      // diagnostic's file exactly like Task 2's `deno check` runner does: an absolute, container-rooted
      // path to relativize against a unit's own tree.
      .map((diagnostic) =>
        diagnostic.file === '' ? diagnostic : { ...diagnostic, file: `${TREE_MOUNT}/${diagnostic.file}` }
      );

    if (code !== 0 && diagnostics.length === 0) {
      throw new Error(
        `tsc exited ${code} for profile ${profile} but no diagnostics were parsed. ` +
          'The output format has probably changed; the gate would be vacuously green.\n\n' + output,
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
    await Deno.remove(runDir, { recursive: true });
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
