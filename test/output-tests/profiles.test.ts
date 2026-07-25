import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { OpenApiGenerator } from '@goast/core';
import { SPEC_VERSION_DIRS } from '@goast/test-harness';

import { profiles } from './profiles.ts';

describe('profiles', () => {
  it('covers all fifteen generator and config combinations', () => {
    expect(profiles).toHaveLength(15);
  });

  it('uses a unique language and name pair per profile', () => {
    const keys = profiles.map((p) => `${p.language}/${p.name}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('uses names that are safe as path segments', () => {
    for (const profile of profiles) {
      expect(profile.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*(@[a-z0-9]+(-[a-z0-9]+)*)?$/);
    }
  });

  it('names only real version directories in a filter', () => {
    for (const profile of profiles) {
      if (profile.versions === 'all') continue;
      for (const version of profile.versions) {
        expect(Object.keys(SPEC_VERSION_DIRS)).toContain(version);
      }
    }
  });

  it('returns a chainable generator from configure', () => {
    for (const profile of profiles) {
      const configured = profile.configure(new OpenApiGenerator({ outputDir: 'unused', newLine: '\n' }));
      expect(typeof configured.parseAndGenerate).toBe('function');
    }
  });

  it('covers every generator that ships in the two packages', () => {
    const names = profiles.map((p) => `${p.language}/${p.name}`);
    for (
      const expected of [
        'kotlin/models@sb3',
        'kotlin/spring-controllers@sb3',
        'kotlin/spring-controllers@sb3-strict',
        'kotlin/spring-reactive-web-clients@sb3',
        'kotlin/okhttp3-clients@sb3',
        'typescript/models',
        'typescript/fetch-clients',
        'typescript/angular-services',
        'typescript/k6-clients',
        'typescript/easy-network-stub',
      ]
    ) {
      expect(names).toContain(expected);
    }
  });

  it('crosses every Kotlin generator with both Spring Boot versions', () => {
    const kotlin = profiles.filter((p) => p.language === 'kotlin').map((p) => p.name);
    for (const name of kotlin.filter((n) => n.includes('@sb3'))) {
      expect(kotlin).toContain(name.replace('@sb3', '@sb4'));
    }
  });
});
