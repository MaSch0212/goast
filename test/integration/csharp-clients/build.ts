/**
 * Synthesizes the single-project .NET build that runs the C# driver against the reference server, and
 * re-exports the sentinel-line parser every driver shares.
 *
 * Not tier 3's `synthesizeCSharpBuild` (`test/compile-tests/runners/csharp.ts`): that one builds a library
 * per unit into one solution and never executes anything. A driver here has to *run* — real network calls,
 * its own stdout — so it gets its own `Exe` project and its own process, one unit at a time.
 */
import { CSHARP_TARGET_FRAMEWORK } from '@goast/test-harness';

export { CASE_LINE_PREFIX, parseCaseLines } from '../case-lines.ts';

/** One generated C# client tree this phase drives against the reference server. */
export type DriverUnit = {
  /** `csharp/<profile>`, matching the `test/wire/` directory and the `describe` name suffix. */
  id: string;
  /** The profile name used by `casesFor` and `except` entries. */
  profile: string;
  /** Path under the committed `test/output/` tree holding the generated code for this unit. */
  treePath: string;
  /** File name of the hand-written driver. */
  driver: string;
};

export const DRIVER_UNITS: readonly DriverUnit[] = [
  {
    id: 'csharp/http-clients',
    profile: 'csharp/http-clients',
    treePath: 'csharp/http-clients/integration/kitchen-sink',
    driver: 'CSharpDriver.cs',
  },
];

/** The MSBuild project (and assembly) name of the synthesized driver project. */
export const DRIVER_PROJECT = 'driver';

/**
 * Generates the `.csproj` and the offline `nuget.config` of one driver's build.
 *
 * `treeMount` and `driverMount` are container paths. Both sources are *included* from their read-only
 * mounts (nothing is copied), so the driver's calls into the generated namespace resolve without a project
 * reference: the two directories are one compilation. Restore is offline for the same reason as tier 3's:
 * the seeded `nuget.config` clears every source. No `PackageReference` at all: the Web SDK brings ASP.NET Core
 * and `IHttpClientFactory` with it, and referencing `Microsoft.Extensions.Http` on top is NU1510.
 */
export function synthesizeDriverBuild(
  unit: DriverUnit,
  treeMount: string,
  driverMount: string,
): { project: string; nugetConfig: string } {
  // `@` starts an item-list reference in MSBuild; `%40` is its escape.
  const treeGlob = `${treeMount}/${unit.treePath}/**/*.cs`.replace(/@/g, '%40');
  const driverFile = `${driverMount}/${unit.driver}`.replace(/@/g, '%40');

  const project = [
    '<Project Sdk="Microsoft.NET.Sdk.Web">',
    '  <PropertyGroup>',
    `    <TargetFramework>${CSHARP_TARGET_FRAMEWORK}</TargetFramework>`,
    '    <OutputType>Exe</OutputType>',
    `    <AssemblyName>${DRIVER_PROJECT}</AssemblyName>`,
    '    <Nullable>enable</Nullable>',
    '    <ImplicitUsings>disable</ImplicitUsings>',
    '    <LangVersion>latest</LangVersion>',
    '    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>',
    '    <NuGetAudit>false</NuGetAudit>',
    '    <EnableDefaultCompileItems>false</EnableDefaultCompileItems>',
    '  </PropertyGroup>',
    '  <ItemGroup>',
    `    <!-- Driver under test: ${driverFile} -->`,
    `    <Compile Include="${treeGlob}" />`,
    `    <Compile Include="${driverFile}" />`,
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
