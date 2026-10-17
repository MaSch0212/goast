import { goReference } from '../nodes/reference.ts';

// Predeclared identifiers, which need no import.
export const any = goReference.factory('any');
export const bool = goReference.factory('bool');
export const byte = goReference.factory('byte');
export const error = goReference.factory('error');
export const float32 = goReference.factory('float32');
export const float64 = goReference.factory('float64');
export const int = goReference.factory('int');
export const int32 = goReference.factory('int32');
export const int64 = goReference.factory('int64');
export const rune = goReference.factory('rune');
export const string = goReference.factory('string');
