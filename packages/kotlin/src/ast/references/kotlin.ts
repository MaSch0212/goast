/**
 * Pre-built references to Kotlin standard library types, functions and annotations.
 *
 * The `kotlin`, `kotlin.collections` and `kotlin.jvm` packages are in the default `globalImports`, so no `import`
 * is emitted for these references unless `globalImports` is changed.
 */
import { type KtGenericReferenceFactory, ktReference, type KtReferenceFactory } from '../nodes/reference.ts';

// kotlin
/** Reference to `Any` from the `kotlin` package. */
export const any: KtReferenceFactory = ktReference.factory('Any', 'kotlin');
/** Reference to `Nothing` from the `kotlin` package. */
export const nothing: KtReferenceFactory = ktReference.factory('Nothing', 'kotlin');
/** Reference to `Unit` from the `kotlin` package. */
export const unit: KtReferenceFactory = ktReference.factory('Unit', 'kotlin');
/** Reference to `String` from the `kotlin` package. */
export const string: KtReferenceFactory = ktReference.factory('String', 'kotlin');
/** Reference to `Int` from the `kotlin` package. */
export const int: KtReferenceFactory = ktReference.factory('Int', 'kotlin');
/** Reference to `Long` from the `kotlin` package. */
export const long: KtReferenceFactory = ktReference.factory('Long', 'kotlin');
/** Reference to `Float` from the `kotlin` package. */
export const float: KtReferenceFactory = ktReference.factory('Float', 'kotlin');
/** Reference to `Double` from the `kotlin` package. */
export const double: KtReferenceFactory = ktReference.factory('Double', 'kotlin');
/** Reference to `Boolean` from the `kotlin` package. */
export const boolean: KtReferenceFactory = ktReference.factory('Boolean', 'kotlin');
/** Reference to the `lazy` function from the `kotlin` package. Takes one type argument. */
export const lazyFun: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>('lazy', 'kotlin');
/** Reference to the `Throws` annotation from the `kotlin` package. */
export const throws: KtReferenceFactory = ktReference.factory('Throws', 'kotlin');
/** Reference to the `Deprecated` annotation from the `kotlin` package. */
export const deprecated: KtReferenceFactory = ktReference.factory('Deprecated', 'kotlin');
/** Reference to `Throwable` from the `kotlin` package. */
export const throwable: KtReferenceFactory = ktReference.factory('Throwable', 'kotlin');

// kotlin.collections
/** Reference to the `List` type from the `kotlin.collections` package. Takes one type argument. */
export const list: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>('List', 'kotlin.collections');
/** Reference to the `MutableList` type from the `kotlin.collections` package. Takes one type argument. */
export const mutableList: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>(
  'MutableList',
  'kotlin.collections',
);
/** Reference to the `Map` type from the `kotlin.collections` package. Takes two type arguments. */
export const map: KtGenericReferenceFactory<2> = ktReference.genericFactory<2>('Map', 'kotlin.collections');
/** Reference to the `MutableMap` type from the `kotlin.collections` package. Takes two type arguments. */
export const mutableMap: KtGenericReferenceFactory<2> = ktReference.genericFactory<2>(
  'MutableMap',
  'kotlin.collections',
);
/** Reference to the `listOf` function from the `kotlin.collections` package. Takes one type argument. */
export const listOf: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>('listOf', 'kotlin.collections');
/** Reference to the `mutableListOf` function from the `kotlin.collections` package. Takes one type argument. */
export const mutableListOf: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>(
  'mutableListOf',
  'kotlin.collections',
);
/** Reference to the `mapOf` function from the `kotlin.collections` package. Takes two type arguments. */
export const mapOf: KtGenericReferenceFactory<2> = ktReference.genericFactory<2>('mapOf', 'kotlin.collections');
/** Reference to the `mutableMapOf` function from the `kotlin.collections` package. Takes two type arguments. */
export const mutableMapOf: KtGenericReferenceFactory<2> = ktReference.genericFactory<2>(
  'mutableMapOf',
  'kotlin.collections',
);

// kotlin.jvm
/** Reference to the `JvmStatic` annotation from the `kotlin.jvm` package. */
export const jvmStatic: KtReferenceFactory = ktReference.factory('JvmStatic', 'kotlin.jvm');
