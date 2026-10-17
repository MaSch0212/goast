import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildImage,
  type CompileUnit,
  CSHARP_TARGET_FRAMEWORK,
  csharpPackageReferences,
  type Diagnostic,
  parseCSharpDiagnostics,
  relativizeDiagnostic,
  repoRootDir,
  runContainer,
} from '@goast/test-harness';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'csharp');
const TREE_MOUNT = '/output';
const WORK_MOUNT = '/work';
/** The synthesized solution, projects and nuget.config, which the image's entrypoint copies into {@link WORK_MOUNT}. */
const SEED_MOUNT = '/seed';

/**
 * The MSBuild project name for one compile unit: `u` plus 12 hex characters of SHA-1 of the unit id.
 *
 * Hashed from {@link CompileUnit.id} (relative, machine-independent) rather than the absolute `treeDir`,
 * and for the same reasons as the Kotlin runner's Gradle project ids: the name is stable when other
 * units are added or removed, and it is legal as a directory and assembly name whatever the profile or
 * version dir contains (`@`, `.`).
 */
export function csharpProjectId(unit: CompileUnit): string {
  return `u${createHash('sha1').update(unit.id).digest('hex').slice(0, 12)}`;
}

/** Where a unit's committed tree is mounted inside the container. */
function containerTreeDir(unit: CompileUnit, treeMount: string): string {
  return `${treeMount}/csharp/${unit.profile}/${unit.versionDir}/${unit.spec}`;
}

/**
 * Generates the files of a one-project-per-unit build: a `.slnx` listing every project, one `.csproj`
 * per unit, and a `nuget.config` that clears every package source.
 *
 * Each project is a `Microsoft.NET.Sdk.Web` library, so ASP.NET Core (`Microsoft.AspNetCore.App`,
 * which also carries `IHttpClientFactory`) is available without a package. `FastEndpoints` is
 * referenced by every project: the generated models never touch it and the compiler ignores unused
 * references, so there is no per-profile dependency table to keep in sync. Sources are *included from
 * the read-only tree mount* — nothing is copied — so `obj`/`bin` land in the project dir under `/work`.
 *
 * Restore is offline by construction. Package versions come from `CSHARP_PACKAGES`, the image
 * restored exactly those into `NUGET_PACKAGES` at build time, and `nuget.config` has no sources, so a
 * version that was not warmed fails loudly with `NU1101` rather than reaching for the network.
 * `NuGetAudit` is off because the audit's vulnerability lookup is a network call whose failure is a
 * warning, which `TreatWarningsAsErrors` would turn into a spurious error.
 */
export function synthesizeCSharpBuild(
  units: readonly CompileUnit[],
  treeMount: string,
): {
  solution: string;
  nugetConfig: string;
  projects: Map<string, string>;
  projectIds: Map<string, string>;
} {
  const projectIds = new Map<string, string>();
  const projects = new Map<string, string>();
  const unitIdByProjectId = new Map<string, string>();

  for (const unit of units) {
    const projectId = csharpProjectId(unit);
    const collidesWith = unitIdByProjectId.get(projectId);
    if (collidesWith !== undefined) {
      throw new Error(
        `C# project id ${projectId} is shared by "${collidesWith}" and "${unit.id}". Widen the slice in ` +
          'csharpProjectId; do not deduplicate, both units need their own project.',
      );
    }
    unitIdByProjectId.set(projectId, unit.id);
    projectIds.set(unit.id, projectId);

    // `@` starts an item-list reference in MSBuild; `%40` is its escape and is unescaped on evaluation.
    const glob = `${containerTreeDir(unit, treeMount)}/**/*.cs`.replace(/@/g, '%40');
    projects.set(
      projectId,
      [
        '<Project Sdk="Microsoft.NET.Sdk.Web">',
        '  <PropertyGroup>',
        `    <TargetFramework>${CSHARP_TARGET_FRAMEWORK}</TargetFramework>`,
        '    <OutputType>Library</OutputType>',
        `    <AssemblyName>${projectId}</AssemblyName>`,
        '    <Nullable>enable</Nullable>',
        '    <ImplicitUsings>disable</ImplicitUsings>',
        '    <LangVersion>latest</LangVersion>',
        '    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>',
        '    <NuGetAudit>false</NuGetAudit>',
        '    <EnableDefaultCompileItems>false</EnableDefaultCompileItems>',
        '  </PropertyGroup>',
        '  <ItemGroup>',
        `    <Compile Include="${glob}" />`,
        ...csharpPackageReferences(['FastEndpoints']).map((line) => `    ${line}`),
        '  </ItemGroup>',
        '</Project>',
        '',
      ].join('\n'),
    );
  }

  const solution =
    ['<Solution>', ...[...projects.keys()].map((id) => `  <Project Path="${id}/${id}.csproj" />`), '</Solution>'].join(
      '\n',
    ) + '\n';

  const nugetConfig =
    [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<configuration>',
      '  <packageSources>',
      '    <clear />',
      '  </packageSources>',
      '</configuration>',
    ].join('\n') + '\n';

  return { solution, nugetConfig, projects, projectIds };
}

