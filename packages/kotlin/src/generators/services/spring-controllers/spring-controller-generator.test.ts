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

class TestGenerator extends DefaultKotlinSpringControllerGenerator {
  /** The rendered `@Parameter(...)` annotation of a generated method parameter. */
  public swaggerParameterAnnotation(parameter: ApiParameterWithMultipartInfo): string | undefined {
    const result = this.getApiInterfaceEndpointMethodParameter(createContext(), endpoint, parameter);
    return result.annotations
      .map((a) => SourceBuilder.build((b) => a.write(b as KotlinFileBuilder), config).trim())
      .find((a) => a.startsWith('@Parameter'));
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
});
