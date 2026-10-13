import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { MAIN_CLASS, SERVER_UNITS, synthesizeServerBuild } from './build.ts';

describe('SERVER_UNITS', () => {
  it('covers both Boot lines crossed with both strictness flavours', () => {
    expect(SERVER_UNITS.map((u) => u.id)).toEqual([
      'spring-controllers@sb3',
      'spring-controllers@sb4',
      'spring-controllers@sb3-strict',
      'spring-controllers@sb4-strict',
    ]);
  });

  it('points every unit at a tree path that matches its profile', () => {
    for (const unit of SERVER_UNITS) {
      expect(unit.treePath).toBe(`kotlin/${unit.profile}/integration/kitchen-sink`);
    }
  });
});

describe('synthesizeServerBuild', () => {
  const lenientSb3 = SERVER_UNITS.find((u) => u.id === 'spring-controllers@sb3')!;
  const strictSb4 = SERVER_UNITS.find((u) => u.id === 'spring-controllers@sb4-strict')!;

  it('names the project and the main class', () => {
    const { settings, build } = synthesizeServerBuild(lenientSb3, '/output', '/delegates');

    expect(settings).toContain('rootProject.name = "server"');
    expect(build).toContain(`mainClass.set("${MAIN_CLASS}")`);
  });

  it("puts the generated tree and only this unit's delegate dirs on the source path", () => {
    const { build } = synthesizeServerBuild(lenientSb3, '/output', '/delegates');
    const srcDirs = /srcDirs\((.*)\)/.exec(build)![1];

    expect(srcDirs).toContain('/output/kotlin/spring-controllers@sb3/integration/kitchen-sink');
    expect(srcDirs).toContain('/delegates/common');
    expect(srcDirs).toContain('/delegates/lenient');
    expect(srcDirs).toContain('/delegates/lenient-sb3');
    // The one method whose return type differs between the Boot lines lives in these two directories;
    // compiling both would declare `WidgetsDelegate` twice.
    expect(srcDirs).not.toContain('lenient-sb4');
    expect(srcDirs).not.toContain('/delegates/strict');
  });

  it('gives a strict unit the strict delegates and no lenient ones', () => {
    const srcDirs = /srcDirs\((.*)\)/.exec(synthesizeServerBuild(strictSb4, '/output', '/delegates').build)![1];

    expect(srcDirs).toContain('/delegates/common');
    expect(srcDirs).toContain('/delegates/strict');
    expect(srcDirs).not.toContain('lenient');
  });

  it('resolves the right Boot platform per variant', () => {
    expect(synthesizeServerBuild(lenientSb3, '/o', '/d').build).toContain('spring-boot-dependencies:3.5.6');
    expect(synthesizeServerBuild(strictSb4, '/o', '/d').build).toContain('spring-boot-dependencies:4.0.0');
  });

  it('declares the compile dependencies tier 3 uses for this family plus the server runtime', () => {
    const { build } = synthesizeServerBuild(lenientSb3, '/o', '/d');

    // From `kotlinDependenciesFor('spring-controllers', 'sb3')` — the same table tier 3 compiles with.
    expect(build).toContain('org.springframework:spring-web');
    expect(build).toContain('jakarta.validation:jakarta.validation-api');
    // Server-runtime-only, and absent from that table on purpose.
    expect(build).toContain('org.springframework.boot:spring-boot-starter-webflux');
  });

  it('picks the Jackson line that matches the variant', () => {
    expect(synthesizeServerBuild(lenientSb3, '/o', '/d').build)
      .toContain('com.fasterxml.jackson.module:jackson-module-kotlin');
    expect(synthesizeServerBuild(strictSb4, '/o', '/d').build)
      .toContain('tools.jackson.module:jackson-module-kotlin');
  });

  it('declares a repository so resolution configures at all', () => {
    expect(synthesizeServerBuild(lenientSb3, '/o', '/d').build).toContain('mavenCentral()');
  });
});
