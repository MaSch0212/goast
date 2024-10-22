import { type KtGenericReferenceFactory, ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// kotlin
export const any: KtReferenceFactory = ktReference.factory('Any', 'kotlin');
export const nothing: KtReferenceFactory = ktReference.factory('Nothing', 'kotlin');
export const unit: KtReferenceFactory = ktReference.factory('Unit', 'kotlin');
export const string: KtReferenceFactory = ktReference.factory('String', 'kotlin');
export const int: KtReferenceFactory = ktReference.factory('Int', 'kotlin');
export const long: KtReferenceFactory = ktReference.factory('Long', 'kotlin');
export const float: KtReferenceFactory = ktReference.factory('Float', 'kotlin');
export const double: KtReferenceFactory = ktReference.factory('Double', 'kotlin');
export const boolean: KtReferenceFactory = ktReference.factory('Boolean', 'kotlin');
export const lazyFun: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>('lazy', 'kotlin');
export const throws: KtReferenceFactory = ktReference.factory('Throws', 'kotlin');
export const deprecated: KtReferenceFactory = ktReference.factory('Deprecated', 'kotlin');

// kotlin.collections
export const list: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>('List', 'kotlin.collections');
export const mutableList: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>(
  'MutableList',
  'kotlin.collections',
);
export const map: KtGenericReferenceFactory<2> = ktReference.genericFactory<2>('Map', 'kotlin.collections');
export const mutableMap: KtGenericReferenceFactory<2> = ktReference.genericFactory<2>(
  'MutableMap',
  'kotlin.collections',
);
export const listOf: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>('listOf', 'kotlin.collections');
export const mutableListOf: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>(
  'mutableListOf',
  'kotlin.collections',
);
export const mapOf: KtGenericReferenceFactory<2> = ktReference.genericFactory<2>('mapOf', 'kotlin.collections');
export const mutableMapOf: KtGenericReferenceFactory<2> = ktReference.genericFactory<2>(
  'mutableMapOf',
  'kotlin.collections',
);

// kotlin.jvm
export const jvmStatic: KtReferenceFactory = ktReference.factory('JvmStatic', 'kotlin.jvm');
