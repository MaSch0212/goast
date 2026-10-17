/**
 * Pre-built references to Spring WebFlux `WebClient` types and the Kotlin extension functions used with them.
 *
 * Each `export const` is a factory that creates a `KtReference` with the given name and package, so the
 * generated code imports the type automatically. See `KtReferenceFactory` for the optional `options`, and
 * `KtGenericReferenceFactory` for the type-argument tuple that generic factories take first.
 */

import { type KtGenericReferenceFactory, ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// org.springframework.web.reactive.function
/** Reference to `BodyInserters` from the `org.springframework.web.reactive.function` package. */
export const bodyInserters: KtReferenceFactory = ktReference.factory(
  'BodyInserters',
  'org.springframework.web.reactive.function',
);

// org.springframework.web.reactive.function.client
/** Reference to `WebClient` from the `org.springframework.web.reactive.function.client` package. */
export const webClient: KtReferenceFactory = ktReference.factory(
  'WebClient',
  'org.springframework.web.reactive.function.client',
);
/** Reference to `ClientResponse` from the `org.springframework.web.reactive.function.client` package. */
export const clientResponse: KtReferenceFactory = ktReference.factory(
  'ClientResponse',
  'org.springframework.web.reactive.function.client',
);
/**
 * Generic reference to `RequestHeadersSpec` from the `org.springframework.web.reactive.function.client.WebClient`
 * package, a type nested in `WebClient`, taking one type argument.
 */
export const requestHeadersSpec: KtGenericReferenceFactory<1> = ktReference.genericFactory(
  'RequestHeadersSpec',
  'org.springframework.web.reactive.function.client.WebClient',
);
/** Generic reference to `toEntity` from the `org.springframework.web.reactive.function.client` package. */
export const toEntity: KtGenericReferenceFactory<1> = ktReference.genericFactory(
  'toEntity',
  'org.springframework.web.reactive.function.client',
);
/** Generic reference to `awaitBody` from the `org.springframework.web.reactive.function.client` package. */
export const awaitBody: KtGenericReferenceFactory<1> = ktReference.genericFactory(
  'awaitBody',
  'org.springframework.web.reactive.function.client',
);
/** Reference to `awaitBodilessEntity` from the `org.springframework.web.reactive.function.client` package. */
export const awaitBodilessEntity: KtReferenceFactory = ktReference.factory(
  'awaitBodilessEntity',
  'org.springframework.web.reactive.function.client',
);
/** Reference to `awaitExchange` from the `org.springframework.web.reactive.function.client` package. */
export const awaitExchange: KtReferenceFactory = ktReference.factory(
  'awaitExchange',
  'org.springframework.web.reactive.function.client',
);
