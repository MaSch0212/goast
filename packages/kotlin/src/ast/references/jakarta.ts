/**
 * Pre-built references to Jakarta annotation and Bean Validation (`jakarta.validation`) types.
 *
 * Each `export const` is a factory that creates a `KtReference` with the given name and package, so the
 * generated code imports the type automatically. See `KtReferenceFactory` for the optional `options`.
 */

import { ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// jakarta.annotation
/** Reference to `Generated` from the `jakarta.annotation` package. */
export const generated: KtReferenceFactory = ktReference.factory('Generated', 'jakarta.annotation');

// jakarta.validation
/** Reference to `Valid` from the `jakarta.validation` package. */
export const valid: KtReferenceFactory = ktReference.factory('Valid', 'jakarta.validation');

// jakarta.validation.constraints
/** Reference to `Pattern` from the `jakarta.validation.constraints` package. */
export const pattern: KtReferenceFactory = ktReference.factory('Pattern', 'jakarta.validation.constraints');
/** Reference to `Min` from the `jakarta.validation.constraints` package. */
export const min: KtReferenceFactory = ktReference.factory('Min', 'jakarta.validation.constraints');
/** Reference to `Max` from the `jakarta.validation.constraints` package. */
export const max: KtReferenceFactory = ktReference.factory('Max', 'jakarta.validation.constraints');
/** Reference to `NotEmpty` from the `jakarta.validation.constraints` package. */
export const notEmpty: KtReferenceFactory = ktReference.factory('NotEmpty', 'jakarta.validation.constraints');
/** Reference to `Size` from the `jakarta.validation.constraints` package. */
export const size: KtReferenceFactory = ktReference.factory('Size', 'jakarta.validation.constraints');
