import { type TsModuleReferenceFactory, tsReference } from '../nodes/reference.ts';

export const observable: TsModuleReferenceFactory = tsReference.factory('Observable', 'rxjs');
export const firstValueFrom: TsModuleReferenceFactory = tsReference.factory('firstValueFrom', 'rxjs');
export const filter: TsModuleReferenceFactory = tsReference.factory('filter', 'rxjs');
export const map: TsModuleReferenceFactory = tsReference.factory('map', 'rxjs');
export const take: TsModuleReferenceFactory = tsReference.factory('take', 'rxjs');
