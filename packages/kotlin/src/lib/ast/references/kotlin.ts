import { ktReference } from '../nodes';

export const any = ktReference.factory('Any');
export const nothing = ktReference.factory('Nothing');
export const string = ktReference.factory('String');
export const int = ktReference.factory('Int');
export const long = ktReference.factory('Long');
export const float = ktReference.factory('Float');
export const double = ktReference.factory('Double');
export const boolean = ktReference.factory('Boolean');

export const list = ktReference.genericFactory<1>('List');
export const mutableList = ktReference.genericFactory<1>('MutableList');
export const map = ktReference.genericFactory<2>('Map');
export const mutableMap = ktReference.genericFactory<2>('MutableMap');
