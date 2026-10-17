import { type TsGenericReferenceFactory, tsReference, type TsReferenceFactory } from '../nodes/reference.ts';

/** Reference to the global `any` type. No import is emitted. */
export const any: TsReferenceFactory = tsReference.factory('any');
/** Reference to the global `unknown` type. No import is emitted. */
export const unknown: TsReferenceFactory = tsReference.factory('unknown');
/** Reference to the global `void` type. The `_` suffix is needed because `void` is a reserved word. */
export const void_: TsReferenceFactory = tsReference.factory('void');
/** Reference to the global `never` type. No import is emitted. */
export const never: TsReferenceFactory = tsReference.factory('never');
/** Reference to the global `number` type. No import is emitted. */
export const number: TsReferenceFactory = tsReference.factory('number');
/** Reference to the global `string` type. No import is emitted. */
export const string: TsReferenceFactory = tsReference.factory('string');
/** Reference to the global `boolean` type. No import is emitted. */
export const boolean: TsReferenceFactory = tsReference.factory('boolean');
/** Reference to the global `bigint` type. No import is emitted. */
export const bigint: TsReferenceFactory = tsReference.factory('bigint');
/** Reference to the global `symbol` type. No import is emitted. */
export const symbol: TsReferenceFactory = tsReference.factory('symbol');
/** Reference to the global `object` type. No import is emitted. */
export const object: TsReferenceFactory = tsReference.factory('object');
/** Reference to the global `undefined` type. The `_` suffix keeps the name apart from the `undefined` value. */
export const undefined_: TsReferenceFactory = tsReference.factory('undefined');
/** Reference to the global `null` type. The `_` suffix is needed because `null` is a reserved word. */
export const null_: TsReferenceFactory = tsReference.factory('null');

/** Reference to the global `Array` type. Takes one type argument and emits no import. */
export const array: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Array');
/** Reference to the global `Record` type. Takes two type arguments and emits no import. */
export const record: TsGenericReferenceFactory<2> = tsReference.genericFactory<2>('Record');
/** Reference to the global `Map` type. Takes two type arguments and emits no import. */
export const map: TsGenericReferenceFactory<2> = tsReference.genericFactory<2>('Map');
/** Reference to the global `Set` type. Takes one type argument and emits no import. */
export const set: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Set');
/** Reference to the global `Promise` type. Takes one type argument and emits no import. */
export const promise: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Promise');

/** Reference to the global `ReadonlyArray` type. Takes one type argument and emits no import. */
export const readonlyArray: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('ReadonlyArray');
/** Reference to the global `Readonly` utility type. Takes one type argument and emits no import. */
export const readonly: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Readonly');
/** Reference to the global `Partial` utility type. Takes one type argument and emits no import. */
export const partial: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Partial');
/** Reference to the global `Required` utility type. Takes one type argument and emits no import. */
export const required: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Required');
/** Reference to the global `Pick` utility type. Takes two type arguments and emits no import. */
export const pick: TsGenericReferenceFactory<2> = tsReference.genericFactory<2>('Pick');
/** Reference to the global `Omit` utility type. Takes two type arguments and emits no import. */
export const omit: TsGenericReferenceFactory<2> = tsReference.genericFactory<2>('Omit');
/** Reference to the global `Exclude` utility type. Takes two type arguments and emits no import. */
export const exclude: TsGenericReferenceFactory<2> = tsReference.genericFactory<2>('Exclude');
/** Reference to the global `Extract` utility type. Takes two type arguments and emits no import. */
export const extract: TsGenericReferenceFactory<2> = tsReference.genericFactory<2>('Extract');
/** Reference to the global `NonNullable` utility type. Takes one type argument and emits no import. */
export const nonNullable: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('NonNullable');
/** Reference to the global `Parameters` utility type. Takes one type argument and emits no import. */
export const parameters: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Parameters');
/** Reference to the global `ReturnType` utility type. Takes one type argument and emits no import. */
export const returnType: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('ReturnType');
/** Reference to the global `InstanceType` utility type. Takes one type argument and emits no import. */
export const instanceType: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('InstanceType');

/** Reference to the global `Blob` type. No import is emitted. */
export const blob: TsReferenceFactory = tsReference.factory('Blob');
