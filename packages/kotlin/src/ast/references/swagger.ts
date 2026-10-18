/**
 * Pre-built references to Swagger/OpenAPI annotation types from the `io.swagger.v3.oas.annotations` packages.
 *
 * Each `export const` is a factory that creates a `KtReference` with the given name and package, so the
 * generated code imports the type automatically. See `KtReferenceFactory` for the optional `options`.
 */

import { ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// io.swagger.v3.oas.annotations
/** Reference to `Parameter` from the `io.swagger.v3.oas.annotations` package. */
export const parameter: KtReferenceFactory = ktReference.factory('Parameter', 'io.swagger.v3.oas.annotations');
/** Reference to `Operation` from the `io.swagger.v3.oas.annotations` package. */
export const operation: KtReferenceFactory = ktReference.factory('Operation', 'io.swagger.v3.oas.annotations');

// io.swagger.v3.oas.annotations.media
/** Reference to `Schema` from the `io.swagger.v3.oas.annotations.media` package. */
export const schema: KtReferenceFactory = ktReference.factory('Schema', 'io.swagger.v3.oas.annotations.media');
/** Reference to `ArraySchema` from the `io.swagger.v3.oas.annotations.media` package. */
export const arraySchema: KtReferenceFactory = ktReference.factory(
  'ArraySchema',
  'io.swagger.v3.oas.annotations.media',
);
/** Reference to `Content` from the `io.swagger.v3.oas.annotations.media` package. */
export const content: KtReferenceFactory = ktReference.factory('Content', 'io.swagger.v3.oas.annotations.media');

// io.swagger.v3.oas.annotations.responses
/** Reference to `ApiResponse` from the `io.swagger.v3.oas.annotations.responses` package. */
export const apiResponse: KtReferenceFactory = ktReference.factory(
  'ApiResponse',
  'io.swagger.v3.oas.annotations.responses',
);
/** Reference to `ApiResponses` from the `io.swagger.v3.oas.annotations.responses` package. */
export const apiResponses: KtReferenceFactory = ktReference.factory(
  'ApiResponses',
  'io.swagger.v3.oas.annotations.responses',
);
