import { type TsModuleReferenceFactory, tsReference } from '../nodes/reference.ts';

// k6
export const jsonValue: TsModuleReferenceFactory = tsReference.factory('JSONValue', 'k6');

// h6/http
export const response: TsModuleReferenceFactory = tsReference.factory('Response', 'k6/http');
export const params: TsModuleReferenceFactory = tsReference.factory('Params', 'k6/http');
