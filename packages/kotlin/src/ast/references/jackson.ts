import type { SourceBuilder } from '@goast/core';

import type { SpringBootVersion } from '../../config.ts';
import { type KtReference, ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

/**
 * Resolves a Jackson package name for the targeted Spring Boot version.
 *
 * Jackson 3 (the default in Spring Boot 4) moved every package **except annotations** from
 * `com.fasterxml.jackson.*` to `tools.jackson.*`. Annotations stay on `com.fasterxml.jackson.annotation`.
 */
const jacksonPackage = (subPackage: string, springBootVersion: SpringBootVersion): string =>
  `${springBootVersion === 4 ? 'tools.jackson' : 'com.fasterxml.jackson'}.${subPackage}`;

// com.fasterxml.jackson.annotation
export const jsonTypeInfo: KtReferenceFactory = ktReference.factory('JsonTypeInfo', 'com.fasterxml.jackson.annotation');
export const jsonSubTypes: KtReferenceFactory = ktReference.factory('JsonSubTypes', 'com.fasterxml.jackson.annotation');
export const jsonClassDescription: KtReferenceFactory = ktReference.factory(
  'JsonClassDescription',
  'com.fasterxml.jackson.annotation',
);
export const jsonProperty: KtReferenceFactory = ktReference.factory('JsonProperty', 'com.fasterxml.jackson.annotation');
export const jsonPropertyDescription: KtReferenceFactory = ktReference.factory(
  'JsonPropertyDescription',
  'com.fasterxml.jackson.annotation',
);
export const jsonInclude: KtReferenceFactory = ktReference.factory('JsonInclude', 'com.fasterxml.jackson.annotation');
export const jsonIgnore: KtReferenceFactory = ktReference.factory('JsonIgnore', 'com.fasterxml.jackson.annotation');
export const jsonAnySetter: KtReferenceFactory = ktReference.factory(
  'JsonAnySetter',
  'com.fasterxml.jackson.annotation',
);
export const jsonAnyGetter: KtReferenceFactory = ktReference.factory(
  'JsonAnyGetter',
  'com.fasterxml.jackson.annotation',
);

// com.fasterxml.jackson.databind (Jackson 2) / tools.jackson.databind (Jackson 3, Spring Boot 4)
export const objectMapper = <TBuilder extends SourceBuilder>(
  springBootVersion: SpringBootVersion = 3,
): KtReference<TBuilder> => ktReference<TBuilder>('ObjectMapper', jacksonPackage('databind', springBootVersion));
export const serializationFeature = <TBuilder extends SourceBuilder>(
  springBootVersion: SpringBootVersion = 3,
): KtReference<TBuilder> =>
  ktReference<TBuilder>('SerializationFeature', jacksonPackage('databind', springBootVersion));
export const deserializationFeature = <TBuilder extends SourceBuilder>(
  springBootVersion: SpringBootVersion = 3,
): KtReference<TBuilder> =>
  ktReference<TBuilder>('DeserializationFeature', jacksonPackage('databind', springBootVersion));

// com.fasterxml.jackson.module.kotlin (Jackson 2) / tools.jackson.module.kotlin (Jackson 3, Spring Boot 4)
export const jacksonObjectMapper = <TBuilder extends SourceBuilder>(
  springBootVersion: SpringBootVersion = 3,
): KtReference<TBuilder> =>
  ktReference<TBuilder>('jacksonObjectMapper', jacksonPackage('module.kotlin', springBootVersion));
export const jacksonMapperBuilder = <TBuilder extends SourceBuilder>(
  springBootVersion: SpringBootVersion = 3,
): KtReference<TBuilder> =>
  ktReference<TBuilder>('jacksonMapperBuilder', jacksonPackage('module.kotlin', springBootVersion));
