import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { CompileUnit } from '@goast/test-harness';
import { synthesizeGradleBuild } from './kotlin.ts';

const unit = (profile: string, versionDir: 'v3' | 'v3.1', spec: string): CompileUnit => ({
  language: 'kotlin',
  profile,
  versionDir,
  spec,
  treeDir: `/ignored/${profile}/${versionDir}/${spec}`,
  id: `kotlin/${profile}/${versionDir}/${spec}`,
});

describe('synthesizeGradleBuild', () => {
  it('names subprojects numerically, so an @ in a profile or a dot in a version is never a project name', () => {
    const { settings, projectIds } = synthesizeGradleBuild(
      [unit('models@sb3', 'v3.1', 'webhooks')],
      '/output',
    );

    expect(settings).toContain('include("u0001")');
    expect(settings).not.toContain('@');
    expect(projectIds.get('kotlin/models@sb3/v3.1/webhooks')).toBe('u0001');
  });

  it('points each subproject at its tree under the mount, not at the host path', () => {
    const { build } = synthesizeGradleBuild([unit('models@sb3', 'v3', 'a')], '/output');
    expect(build).toContain('/output/kotlin/models@sb3/v3/a');
    expect(build).not.toContain('/ignored');
  });

  it('gives each profile only its own dependencies', () => {
    const { build } = synthesizeGradleBuild(
      [unit('models@sb3', 'v3', 'a'), unit('okhttp3-clients@sb3', 'v3', 'a')],
      '/output',
    );
    expect(build).toContain('okhttp');
  });

  it('numbers subprojects in unit order and pads so names sort lexicographically', () => {
    const units = Array.from({ length: 11 }, (_, i) => unit('models@sb3', 'v3', `s${i}`));
    const { projectIds } = synthesizeGradleBuild(units, '/output');
    expect(projectIds.get('kotlin/models@sb3/v3/s0')).toBe('u0001');
    expect(projectIds.get('kotlin/models@sb3/v3/s10')).toBe('u0011');
  });
});
