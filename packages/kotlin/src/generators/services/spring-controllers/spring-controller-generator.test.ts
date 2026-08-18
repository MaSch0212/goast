import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { type ApiEndpoint, type ApiParameter, defaultOpenApiGeneratorConfig, SourceBuilder } from '@goast/core';

import { kt } from '../../../ast/index.ts';
import type { KotlinFileBuilder } from '../../../file-builder.ts';
import type { ApiParameterWithMultipartInfo } from '../../../types.ts';
import { DefaultKotlinSpringControllerGenerator } from './spring-controller-generator.ts';
import type { KotlinServiceGeneratorContext } from './models.ts';
import { defaultKotlinServicesGeneratorConfig } from './models.ts';

const config = { ...defaultOpenApiGeneratorConfig, ...defaultKotlinServicesGeneratorConfig };

function createContext(): KotlinServiceGeneratorContext {
  return {
    config,
    input: { kotlin: { models: { 'schema-1': { type: kt.refs.string() } } } },
  } as unknown as KotlinServiceGeneratorContext;
}

const endpoint = { name: 'deprecatedParams', method: 'get', path: '/deprecated-params' } as unknown as ApiEndpoint;

function createParameter(deprecated: boolean, description?: string): ApiParameterWithMultipartInfo {
  return {
    name: 'withDesc',
    target: 'query',
    required: false,
    deprecated,
    description,
    schema: { id: 'schema-1', kind: 'string' },
  } as unknown as ApiParameter as ApiParameterWithMultipartInfo;
}

function createEndpointWithResponses(statusKeys: string[]): ApiEndpoint {
  return {
    name: 'responses',
    method: 'get',
    path: '/responses',
    responses: statusKeys.map((statusKey) => ({
      statusKey,
      statusCode: Number(statusKey) || undefined,
      description: undefined,
      headers: [],
      contentOptions: [],
    })),
  } as unknown as ApiEndpoint;
}

class TestGenerator extends DefaultKotlinSpringControllerGenerator {
  /** The rendered `@Parameter(...)` annotation of a generated method parameter. */
  public swaggerParameterAnnotation(parameter: ApiParameterWithMultipartInfo): string | undefined {
    const result = this.getApiInterfaceEndpointMethodParameter(createContext(), endpoint, parameter);
    return result.annotations
      .map((a) => SourceBuilder.build((b) => a.write(b as KotlinFileBuilder), config).trim())
      .find((a) => a.startsWith('@Parameter'));
  }

  /** Every rendered `responseCode = …` argument of the generated `@ApiResponses` annotation. */
  public responseCodes(endpointWithResponses: ApiEndpoint): string[] {
    return this.getApiInterfaceEndpointMethodAnnnotations(createContext(), endpointWithResponses)
      .map((a) => SourceBuilder.build((b) => a.write(b as KotlinFileBuilder), config))
      .flatMap((rendered) => [...rendered.matchAll(/responseCode = ("[^"]*"|null)/g)].map((m) => m[1]));
  }
}

describe('DefaultKotlinSpringControllerGenerator', () => {
  describe('getApiInterfaceEndpointMethodParameter', () => {
    it('marks a deprecated parameter as deprecated, like it marks a deprecated operation', () => {
      const annotation = new TestGenerator().swaggerParameterAnnotation(
        createParameter(true, 'This parameter is deprecated.'),
      );

      expect(annotation).toBe(
        '@Parameter(description = "This parameter is deprecated.", required = false, deprecated = true)',
      );
    });

    it('marks a deprecated parameter with no description the same way', () => {
      const annotation = new TestGenerator().swaggerParameterAnnotation(createParameter(true));

      expect(annotation).toBe('@Parameter(required = false, deprecated = true)');
    });

    it('leaves a supported parameter unmarked', () => {
      const annotation = new TestGenerator().swaggerParameterAnnotation(createParameter(false, 'Still supported.'));

      expect(annotation).toBe('@Parameter(description = "Still supported.", required = false)');
    });
  });

  // `ApiResponse.responseCode()` is a non-nullable annotation element, so the bare token `null` does not
  // compile — 28 occurrences across the four spring-controllers variants. Rendering the spec's own response
  // key fixes the compile break and also makes `default`, `2XX`, `4XX` and `5XX` distinguishable, which the
  // old `statusCode?.toString()` collapsed into one indistinguishable `null`.
  describe('getApiInterfaceEndpointMethodAnnnotations', () => {
    it('renders an exact status code as a quoted string', () => {
      expect(new TestGenerator().responseCodes(createEndpointWithResponses(['200']))).toEqual(['"200"']);
    });

    it('renders the default response as "default" rather than null', () => {
      expect(new TestGenerator().responseCodes(createEndpointWithResponses(['default']))).toEqual(['"default"']);
    });

    it('keeps range codes distinct from each other and from default', () => {
      expect(new TestGenerator().responseCodes(createEndpointWithResponses(['2XX', '4XX', '5XX', 'default'])))
        .toEqual(['"2XX"', '"4XX"', '"5XX"', '"default"']);
    });

    it('never emits a bare null', () => {
      const codes = new TestGenerator().responseCodes(createEndpointWithResponses(['200', '2XX', 'default']));

      expect(codes).not.toContain('null');
    });
  });
});
