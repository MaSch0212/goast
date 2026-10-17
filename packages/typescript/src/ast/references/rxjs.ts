import { type TsModuleReferenceFactory, tsReference } from '../nodes/reference.ts';

/** Reference to `Observable` from the `rxjs` module. */
export const observable: TsModuleReferenceFactory = tsReference.factory('Observable', 'rxjs');
/** Reference to the `firstValueFrom` function from the `rxjs` module. */
export const firstValueFrom: TsModuleReferenceFactory = tsReference.factory('firstValueFrom', 'rxjs');
/** Reference to the `filter` operator from the `rxjs` module. */
export const filter: TsModuleReferenceFactory = tsReference.factory('filter', 'rxjs');
/** Reference to the `map` operator from the `rxjs` module. */
export const map: TsModuleReferenceFactory = tsReference.factory('map', 'rxjs');
/** Reference to the `take` operator from the `rxjs` module. */
export const take: TsModuleReferenceFactory = tsReference.factory('take', 'rxjs');
