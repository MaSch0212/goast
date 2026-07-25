import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { type ApiEndpoint, defaultOpenApiGeneratorConfig, SourceBuilder } from '@goast/core';

import type { kt } from '../../../ast/index.ts';
import type { KotlinFileBuilder } from '../../../file-builder.ts';
import { DefaultKotlinSpringReactiveWebClientGenerator } from './spring-reactive-web-client-generator.ts';
import type { KotlinSpringReactiveWebClientGeneratorContext } from './models.ts';
import { defaultKotlinSpringReactiveWebClientsGeneratorConfig } from './models.ts';

const config = { ...defaultOpenApiGeneratorConfig, ...defaultKotlinSpringReactiveWebClientsGeneratorConfig };

function createContext(): KotlinSpringReactiveWebClientGeneratorContext {
  return { config } as unknown as KotlinSpringReactiveWebClientGeneratorContext;
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
  public members(endpoint: ApiEndpoint): kt.Function<KotlinFileBuilder>[] {
    return this.getEndpointMembers(createContext(), { endpoint, parameters: [] }) as kt.Function<KotlinFileBuilder>[];
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
});
