/**
 * Synthesizes the single-project .NET build that runs one generated C# server tree as a real ASP.NET Core
 * application, with hand-written implementations supplying the behaviour the case table declares.
 *
 * The C# counterpart of `test/integration/spring-controllers/build.ts` (tier 4's server direction), built from
 * the patterns of `test/integration/csharp-clients/build.ts`: an `Exe` Web project that *includes* the committed
 * tree and the implementation sources from their read-only mounts, restored offline.
 */
import { join } from 'node:path';

import { CSHARP_TARGET_FRAMEWORK, csharpPackageReferences, repoRootDir } from '@goast/test-harness';

/** One generated C# server tree this leg runs as a server. */
export type ServerUnit = {
  /** `csharp/<profile>`, matching the `test/wire/` directory and the `describe` name suffix. */
  id: string;
  /** The generator profile name; identical to `id`. */
  profile: string;
  /** Path under the committed `test/output/` tree holding this unit's generated server code. */
  treePath: string;
  /**
   * Directories under the mounted implementations root that make up this unit's hand-written code, in source
   * order: `common` (shared by all three) and the framework's own.
   */
  implementationDirs: readonly string[];
  /** Whether the unit needs the FastEndpoints package. */
  fastEndpoints: boolean;
};

/** The three units: the three server generators. */
export const SERVER_UNITS: readonly ServerUnit[] = [
  {
    id: 'csharp/controllers',
    profile: 'csharp/controllers',
    treePath: 'csharp/controllers/integration/kitchen-sink',
    implementationDirs: ['common', 'controllers'],
    fastEndpoints: false,
  },
  {
    id: 'csharp/minimal-apis',
    profile: 'csharp/minimal-apis',
    treePath: 'csharp/minimal-apis/integration/kitchen-sink',
    implementationDirs: ['common', 'minimal-apis'],
    fastEndpoints: false,
  },
  {
    id: 'csharp/fastendpoints',
    profile: 'csharp/fastendpoints',
    treePath: 'csharp/fastendpoints/integration/kitchen-sink',
    implementationDirs: ['common', 'fastendpoints'],
    fastEndpoints: true,
  },
];

/** The MSBuild project (and assembly) name of the synthesized server project. */
export const SERVER_PROJECT = 'server';

/** Container path the committed `test/output/` tree is mounted at, read-only. */
export const TREE_MOUNT = '/output';
/** Container path the hand-written implementation sources are mounted at, read-only. */
export const IMPLEMENTATION_MOUNT = '/implementations';
/** Container path the synthesized project and `nuget.config` are mounted at, read-only; copied into the work dir. */
export const SEED_MOUNT = '/seed';
/** Container path the project is built and run in. */
export const WORK_MOUNT = '/work';
/** Port the application listens on inside the container; must match `GoastHost.Port` in the common sources. */
export const SERVER_PORT = 8080;
/** Host path of the implementation sources, mounted at {@link IMPLEMENTATION_MOUNT}. */
export const IMPLEMENTATIONS_DIR: string = join(
  repoRootDir,
  'test',
  'integration',
  'csharp-servers',
  'implementations',
);
/** Host path of the Docker build context of the C# image. */
export const CONTEXT_DIR: string = join(repoRootDir, 'test', 'docker', 'csharp');

/**
 * Generates the `.csproj` and the offline `nuget.config` of one unit's build.
 *
 * `treeMount` and `implementationMount` are container paths. Both sources are included from their read-only
 * mounts (nothing is copied), so the implementations' references to the generated namespaces resolve with no
 * project reference: the two are one compilation. Restore is offline for the same reason as tier 3's: the
 * seeded `nuget.config` clears every source, and the package versions are the warmed ones.
 */
export function synthesizeServerBuild(
  unit: ServerUnit,
  treeMount: string,
  implementationMount: string,
): { project: string; nugetConfig: string } {
  // `@` starts an item-list reference in MSBuild; `%40` is its escape.
  const escape = (path: string) => path.replace(/@/g, '%40');
  const treeGlob = escape(`${treeMount}/${unit.treePath}/**/*.cs`);

  const project = [
    '<Project Sdk="Microsoft.NET.Sdk.Web">',
    '  <PropertyGroup>',
    `    <TargetFramework>${CSHARP_TARGET_FRAMEWORK}</TargetFramework>`,
    '    <OutputType>Exe</OutputType>',
    `    <AssemblyName>${SERVER_PROJECT}</AssemblyName>`,
    '    <Nullable>enable</Nullable>',
    '    <ImplicitUsings>disable</ImplicitUsings>',
    '    <LangVersion>latest</LangVersion>',
    '    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>',
    '    <NuGetAudit>false</NuGetAudit>',
    '    <EnableDefaultCompileItems>false</EnableDefaultCompileItems>',
    '  </PropertyGroup>',
    '  <ItemGroup>',
    `    <Compile Include="${treeGlob}" />`,
    ...unit.implementationDirs.map(
      (dir) => `    <Compile Include="${escape(`${implementationMount}/${dir}`)}/**/*.cs" />`,
    ),
    ...(unit.fastEndpoints ? csharpPackageReferences(['FastEndpoints']).map((line) => `    ${line}`) : []),
    '  </ItemGroup>',
    '</Project>',
    '',
  ].join('\n');

  const nugetConfig =
    [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<configuration>',
      '  <packageSources>',
      '    <clear />',
      '  </packageSources>',
      '</configuration>',
    ].join('\n') + '\n';

  return { project, nugetConfig };
}

/** The shell command that copies the seed into the work dir and runs the server in the foreground. */
export const RUN_COMMAND = `cp -r ${SEED_MOUNT}/. ${WORK_MOUNT}/ && exec dotnet run --project ${WORK_MOUNT}/${SERVER_PROJECT}.csproj -nologo`;
