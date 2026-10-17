import { describe, expect, it } from 'vitest';

import { type CompileUnit, CSHARP_PACKAGES } from '@goast/test-harness';
import { csharpProjectId, synthesizeCSharpBuild } from './csharp.ts';

const unit = (profile: string, versionDir: 'v3' | 'v3.1', spec: string): CompileUnit => ({
  language: 'csharp',
  profile,
  versionDir,
  spec,
  treeDir: `/ignored/${profile}/${versionDir}/${spec}`,
  id: `csharp/${profile}/${versionDir}/${spec}`,
});

describe('synthesizeCSharpBuild', () => {
  it('keeps an @ in a profile and a dot in a version out of the project name', () => {
    const target = unit('models@x', 'v3.1', 'webhooks');
    const { solution, projectIds } = synthesizeCSharpBuild([target], '/output');

    expect(solution).toContain(`Path="${csharpProjectId(target)}/${csharpProjectId(target)}.csproj"`);
    expect(solution).not.toContain('@');
    expect(projectIds.get(target.id)).toMatch(/^u[0-9a-f]{12}$/);
  });

  it('gives a unit the same project name however many units precede it', () => {
    const target = unit('http-clients', 'v3', 'pets');
    const others = Array.from({ length: 7 }, (_, i) => unit('models', 'v3', `earlier${i}`));

    const alone = synthesizeCSharpBuild([target], '/output').projectIds.get(target.id);
    const preceded = synthesizeCSharpBuild([...others, target], '/output').projectIds.get(target.id);

    expect(preceded).toBe(alone);
  });

  it('gives different units different project names', () => {
    const units = [unit('models', 'v3', 'a'), unit('models', 'v3', 'b'), unit('fastendpoints', 'v3', 'a')];
    const { projectIds } = synthesizeCSharpBuild(units, '/output');

    expect(new Set(projectIds.values()).size).toBe(units.length);
  });

  it('derives the name from the relative unit id, not the absolute tree path', () => {
    const here = { ...unit('models', 'v3', 'a'), treeDir: 'C:/checkout-a/test/output/csharp/models/v3/a' };
    const there = { ...unit('models', 'v3', 'a'), treeDir: '/home/someone/goast/test/output/csharp/models/v3/a' };

    expect(csharpProjectId(here)).toBe(csharpProjectId(there));
  });

  it('writes a strict ASP.NET Core library project that includes the tree from the mount', () => {
    const target = unit('models', 'v3', 'a');
    const { projects } = synthesizeCSharpBuild([target], '/output');
    const csproj = projects.get(csharpProjectId(target))!;

    expect(csproj).toContain('<Project Sdk="Microsoft.NET.Sdk.Web">');
    expect(csproj).toContain('<TargetFramework>net10.0</TargetFramework>');
    expect(csproj).toContain('<OutputType>Library</OutputType>');
    expect(csproj).toContain('<Nullable>enable</Nullable>');
    expect(csproj).toContain('<ImplicitUsings>disable</ImplicitUsings>');
    expect(csproj).toContain('<TreatWarningsAsErrors>true</TreatWarningsAsErrors>');
    expect(csproj).toContain('<LangVersion>latest</LangVersion>');
    expect(csproj).toContain('<EnableDefaultCompileItems>false</EnableDefaultCompileItems>');
    expect(csproj).toContain('<Compile Include="/output/csharp/models/v3/a/**/*.cs" />');
  });

  it('escapes @ in the tree path so MSBuild does not read it as an item list', () => {
    const target = unit('models@x', 'v3', 'a');
    const { projects } = synthesizeCSharpBuild([target], '/output');

    expect(projects.get(csharpProjectId(target))).toContain('/output/csharp/models%40x/v3/a/**/*.cs');
  });

  it('references the pinned packages and turns the network-bound audit off', () => {
    const target = unit('models', 'v3', 'a');
    const csproj = synthesizeCSharpBuild([target], '/output').projects.get(csharpProjectId(target))!;

    expect(csproj).toContain(`<PackageReference Include="FastEndpoints" Version="${CSHARP_PACKAGES.FastEndpoints}" />`);
    expect(csproj).toContain('<NuGetAudit>false</NuGetAudit>');
  });

  it('clears every package source so a missing package cannot reach the network', () => {
    const { nugetConfig } = synthesizeCSharpBuild([unit('models', 'v3', 'a')], '/output');

    expect(nugetConfig).toContain('<clear />');
    expect(nugetConfig).not.toContain('<add ');
  });

  it('throws on a project id collision rather than sharing a project', () => {
    const a = unit('models', 'v3', 'a');
    expect(() => synthesizeCSharpBuild([a, { ...a }], '/output')).toThrow('shared by');
  });
});
