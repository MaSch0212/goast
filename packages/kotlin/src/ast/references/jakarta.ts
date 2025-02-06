import { ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// jakarta.annotation
export const generated: KtReferenceFactory = ktReference.factory('Generated', 'jakarta.annotation');

// jakarta.validation
export const valid: KtReferenceFactory = ktReference.factory('Valid', 'jakarta.validation');

// jakarta.validation.constraints
export const pattern: KtReferenceFactory = ktReference.factory('Pattern', 'jakarta.validation.constraints');
export const min: KtReferenceFactory = ktReference.factory('Min', 'jakarta.validation.constraints');
export const max: KtReferenceFactory = ktReference.factory('Max', 'jakarta.validation.constraints');
export const notEmpty: KtReferenceFactory = ktReference.factory('NotEmpty', 'jakarta.validation.constraints');
export const size: KtReferenceFactory = ktReference.factory('Size', 'jakarta.validation.constraints');
