import { type TsModuleReferenceFactory, tsReference } from '../nodes/reference.ts';

// k6
/** Reference to `JSONValue` from the `k6` module. */
export const jsonValue: TsModuleReferenceFactory = tsReference.factory('JSONValue', 'k6');

// h6/http
/** Reference to `Response` from the `k6/http` module. */
export const response: TsModuleReferenceFactory = tsReference.factory('Response', 'k6/http');
/** Reference to `Params` from the `k6/http` module. */
export const params: TsModuleReferenceFactory = tsReference.factory('Params', 'k6/http');