/**
 * Compiles every C# unit in one `dotnet build` of a generated solution.
 *
 * Same contract as `runKotlin`: one entry per unit, diagnostics relative to the unit's tree, and a throw
 * whenever a unit's empty result could mean "not checked" rather than "clean". Each project is its own
 * `csc` invocation over its own sources, so one unit's failure cannot hide another's diagnostics, and
 * MSBuild continues past a failed project by default.
 *
 * `outputDir` is the host directory mounted at `/output`; only tests of the runner itself override it.
 */
export async function runCSharp(
  units: readonly CompileUnit[],
  options: { outputDir?: string } = {},
): Promise<Map<string, Diagnostic[]>> {
  const results = new Map<string, Diagnostic[]>(units.map((unit) => [unit.id, []]));
  if (units.length === 0) return results;

  const image = await buildImage('csharp', CONTEXT_DIR);
  const { solution, nugetConfig, projects, projectIds } = synthesizeCSharpBuild(units, TREE_MOUNT);

  const seedDir = await mkdtemp(join(tmpdir(), 'goast-csharp-seed-'));
  try {
    await writeFile(join(seedDir, 'goast-compile-gate.slnx'), solution);
    await writeFile(join(seedDir, 'nuget.config'), nugetConfig);
    for (const [projectId, content] of projects) {
      await mkdir(join(seedDir, projectId));
      await writeFile(join(seedDir, projectId, `${projectId}.csproj`), content);
    }

    const { code, stdout, stderr, timedOut } = await runContainer({
      image,
      mounts: [
        { source: options.outputDir ?? join(repoRootDir, 'test', 'output'), target: TREE_MOUNT, readOnly: true },
        { source: seedDir, target: SEED_MOUNT, readOnly: true },
      ],
      workdir: WORK_MOUNT,
      timeoutMs: 30 * 60 * 1000,
    });

    if (timedOut) {
      throw new Error(
        `dotnet build timed out compiling ${units.length} C# unit(s). Its output cannot be trusted as a ` +
          `complete result.\n\n${stdout}${stderr}`,
      );
    }

    const output = stdout + stderr;
    const diagnostics = parseCSharpDiagnostics(output);

    if (code !== 0 && diagnostics.length === 0) {
      throw new Error(
        `dotnet build exited ${code} but no C# diagnostics were parsed. Either the output format changed ` +
          'and the gate would be vacuously green, or the build itself failed to start.\n\n' +
          output,
      );
    }

    for (const diagnostic of diagnostics) {
      const unit = attribute(diagnostic, units, projectIds);
      if (unit === undefined) {
        throw new Error(`Could not attribute a C# diagnostic to a unit: ${diagnostic.file} ${diagnostic.message}`);
      }
      const treeDir = containerTreeDir(unit, TREE_MOUNT);
      const projectDir = `${WORK_MOUNT}/${projectIds.get(unit.id)}`;
      const relative = relativizeDiagnostic(diagnostic, treeDir);
      results.get(unit.id)!.push({
        ...relative,
        // A project-level error (restore, SDK) is blamed on the csproj under /work, whose name is a
        // hash: say "no file" rather than snapshotting an internal path.
        file: relative.file.startsWith(`${projectDir}/`) ? '' : relative.file,
        message: relative.message.replaceAll(`${treeDir}/`, '').replaceAll(`${projectDir}/`, ''),
      });
    }

    // MSBuild prints `<assembly> -> <dll>` for each project that built. A unit with neither that line
    // nor a diagnostic never ran (or died without saying why), so its empty result proves nothing.
    const built = new Set<string>();
    for (const match of output.matchAll(/^\s*(u[0-9a-f]{12}) -> /gm)) built.add(match[1]);
    const unchecked = units.filter((unit) => {
      const projectId = projectIds.get(unit.id)!;
      return !built.has(projectId) && results.get(unit.id)!.length === 0;
    });
    if (unchecked.length > 0) {
      throw new Error(
        `${unchecked.length} unit(s) neither built nor produced a diagnostic: ` +
          `${unchecked.map((u) => u.id).join(', ')}. They cannot be recorded as clean.\n\n${output}`,
      );
    }

    return results;
  } finally {
    await rm(seedDir, { recursive: true, force: true }).catch((error: unknown) => {
      console.warn(
        `could not remove the C# seed directory ${seedDir}: ${error instanceof Error ? error.message : error}. ` +
          'Leaving it behind rather than failing a run whose results are already computed.',
      );
    });
  }
}

/** By tree path for a positioned diagnostic, by project dir for a project-level one. Longest prefix wins. */
function attribute(
  diagnostic: Diagnostic,
  units: readonly CompileUnit[],
  projectIds: ReadonlyMap<string, string>,
): CompileUnit | undefined {
  let best: CompileUnit | undefined;
  let bestLength = -1;
  for (const unit of units) {
    for (const prefix of [`${containerTreeDir(unit, TREE_MOUNT)}/`, `${WORK_MOUNT}/${projectIds.get(unit.id)}/`]) {
      if (diagnostic.file.startsWith(prefix) && prefix.length > bestLength) {
        best = unit;
        bestLength = prefix.length;
      }
    }
  }
  return best;
}
