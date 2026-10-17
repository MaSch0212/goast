/**
 * Pre-built references to Jackson types.
 *
 * Annotation references are fixed to `com.fasterxml.jackson.annotation` on Spring Boot 3 and 4. The databind and
 * Kotlin module factories take a `springBootVersion` and select `com.fasterxml.jackson.*` (Spring Boot 3, Jackson 2)
 * or `tools.jackson.*` (Spring Boot 4, Jackson 3). `dateTimeFeature` is Jackson 3 only and is always
 * `tools.jackson.databind.cfg`.
 */
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
/** Reference to the `JsonTypeInfo` annotation from the `com.fasterxml.jackson.annotation` package. */
export const jsonTypeInfo: KtReferenceFactory = ktReference.factory('JsonTypeInfo', 'com.fasterxml.jackson.annotation');
/** Reference to the `JsonSubTypes` annotation from the `com.fasterxml.jackson.annotation` package. */
export const jsonSubTypes: KtReferenceFactory = ktReference.factory('JsonSubTypes', 'com.fasterxml.jackson.annotation');
/** Reference to the `JsonClassDescription` annotation from the `com.fasterxml.jackson.annotation` package. */
export const jsonClassDescription: KtReferenceFactory = ktReference.factory(
  'JsonClassDescription',
  'com.fasterxml.jackson.annotation',
);
/** Reference to the `JsonProperty` annotation from the `com.fasterxml.jackson.annotation` package. */
export const jsonProperty: KtReferenceFactory = ktReference.factory('JsonProperty', 'com.fasterxml.jackson.annotation');
/** Reference to the `JsonPropertyDescription` annotation from the `com.fasterxml.jackson.annotation` package. */
export const jsonPropertyDescription: KtReferenceFactory = ktReference.factory(
  'JsonPropertyDescription',
  'com.fasterxml.jackson.annotation',
);
/** Reference to the `JsonInclude` annotation from the `com.fasterxml.jackson.annotation` package. */
export const jsonInclude: KtReferenceFactory = ktReference.factory('JsonInclude', 'com.fasterxml.jackson.annotation');
/** Reference to the `JsonIgnore` annotation from the `com.fasterxml.jackson.annotation` package. */
export const jsonIgnore: KtReferenceFactory = ktReference.factory('JsonIgnore', 'com.fasterxml.jackson.annotation');
/** Reference to the `JsonAnySetter` annotation from the `com.fasterxml.jackson.annotation` package. */
export const jsonAnySetter: KtReferenceFactory = ktReference.factory(
  'JsonAnySetter',
  'com.fasterxml.jackson.annotation',
);
/** Reference to the `JsonAnyGetter` annotation from the `com.fasterxml.jackson.annotation` package. */
export const jsonAnyGetter: KtReferenceFactory = ktReference.factory(
  'JsonAnyGetter',
  'com.fasterxml.jackson.annotation',
);

// com.fasterxml.jackson.databind (Jackson 2) / tools.jackson.databind (Jackson 3, Spring Boot 4)
/**
 * Factory for a reference to the `ObjectMapper` class from the `com.fasterxml.jackson.databind` package
 * (Spring Boot 3) or the `tools.jackson.databind` package (Spring Boot 4).
 *
 * @template TBuilder The type of the source builder the reference is written to.
 * @param springBootVersion The targeted Spring Boot major version. Selects the Jackson package.
 * @default 3
 * @returns A reference to `ObjectMapper`.
 * @see SpringBootVersion
 */
export const objectMapper = <TBuilder extends SourceBuilder>(
  springBootVersion: SpringBootVersion = 3,
): KtReference<TBuilder> => ktReference<TBuilder>('ObjectMapper', jacksonPackage('databind', springBootVersion));
/**
 * Factory for a reference to the `SerializationFeature` type from the `com.fasterxml.jackson.databind` package
 * (Spring Boot 3) or the `tools.jackson.databind` package (Spring Boot 4).
 *
 * @template TBuilder The type of the source builder the reference is written to.
 * @param springBootVersion The targeted Spring Boot major version. Selects the Jackson package.
 * @default 3
 * @returns A reference to `SerializationFeature`.
 * @see SpringBootVersion
 */
export const serializationFeature = <TBuilder extends SourceBuilder>(
  springBootVersion: SpringBootVersion = 3,
): KtReference<TBuilder> =>
  ktReference<TBuilder>('SerializationFeature', jacksonPackage('databind', springBootVersion));
/**
 * Factory for a reference to the `DeserializationFeature` type from the `com.fasterxml.jackson.databind` package
 * (Spring Boot 3) or the `tools.jackson.databind` package (Spring Boot 4).
 *
 * @template TBuilder The type of the source builder the reference is written to.
 * @param springBootVersion The targeted Spring Boot major version. Selects the Jackson package.
 * @default 3
 * @returns A reference to `DeserializationFeature`.
 * @see SpringBootVersion
 */
export const deserializationFeature = <TBuilder extends SourceBuilder>(
  springBootVersion: SpringBootVersion = 3,
): KtReference<TBuilder> =>
  ktReference<TBuilder>('DeserializationFeature', jacksonPackage('databind', springBootVersion));
/**
 * `tools.jackson.databind.cfg.DateTimeFeature` — Jackson 3 only.
 *
 * Jackson 3 moved `WRITE_DATES_AS_TIMESTAMPS` off `SerializationFeature` onto this type. Unlike its
 * neighbours it takes no `springBootVersion`, because Jackson 2 has no equivalent type: on the Spring Boot 3
 * line the constant still lives on `SerializationFeature`.
 */
export const dateTimeFeature: KtReferenceFactory = ktReference.factory('DateTimeFeature', 'tools.jackson.databind.cfg');

// com.fasterxml.jackson.module.kotlin (Jackson 2) / tools.jackson.module.kotlin (Jackson 3, Spring Boot 4)
/**
 * Factory for a reference to the `jacksonObjectMapper` function from the Jackson Kotlin module package,
 * `com.fasterxml.jackson.module.kotlin` (Spring Boot 3) or `tools.jackson.module.kotlin` (Spring Boot 4).
 *
 * @template TBuilder The type of the source builder the reference is written to.
 * @param springBootVersion The targeted Spring Boot major version. Selects the Jackson package.
 * @default 3
 * @returns A reference to `jacksonObjectMapper`.
 * @see SpringBootVersion
 */
export const jacksonObjectMapper = <TBuilder extends SourceBuilder>(
  springBootVersion: SpringBootVersion = 3,
): KtReference<TBuilder> =>
  ktReference<TBuilder>('jacksonObjectMapper', jacksonPackage('module.kotlin', springBootVersion));
/**
 * Factory for a reference to the `jacksonMapperBuilder` function from the Jackson Kotlin module package,
 * `com.fasterxml.jackson.module.kotlin` (Spring Boot 3) or `tools.jackson.module.kotlin` (Spring Boot 4).
 *
 * @template TBuilder The type of the source builder the reference is written to.
 * @param springBootVersion The targeted Spring Boot major version. Selects the Jackson package.
 * @default 3
 * @returns A reference to `jacksonMapperBuilder`.
 * @see SpringBootVersion
 */
export const jacksonMapperBuilder = <TBuilder extends SourceBuilder>(
  springBootVersion: SpringBootVersion = 3,
): KtReference<TBuilder> =>
  ktReference<TBuilder>('jacksonMapperBuilder', jacksonPackage('module.kotlin', springBootVersion));
