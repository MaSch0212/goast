import { tsReference } from '../nodes/reference.ts';

// k6
export const jsonValue = tsReference.factory('JSONValue', 'k6');

// h6/http
export const response = tsReference.factory('Response', 'k6/http');
export const params = tsReference.factory('Params', 'k6/http');
