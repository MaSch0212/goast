import { describe, expect, it } from 'vitest';

import { SERVER_UNITS, synthesizeServerBuild } from './build.ts';

describe('SERVER_UNITS', () => {
  it('runs the three C# servers', () => {
    expect(SERVER_UNITS.map((u) => u.id)).toEqual([
      'csharp/controllers',
      'csharp/minimal-apis',
      'csharp/fastendpoints',
    ]);
  });
});

describe('synthesizeServerBuild', () => {
  it('compiles the committed tree and the implementations, and nothing else', () => {
    const { project } = synthesizeServerBuild(SERVER_UNITS[1], '/output', '/impl');

    expect(project).toContain('/output/csharp/minimal-apis/integration/kitchen-sink/**/*.cs');
    expect(project).toContain('/impl/common/**/*.cs');
    expect(project).toContain('/impl/minimal-apis/**/*.cs');
    expect(project).not.toContain('/impl/controllers');
    expect(project).toContain('<EnableDefaultCompileItems>false</EnableDefaultCompileItems>');
    expect(project).toContain('<OutputType>Exe</OutputType>');
    expect(project).toContain('Microsoft.NET.Sdk.Web');
  });

  it('references FastEndpoints for the FastEndpoints unit only', () => {
    const [controllers, , fastEndpoints] = SERVER_UNITS.map((u) => synthesizeServerBuild(u, '/o', '/i').project);

    expect(controllers).not.toContain('PackageReference');
    expect(fastEndpoints).toContain('<PackageReference Include="FastEndpoints" Version="8.3.0" />');
  });

  it('restores offline', () => {
    expect(synthesizeServerBuild(SERVER_UNITS[0], '/o', '/i').nugetConfig).toContain('<clear />');
  });
});
