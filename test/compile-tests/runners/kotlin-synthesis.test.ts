import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { CompileUnit } from '@goast/test-harness';
import { scanTaskLines, synthesizeGradleBuild } from './kotlin.ts';

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

describe('scanTaskLines', () => {
  it('treats an empty suffix as executed, and nothing else', () => {
    const states = scanTaskLines('> Task :u0001:compileKotlin\n');
    expect([...states.printed]).toEqual(['u0001']);
    expect([...states.noSource]).toEqual([]);
    expect([...states.failed]).toEqual([]);
    expect([...states.notExecuted]).toEqual([]);
    expect([...states.unknown]).toEqual([]);
  });

  it('classifies NO-SOURCE and FAILED', () => {
    const states = scanTaskLines(
      ['> Task :u0001:compileKotlin NO-SOURCE', '> Task :u0002:compileKotlin FAILED'].join('\n'),
    );
    expect([...states.noSource]).toEqual(['u0001']);
    expect([...states.failed]).toEqual(['u0002']);
    expect([...states.notExecuted]).toEqual([]);
    expect([...states.unknown]).toEqual([]);
  });

  // The regression this exists for: all three were previously matched by TASK_LINE, added to
  // `printed`, and then classified as neither NO-SOURCE nor FAILED — i.e. recorded as "ran and clean"
  // while Gradle had not read a single source file.
  it('classifies every state in which Gradle declined to run the task', () => {
    const states = scanTaskLines([
      '> Task :u0001:compileKotlin UP-TO-DATE',
      '> Task :u0002:compileKotlin FROM-CACHE',
      '> Task :u0003:compileKotlin SKIPPED',
    ].join('\n'));

    expect([...states.notExecuted]).toEqual([['u0001', 'UP-TO-DATE'], ['u0002', 'FROM-CACHE'], ['u0003', 'SKIPPED']]);
    expect([...states.noSource]).toEqual([]);
    expect([...states.failed]).toEqual([]);
    expect([...states.unknown]).toEqual([]);
  });

  it('isolates a suffix it does not recognise rather than reading it as success', () => {
    const states = scanTaskLines('> Task :u0007:compileKotlin SOMETHING-NEW\n');
    expect([...states.unknown]).toEqual([['u0007', 'SOMETHING-NEW']]);
    expect([...states.printed]).toEqual(['u0007']);
    expect([...states.noSource]).toEqual([]);
    expect([...states.failed]).toEqual([]);
    expect([...states.notExecuted]).toEqual([]);
  });

  // Real Gradle output: a task that prints diagnostics before failing emits a bare header *and* a
  // FAILED line, and the log is full of lines that are not task headers at all.
  it('tolerates a project printing both a bare header and a FAILED line, and ignores other output', () => {
    const states = scanTaskLines([
      '> Task :u0004:compileKotlin',
      'e: file:///output/kotlin/models@sb3/v3/a/A.kt:1:1 Name expected',
      '> Task :u0004:compileKotlin FAILED',
      '> Task :u0004:compileJava SKIPPED',
      'FAILURE: Build completed with 1 failure.',
    ].join('\n'));

    expect([...states.printed]).toEqual(['u0004']);
    expect([...states.failed]).toEqual(['u0004']);
    expect([...states.notExecuted]).toEqual([]);
    expect([...states.unknown]).toEqual([]);
  });

  it('ignores a trailing carriage return, so a CRLF log classifies the same', () => {
    expect([...scanTaskLines('> Task :u0001:compileKotlin UP-TO-DATE\r\n').notExecuted])
      .toEqual([['u0001', 'UP-TO-DATE']]);
  });
});
