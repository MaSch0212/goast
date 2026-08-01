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

  it('reads the Spring Boot line from the config variant, including the strict suffixes', () => {
    const { build } = synthesizeGradleBuild([
      unit('spring-controllers@sb4-strict', 'v3', 'a'),
      unit('spring-controllers@sb3-strict', 'v3', 'b'),
    ], '/output');

    expect(build).toContain('spring-boot-dependencies:4.0.0');
    expect(build).toContain('spring-boot-dependencies:3.5.6');
  });

  it('gives a family whose two variants differ their own dependency lines, not one merged set', () => {
    const [sb3, sb4] = (['sb3', 'sb4'] as const).map((variant) =>
      synthesizeGradleBuild([unit(`okhttp3-clients@${variant}`, 'v3', 'a')], '/output').build
    );

    // `okhttp3-clients@sb4` is generated against Jackson 3 and `@sb3` against Jackson 2. Before Task 6
    // `DEPENDENCIES` was keyed by family alone, so the two necessarily got identical lines and sb4
    // could not resolve `tools.jackson.*` at all.
    expect(sb4).toContain('tools.jackson.module:jackson-module-kotlin');
    expect(sb4).not.toContain('com.fasterxml.jackson.module:jackson-module-kotlin');
    expect(sb3).toContain('com.fasterxml.jackson.module:jackson-module-kotlin');
    expect(sb3).not.toContain('tools.jackson');

    // The shared lines still reach both.
    for (const build of [sb3, sb4]) {
      expect(build).toContain('com.fasterxml.jackson.core:jackson-annotations');
      expect(build).toContain('com.squareup.okhttp3:okhttp');
    }
  });

  it('numbers subprojects in unit order and pads so names sort lexicographically', () => {
    const units = Array.from({ length: 11 }, (_, i) => unit('models@sb3', 'v3', `s${i}`));
    const { projectIds } = synthesizeGradleBuild(units, '/output');
    expect(projectIds.get('kotlin/models@sb3/v3/s0')).toBe('u0001');
    expect(projectIds.get('kotlin/models@sb3/v3/s10')).toBe('u0011');
  });
});
