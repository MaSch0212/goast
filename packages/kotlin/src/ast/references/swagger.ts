import { ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// io.swagger.v3.oas.annotations
export const parameter: KtReferenceFactory = ktReference.factory('Parameter', 'io.swagger.v3.oas.annotations');
export const operation: KtReferenceFactory = ktReference.factory('Operation', 'io.swagger.v3.oas.annotations');

// io.swagger.v3.oas.annotations.media
export const schema: KtReferenceFactory = ktReference.factory('Schema', 'io.swagger.v3.oas.annotations.media');

// io.swagger.v3.oas.annotations.responses
export const apiResponse: KtReferenceFactory = ktReference.factory(
  'ApiResponse',
  'io.swagger.v3.oas.annotations.responses',
);
