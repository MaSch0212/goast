import { ktReference } from '../nodes/reference';

// io.swagger.v3.oas.annotations
export const parameter = ktReference.factory('Parameter', 'io.swagger.v3.oas.annotations');
export const operation = ktReference.factory('Operation', 'io.swagger.v3.oas.annotations');

// io.swagger.v3.oas.annotations.media
export const schema = ktReference.factory('Schema', 'io.swagger.v3.oas.annotations.media');
export const content = ktReference.factory('Content', 'io.swagger.v3.oas.annotations.media');

// io.swagger.v3.oas.annotations.responses
export const apiResponse = ktReference.factory('ApiResponse', 'io.swagger.v3.oas.annotations.responses');
export const apiResponses = ktReference.factory('ApiResponses', 'io.swagger.v3.oas.annotations.responses');
