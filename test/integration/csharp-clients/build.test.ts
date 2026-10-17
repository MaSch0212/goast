import { describe, expect, it } from 'vitest';

import { DRIVER_UNITS, synthesizeDriverBuild } from './build.ts';

describe('DRIVER_UNITS', () => {
  it('drives the C# http clients', () => {
    expect(DRIVER_UNITS.map((u) => u.id)).toEqual(['csharp/http-clients']);
  });
});

describe('synthesizeDriverBuild', () => {
  it('compiles the committed tree and the driver, and nothing else', () => {
    const { project } = synthesizeDriverBuild(DRIVER_UNITS[0], '/output', '/drivers');

    expect(project).toContain('/output/csharp/http-clients/integration/kitchen-sink/**/*.cs');
    expect(project).toContain('/drivers/CSharpDriver.cs');
    expect(project).toContain('<EnableDefaultCompileItems>false</EnableDefaultCompileItems>');
    expect(project).toContain('<OutputType>Exe</OutputType>');
  });

  it('restores offline', () => {
    const { nugetConfig } = synthesizeDriverBuild(DRIVER_UNITS[0], '/output', '/drivers');

    expect(nugetConfig).toContain('<clear />');
  });
});
