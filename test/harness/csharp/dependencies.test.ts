import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRootDir } from '../paths.ts';
import { CSHARP_PACKAGES, CSHARP_TARGET_FRAMEWORK, csharpPackageReferences } from './dependencies.ts';

describe('CSHARP_PACKAGES', () => {
  // The warmup project is what makes offline builds possible, so a version that differs here would be
  // an offline `NU1101` the first time a synthesized project asks for it.
  it('matches the packages and target framework the warmup project restores', async () => {
    const csproj = await readFile(join(repoRootDir, 'test', 'docker', 'csharp', 'warmup', 'Warmup.csproj'), 'utf8');

    const warmed = [...csproj.matchAll(/<PackageReference Include="([^"]+)" Version="([^"]+)"/g)].map(
      (m) => [m[1], m[2]] as const,
    );
    expect(Object.fromEntries(warmed)).toEqual(CSHARP_PACKAGES);
    expect(csproj).toContain(`<TargetFramework>${CSHARP_TARGET_FRAMEWORK}</TargetFramework>`);
  });
});

describe('csharpPackageReferences', () => {
  it('renders one pinned PackageReference per name', () => {
    expect(csharpPackageReferences(['FastEndpoints'])).toEqual([
      `<PackageReference Include="FastEndpoints" Version="${CSHARP_PACKAGES.FastEndpoints}" />`,
    ]);
  });
});
