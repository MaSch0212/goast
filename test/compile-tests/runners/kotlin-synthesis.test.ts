import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { CompileUnit } from '@goast/test-harness';
import {
  gradleProjectId,
  gradleProperties,
  resolveGradleWorkMode,
  scanTaskLines,
  synthesizeGradleBuild,
} from './kotlin.ts';

const unit = (profile: string, versionDir: 'v3' | 'v3.1', spec: string): CompileUnit => ({
  language: 'kotlin',
  profile,
  versionDir,
  spec,
  treeDir: `/ignored/${profile}/${versionDir}/${spec}`,
  id: `kotlin/${profile}/${versionDir}/${spec}`,
});

describe('synthesizeGradleBuild', () => {
  it('keeps an @ in a profile and a dot in a version out of the project name', () => {
    const target = unit('models@sb3', 'v3.1', 'webhooks');
    const { settings, projectIds } = synthesizeGradleBuild([target], '/output');

    expect(settings).toContain(`include("${gradleProjectId(target)}")`);
    expect(settings).not.toContain('@');
    expect(projectIds.get('kotlin/models@sb3/v3.1/webhooks')).toMatch(/^u[0-9a-f]{12}$/);
  });

  // The property the persistent work dir depends on. With the old index-derived names, inserting one
  // spec renamed every later subproject, changed each one's srcDir, and forced a recompile of nearly
  // the whole corpus — in precisely the case caching exists to make fast.
  it('gives a unit the same project name however many units precede it', () => {
    const target = unit('okhttp3-clients@sb4', 'v3', 'pets');
    const others = Array.from({ length: 7 }, (_, i) => unit('models@sb3', 'v3', `earlier${i}`));

    const alone = synthesizeGradleBuild([target], '/output').projectIds.get(target.id);
    const preceded = synthesizeGradleBuild([...others, target], '/output').projectIds.get(target.id);

    expect(preceded).toBe(alone);
  });

  it('gives two different units different project names', () => {
    const units = [unit('models@sb3', 'v3', 'a'), unit('models@sb3', 'v3', 'b'), unit('models@sb4', 'v3', 'a')];
    const { projectIds } = synthesizeGradleBuild(units, '/output');

    expect(new Set(projectIds.values()).size).toBe(units.length);
  });

  // A host-derived name would differ per machine, so nothing could be shared and the build script would
  // carry someone's checkout path. `treeDir` is absolute; the id is not.
  it('derives the name from the relative unit id, not the absolute tree path', () => {
    const here = { ...unit('models@sb3', 'v3', 'a'), treeDir: 'C:/checkout-a/test/output/kotlin/models@sb3/v3/a' };
    const there = {
      ...unit('models@sb3', 'v3', 'a'),
      treeDir: '/home/someone/goast/test/output/kotlin/models@sb3/v3/a',
    };

    expect(gradleProjectId(here)).toBe(gradleProjectId(there));
  });

  // Without this, reuse across runs is unsound in exactly one way: a JDK bump changes what the
  // compiler does, and it is the only such input Gradle does not hash on its own.
  it('declares the JDK as a compileKotlin input so a JDK bump invalidates the task', () => {
    const { build } = synthesizeGradleBuild([unit('models@sb3', 'v3', 'a')], '/output');

    expect(build).toContain('tasks.matching { it.name == "compileKotlin" }.configureEach {');
    expect(build).toContain('inputs.property("jvmVersion", System.getProperty("java.vm.version"))');
  });

  // The local build cache has to live inside the project dir, because the project dir is the only
  // thing that persists between runs — GRADLE_USER_HOME is a discarded container layer.
  it('pins the build cache directory inside the project dir', () => {
    const { settings } = synthesizeGradleBuild([unit('models@sb3', 'v3', 'a')], '/output');

    expect(settings).toContain('buildCache { local { directory = File(rootDir, ".build-cache") } }');
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

  it('returns a project id for every unit it was given', () => {
    const units = Array.from({ length: 11 }, (_, i) => unit('models@sb3', 'v3', `s${i}`));
    const { projectIds, settings } = synthesizeGradleBuild(units, '/output');

    expect(projectIds.size).toBe(units.length);
    for (const u of units) expect(settings).toContain(`include("${projectIds.get(u.id)}")`);
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

  // Two different meanings that must not share a bucket. UP-TO-DATE and FROM-CACHE mean Gradle reused
  // a prior *successful* result, so zero errors is the right answer for them; SKIPPED means the task
  // was disabled or excluded and never succeeded at all, so it carries no evidence either way.
  //
  // The original regression this guards is still guarded: all three used to be matched by TASK_LINE,
  // added to `printed`, and then classified as neither NO-SOURCE nor FAILED — recorded as "ran and
  // clean" by falling through every branch. Each now lands in a bucket named for what it means.
  it('separates reuse of a successful result from a task that was never run', () => {
    const states = scanTaskLines([
      '> Task :u0001:compileKotlin UP-TO-DATE',
      '> Task :u0002:compileKotlin FROM-CACHE',
      '> Task :u0003:compileKotlin SKIPPED',
    ].join('\n'));

    expect([...states.reused]).toEqual([['u0001', 'UP-TO-DATE'], ['u0002', 'FROM-CACHE']]);
    expect([...states.notExecuted]).toEqual([['u0003', 'SKIPPED']]);
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
    expect([...scanTaskLines('> Task :u0001:compileKotlin UP-TO-DATE\r\n').reused])
      .toEqual([['u0001', 'UP-TO-DATE']]);
  });
});

describe('gradleProperties', () => {
  it('raises the heap in both modes, because configuring this many subprojects needs it', () => {
    for (const mode of ['persistent', 'ephemeral'] as const) {
      expect(gradleProperties(mode)).toContain('org.gradle.jvmargs=-Xmx3g');
    }
  });

  it('enables both caches when the project dir survives the run', () => {
    const properties = gradleProperties('persistent');

    expect(properties).toContain('org.gradle.caching=true');
    expect(properties).toContain('org.gradle.configuration-cache=true');
  });

  // Measured: leaving these on for an ephemeral run cost 12m06s -> 15m50s, all of it spent storing
  // caches into a directory that is deleted before anything can read them.
  it('leaves both caches off when the project dir is thrown away, so storing them costs nothing', () => {
    const properties = gradleProperties('ephemeral');

    expect(properties).not.toContain('caching');
    expect(properties).not.toContain('configuration-cache');
  });
});

describe('resolveGradleWorkMode', () => {
  const env = (values: Record<string, string>) => (key: string): string | undefined => values[key];

  it('defaults to persistent locally, where iteration speed is the point', () => {
    expect(resolveGradleWorkMode(env({}))).toBe('persistent');
  });

  it('defaults to ephemeral on CI, so the clean-room result reuses nothing', () => {
    expect(resolveGradleWorkMode(env({ CI: 'true' }))).toBe('ephemeral');
  });

  it('reads a falsy CI the same as no CI at all', () => {
    for (const value of ['', '0', 'false']) {
      expect(resolveGradleWorkMode(env({ CI: value }))).toBe('persistent');
    }
  });

  // The override has to work in both directions: forcing a cold run locally to reproduce a CI result,
  // and forcing reuse on CI once phase 8 gives it somewhere to persist to.
  it('lets GOAST_GRADLE_CACHE override the CI default either way', () => {
    expect(resolveGradleWorkMode(env({ CI: 'true', GOAST_GRADLE_CACHE: '1' }))).toBe('persistent');
    expect(resolveGradleWorkMode(env({ GOAST_GRADLE_CACHE: '0' }))).toBe('ephemeral');
  });

  it('ignores an empty GOAST_GRADLE_CACHE rather than reading it as off', () => {
    expect(resolveGradleWorkMode(env({ GOAST_GRADLE_CACHE: '' }))).toBe('persistent');
    expect(resolveGradleWorkMode(env({ CI: 'true', GOAST_GRADLE_CACHE: '' }))).toBe('ephemeral');
  });
});
