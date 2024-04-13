import { tsReference } from '../nodes/reference';

export const any = tsReference.factory('any');
export const unknown = tsReference.factory('unknown');
export const array = tsReference.genericFactory<1>('Array');
export const readonlyArray = tsReference.genericFactory<1>('ReadonlyArray');
export const record = tsReference.genericFactory<2>('Record');
export const map = tsReference.genericFactory<2>('Map');
export const set = tsReference.genericFactory<1>('Set');
export const readonly = tsReference.genericFactory<1>('Readonly');
export const partial = tsReference.genericFactory<1>('Partial');
export const required = tsReference.genericFactory<1>('Required');
