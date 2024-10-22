import { type TsGenericReferenceFactory, tsReference, type TsReferenceFactory } from '../nodes/reference.ts';

export const any: TsReferenceFactory = tsReference.factory('any');
export const unknown: TsReferenceFactory = tsReference.factory('unknown');
export const void_: TsReferenceFactory = tsReference.factory('void');
export const never: TsReferenceFactory = tsReference.factory('never');
export const number: TsReferenceFactory = tsReference.factory('number');
export const string: TsReferenceFactory = tsReference.factory('string');
export const boolean: TsReferenceFactory = tsReference.factory('boolean');
export const bigint: TsReferenceFactory = tsReference.factory('bigint');
export const symbol: TsReferenceFactory = tsReference.factory('symbol');
export const object: TsReferenceFactory = tsReference.factory('object');
export const undefined_: TsReferenceFactory = tsReference.factory('undefined');
export const null_: TsReferenceFactory = tsReference.factory('null');

export const array: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Array');
export const record: TsGenericReferenceFactory<2> = tsReference.genericFactory<2>('Record');
export const map: TsGenericReferenceFactory<2> = tsReference.genericFactory<2>('Map');
export const set: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Set');
export const promise: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Promise');

export const readonlyArray: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('ReadonlyArray');
export const readonly: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Readonly');
export const partial: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Partial');
export const required: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Required');
export const pick: TsGenericReferenceFactory<2> = tsReference.genericFactory<2>('Pick');
export const omit: TsGenericReferenceFactory<2> = tsReference.genericFactory<2>('Omit');
export const exclude: TsGenericReferenceFactory<2> = tsReference.genericFactory<2>('Exclude');
export const extract: TsGenericReferenceFactory<2> = tsReference.genericFactory<2>('Extract');
export const nonNullable: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('NonNullable');
export const parameters: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('Parameters');
export const returnType: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('ReturnType');
export const instanceType: TsGenericReferenceFactory<1> = tsReference.genericFactory<1>('InstanceType');

export const blob: TsReferenceFactory = tsReference.factory('Blob');
