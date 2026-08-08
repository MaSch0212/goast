import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { CASE_LINE_PREFIX, DRIVER_UNITS, parseCaseLines, synthesizeDriverBuild } from './build.ts';

describe('DRIVER_UNITS', () => {
  it('drives both client families on both Spring Boot lines', () => {
    expect(DRIVER_UNITS.map((u) => u.id)).toEqual([
      'okhttp3-clients@sb3',
      'okhttp3-clients@sb4',
      'spring-reactive-web-clients@sb3',
      'spring-reactive-web-clients@sb4',
    ]);
  });
});

describe('synthesizeDriverBuild', () => {
  it('sources the committed tree and the driver, and nothing else', () => {
    const { build } = synthesizeDriverBuild(DRIVER_UNITS[0], '/output', '/drivers');

    expect(build).toContain('/output/kotlin/okhttp3-clients@sb3/integration/kitchen-sink');
    expect(build).toContain('/drivers/OkHttp3Driver.kt');
  });

  it('applies the variant BOM and the family dependencies', () => {
    const sb4 = synthesizeDriverBuild(DRIVER_UNITS[1], '/output', '/drivers').build;

    expect(sb4).toContain('spring-boot-dependencies:4.0.0');
    // The Jackson 3 module, which only this variant uses.
    expect(sb4).toContain('tools.jackson.module:jackson-module-kotlin');
  });

  it('makes the driver runnable with a fixed main class', () => {
    const { build } = synthesizeDriverBuild(DRIVER_UNITS[0], '/output', '/drivers');

    expect(build).toContain('application');
    expect(build).toContain('MainKt');
  });
});

describe('parseCaseLines', () => {
  it('takes only the sentinel-prefixed lines, ignoring Gradle noise', () => {
    const output = [
      '> Task :compileKotlin',
      `${CASE_LINE_PREFIX}{"caseId":"getPet/ok","result":{"id":"abc"}}`,
      'Downloading nothing, offline',
      `${CASE_LINE_PREFIX}{"caseId":"deletePet/noContent","result":{"status":204}}`,
      'BUILD SUCCESSFUL in 4s',
    ].join('\n');

    expect(parseCaseLines(output)).toEqual([
      { caseId: 'getPet/ok', result: { id: 'abc' } },
      { caseId: 'deletePet/noContent', result: { status: 204 } },
    ]);
  });

  it('throws on a sentinel line that is not valid JSON rather than dropping it', () => {
    expect(() => parseCaseLines(`${CASE_LINE_PREFIX}{oops`)).toThrow(CASE_LINE_PREFIX);
  });
});
