import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { type ApiEndpoint, defaultOpenApiGeneratorConfig, SourceBuilder } from '@goast/core';

import type { kt } from '../../../ast/index.ts';
import type { KotlinFileBuilder } from '../../../file-builder.ts';
import { DefaultKotlinSpringReactiveWebClientGenerator } from './spring-reactive-web-client-generator.ts';
import type { KotlinSpringReactiveWebClientGeneratorContext } from './models.ts';
import { defaultKotlinSpringReactiveWebClientsGeneratorConfig } from './models.ts';

const config = { ...defaultOpenApiGeneratorConfig, ...defaultKotlinSpringReactiveWebClientsGeneratorConfig };

function createContext(springBootVersion: 3 | 4 = 3): KotlinSpringReactiveWebClientGeneratorContext {
  return { config: { ...config, springBootVersion } } as unknown as KotlinSpringReactiveWebClientGeneratorContext;
}

function createEndpoint(deprecated: boolean, description?: string): ApiEndpoint {
  return {
    name: 'deprecatedOp',
    path: '/deprecated-op',
    method: 'get',
    deprecated,
    description,
    summary: undefined,
    parameters: [],
    responses: [],
    requestBody: undefined,
    tags: [],
    custom: {},
  } as unknown as ApiEndpoint;
}

class TestGenerator extends DefaultKotlinSpringReactiveWebClientGenerator {
  public members(endpoint: ApiEndpoint, springBootVersion: 3 | 4 = 3): kt.Function<KotlinFileBuilder>[] {
    return this.getEndpointMembers(createContext(springBootVersion), {
      endpoint,
      parameters: [],
    }) as kt.Function<KotlinFileBuilder>[];
  }

  /** The rendered generic parameters of every handler overload, e.g. `['T : Any']`. */
  public handlerGenerics(springBootVersion: 3 | 4): string[] {
    return this.members(createEndpoint(false), springBootVersion)
      .filter((fn) => fn.generics.length > 0)
      .flatMap((fn) =>
        fn.generics.map((g) =>
          SourceBuilder.build(
            (b) => (g as kt.GenericParameter<KotlinFileBuilder>).write(b as KotlinFileBuilder),
            config,
          )
            .trim()
        )
      );
  }
}

/** The rendered annotations of a generated function, e.g. `['@Deprecated("")']`. */
function annotationsOf(fn: kt.Function<KotlinFileBuilder>): string[] {
  return fn.annotations.map((a) => SourceBuilder.build((b) => a.write(b as KotlinFileBuilder), config).trim());
}

describe('DefaultKotlinSpringReactiveWebClientGenerator', () => {
  describe('getEndpointMembers', () => {
    it('marks every generated member of a deprecated operation as deprecated', () => {
      const members = new TestGenerator().members(createEndpoint(true, 'This operation is deprecated.'));

      expect(members.length).toBeGreaterThan(0);
      for (const member of members) {
        expect(annotationsOf(member)).toContain('@Deprecated("")');
      }
    });

    it('marks a deprecated operation without a description the same way', () => {
      const members = new TestGenerator().members(createEndpoint(true));

      for (const member of members) {
        expect(annotationsOf(member)).toContain('@Deprecated("")');
      }
    });

    it('leaves a non-deprecated operation unannotated', () => {
      const members = new TestGenerator().members(createEndpoint(false, 'Still supported.'));

      for (const member of members) {
        expect(annotationsOf(member)).toEqual([]);
      }
    });
  });

  // Spring's `awaitExchange` is `<V : Any>` on BOTH Boot lines, so the `<T>` handler overload needs the
  // bound on both. Defect 28 gave it to Boot 4 only, which is the line that did not need it most: `@sb3`
  // produced 115 diagnostics across 16 units and `@sb4` compiled clean.
  describe('awaitExchange Any bound', () => {
    it('bounds T by Any on the Spring Boot 3 line', () => {
      const generics = new TestGenerator().handlerGenerics(3);

      expect(generics.length).toBeGreaterThan(0);
      for (const generic of generics) expect(generic).toBe('T : Any');
    });

    it('bounds T by Any on the Spring Boot 4 line too', () => {
      const generics = new TestGenerator().handlerGenerics(4);

      expect(generics.length).toBeGreaterThan(0);
      for (const generic of generics) expect(generic).toBe('T : Any');
    });
  });
});
