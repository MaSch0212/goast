import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { KOTLIN_BOM, KOTLIN_DEPENDENCIES, kotlinDependenciesFor } from './dependencies.ts';

describe('KOTLIN_DEPENDENCIES', () => {
  it('covers every Kotlin profile family the corpus generates', () => {
    expect(Object.keys(KOTLIN_DEPENDENCIES).sort()).toEqual(
      ['models', 'okhttp3-clients', 'spring-controllers', 'spring-reactive-web-clients'],
    );
  });
});

describe('KOTLIN_BOM', () => {
  it('pins one platform per Spring Boot line', () => {
    expect(KOTLIN_BOM.sb3).toContain('spring-boot-dependencies:3.5.6');
    expect(KOTLIN_BOM.sb4).toContain('spring-boot-dependencies:4.0.0');
  });
});

describe('kotlinDependenciesFor', () => {
  it('appends the variant slot to the shared list', () => {
    const sb3 = kotlinDependenciesFor('okhttp3-clients', 'sb3');
    const sb4 = kotlinDependenciesFor('okhttp3-clients', 'sb4');

    // The one profile in the corpus generated against Jackson 3 — the sole reason variant slots exist.
    expect(sb3.some((d) => d.includes('com.fasterxml.jackson.module:jackson-module-kotlin'))).toBe(true);
    expect(sb4.some((d) => d.includes('tools.jackson.module:jackson-module-kotlin'))).toBe(true);
    expect(sb3.length).toBe(sb4.length);
  });

  it('returns only the shared list for a family with no variant slots', () => {
    expect(kotlinDependenciesFor('models', 'sb3')).toEqual(kotlinDependenciesFor('models', 'sb4'));
  });

  it('names the unknown family and where to add it', () => {
    expect(() => kotlinDependenciesFor('nope', 'sb3')).toThrow('nope');
  });
});
