import { ktGenericReferenceFactory, ktReferenceFactory } from '../ast';

export const any = ktReferenceFactory('Any');
export const nothing = ktReferenceFactory('Nothing');
export const string = ktReferenceFactory('String');
export const int = ktReferenceFactory('Int');
export const long = ktReferenceFactory('Long');
export const float = ktReferenceFactory('Float');
export const double = ktReferenceFactory('Double');
export const boolean = ktReferenceFactory('Boolean');

export const list = ktGenericReferenceFactory<1>('List');
export const mutableList = ktGenericReferenceFactory<1>('MutableList');
export const map = ktGenericReferenceFactory<2>('Map');
export const mutableMap = ktGenericReferenceFactory<2>('MutableMap');
