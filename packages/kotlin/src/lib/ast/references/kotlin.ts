import { ktReference } from '../nodes/reference';

// kotlin
export const any = ktReference.factory('Any', 'kotlin');
export const nothing = ktReference.factory('Nothing', 'kotlin');
export const unit = ktReference.factory('Unit', 'kotlin');
export const string = ktReference.factory('String', 'kotlin');
export const int = ktReference.factory('Int', 'kotlin');
export const long = ktReference.factory('Long', 'kotlin');
export const float = ktReference.factory('Float', 'kotlin');
export const double = ktReference.factory('Double', 'kotlin');
export const boolean = ktReference.factory('Boolean', 'kotlin');
export const lazyFun = ktReference.genericFactory<1>('lazy', 'kotlin');
export const throws = ktReference.factory('Throws', 'kotlin');
export const deprecated = ktReference.factory('Deprecated', 'kotlin');

// kotlin.collections
export const list = ktReference.genericFactory<1>('List', 'kotlin.collections');
export const mutableList = ktReference.genericFactory<1>('MutableList', 'kotlin.collections');
export const map = ktReference.genericFactory<2>('Map', 'kotlin.collections');
export const mutableMap = ktReference.genericFactory<2>('MutableMap', 'kotlin.collections');
export const listOf = ktReference.genericFactory<1>('listOf', 'kotlin.collections');
export const mutableListOf = ktReference.genericFactory<1>('mutableListOf', 'kotlin.collections');
export const mapOf = ktReference.genericFactory<2>('mapOf', 'kotlin.collections');
export const mutableMapOf = ktReference.genericFactory<2>('mutableMapOf', 'kotlin.collections');

// kotlin.jvm
export const jvmStatic = ktReference.factory('JvmStatic', 'kotlin.jvm');
