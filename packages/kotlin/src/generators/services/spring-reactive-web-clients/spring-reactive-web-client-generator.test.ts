import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { type ApiEndpoint, defaultOpenApiGeneratorConfig, SourceBuilder } from '@goast/core';

import type { kt } from '../../../ast/index.ts';
import { KotlinFileBuilder } from '../../../file-builder.ts';
import { DefaultKotlinSpringReactiveWebClientGenerator } from './spring-reactive-web-client-generator.ts';
import type { KotlinSpringReactiveWebClientGeneratorContext } from './models.ts';
import { defaultKotlinSpringReactiveWebClientsGeneratorConfig } from './models.ts';

const config = { ...defaultOpenApiGeneratorConfig, ...defaultKotlinSpringReactiveWebClientsGeneratorConfig };

function createContext(
  springBootVersion: 3 | 4 = 3,
  overrides: Partial<typeof config> = {},
): KotlinSpringReactiveWebClientGeneratorContext {
  return {
    config: { ...config, springBootVersion, ...overrides },
  } as unknown as KotlinSpringReactiveWebClientGeneratorContext;
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

/**
 * An endpoint with the given path and one parameter per entry in `targets`, so the three `uri` shapes
 * (no parameters, path only, path plus query) can each be exercised.
 */
function createUriEndpoint(path: string, targets: ('path' | 'query')[]): ApiEndpoint {
  return {
    name: 'listThings',
    path,
    method: 'get',
    deprecated: false,
    description: undefined,
    summary: undefined,
    parameters: targets.map((target) => ({
      name: target === 'path' ? 'id' : 'limit',
      target,
      required: true,
      schema: { kind: 'string' },
    })),
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

  /** The rendered `uri(...)` call of a request function, e.g. `uri("things/{id}", mapOf("id" to id.toString()))`. */
  public uriCall(endpoint: ApiEndpoint, preserveUriTemplate: boolean): string {
    const ctx = createContext(3, { preserveUriTemplate });
    const builder = new KotlinFileBuilder(undefined, ctx.config);
    builder.append(this.getEndpointUriCall(ctx, { endpoint, parameters: endpoint.parameters }));
    return builder.toString(false);
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

  // #79 made the generated client hand `WebClient` the URI template rather than an already expanded path, so
  // Spring records it and the `uri` tag of `http.client.requests` stays bounded by endpoint count. Its
  // `preserveUriTemplate: false` escape hatch was pinned by the snapshot tier this branch removes; the four
  // cases below pin it here instead, so a later change cannot silently revert to expanded URIs.
  describe('preserveUriTemplate', () => {
    it('passes a parameterless path as the template', () => {
      expect(new TestGenerator().uriCall(createUriEndpoint('things', []), true)).toBe('uri("things")');
    });

    it('passes path parameters as URI variables, so the template survives', () => {
      expect(new TestGenerator().uriCall(createUriEndpoint('things/{id}', ['path']), true))
        .toBe('uri("things/{id}", mapOf("id" to id.toString()))');
    });

    it('builds query parameters through a UriBuilder, keeping them out of the template', () => {
      const call = new TestGenerator().uriCall(createUriEndpoint('things/{id}', ['path', 'query']), true);

      expect(call).toContain('uri("things/{id}")');
      expect(call).toContain('queryParam("limit"');
      expect(call).toContain('.build(mapOf("id" to id.toString()))');
    });

    it('delegates to the <endpoint>Uri helper when disabled, expanding the path itself', () => {
      expect(new TestGenerator().uriCall(createUriEndpoint('things/{id}', ['path', 'query']), false))
        .toBe('uri(listThingsUri(id, limit))');
    });
  });
});
