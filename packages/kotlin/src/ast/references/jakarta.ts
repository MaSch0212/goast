import { ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// jakarta.annotation
export const generated: KtReferenceFactory = ktReference.factory('Generated', 'jakarta.annotation');

// jakarta.validation
export const valid: KtReferenceFactory = ktReference.factory('Valid', 'jakarta.validation');

// jakarta.validation.constraints
export const pattern: KtReferenceFactory = ktReference.factory('Pattern', 'jakarta.validation.constraints');
