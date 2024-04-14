import { tsReference } from '../nodes/reference';

export const any = tsReference.factory('any');
export const unknown = tsReference.factory('unknown');
export const void_ = tsReference.factory('void');
export const never = tsReference.factory('never');
export const number = tsReference.factory('number');
export const string = tsReference.factory('string');
export const boolean = tsReference.factory('boolean');
export const bigint = tsReference.factory('bigint');
export const symbol = tsReference.factory('symbol');
export const object = tsReference.factory('object');
export const undefined_ = tsReference.factory('undefined');
export const null_ = tsReference.factory('null');

export const array = tsReference.genericFactory<1>('Array');
export const record = tsReference.genericFactory<2>('Record');
export const map = tsReference.genericFactory<2>('Map');
export const set = tsReference.genericFactory<1>('Set');
export const promise = tsReference.genericFactory<1>('Promise');

export const readonlyArray = tsReference.genericFactory<1>('ReadonlyArray');
export const readonly = tsReference.genericFactory<1>('Readonly');
export const partial = tsReference.genericFactory<1>('Partial');
export const required = tsReference.genericFactory<1>('Required');
export const pick = tsReference.genericFactory<2>('Pick');
export const omit = tsReference.genericFactory<2>('Omit');
export const exclude = tsReference.genericFactory<2>('Exclude');
export const extract = tsReference.genericFactory<2>('Extract');
export const nonNullable = tsReference.genericFactory<1>('NonNullable');
export const parameters = tsReference.genericFactory<1>('Parameters');
export const returnType = tsReference.genericFactory<1>('ReturnType');
export const instanceType = tsReference.genericFactory<1>('InstanceType');
