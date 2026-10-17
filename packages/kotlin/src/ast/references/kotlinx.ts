/**
 * Pre-built references to `kotlinx.coroutines` functions that bridge Reactive Streams and Reactor to coroutines.
 *
 * None of these packages is in the default `globalImports`, so every reference emits an `import`.
 */
import { type KtGenericReferenceFactory, ktReference } from '../nodes/reference.ts';

// kotlinx.coroutines.reactive
/** Reference to `awaitFirst` from the `kotlinx.coroutines.reactive` package. Takes one type argument. */
export const awaitFirst: KtGenericReferenceFactory<1> = ktReference.genericFactory(
  'awaitFirst',
  'kotlinx.coroutines.reactive',
);
/** Reference to `awaitFirstOrNull` from the `kotlinx.coroutines.reactive` package. Takes one type argument. */
export const awaitFirstOrNull: KtGenericReferenceFactory<1> = ktReference.genericFactory(
  'awaitFirstOrNull',
  'kotlinx.coroutines.reactive',
);

// kotlinx.coroutines.reactor
/** Reference to the `mono` builder from the `kotlinx.coroutines.reactor` package. Takes one type argument. */
export const mono: KtGenericReferenceFactory<1> = ktReference.genericFactory('mono', 'kotlinx.coroutines.reactor');
