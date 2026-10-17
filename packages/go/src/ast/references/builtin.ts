import { goReference } from '../nodes/reference.ts';

// Predeclared identifiers, which need no import.

/** A reference to the predeclared `any` type, an alias of `interface{}`. */
export const any = goReference.factory('any');
/** A reference to the predeclared `bool` type. */
export const bool = goReference.factory('bool');
/** A reference to the predeclared `byte` type, an alias of `uint8`. */
export const byte = goReference.factory('byte');
/** A reference to the predeclared `error` interface type. */
export const error = goReference.factory('error');
/** A reference to the predeclared `float32` type. */
export const float32 = goReference.factory('float32');
/** A reference to the predeclared `float64` type. */
export const float64 = goReference.factory('float64');
/** A reference to the predeclared `int` type. */
export const int = goReference.factory('int');
/** A reference to the predeclared `int32` type. */
export const int32 = goReference.factory('int32');
/** A reference to the predeclared `int64` type. */
export const int64 = goReference.factory('int64');
/** A reference to the predeclared `rune` type, an alias of `int32`. */
export const rune = goReference.factory('rune');
/** A reference to the predeclared `string` type. */
export const string = goReference.factory('string');
