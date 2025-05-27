import { type KtGenericReferenceFactory, ktReference } from '../nodes/reference.ts';

// kotlinx.coroutines.reactive
export const awaitFirst: KtGenericReferenceFactory<1> = ktReference.genericFactory(
  'awaitFirst',
  'kotlinx.coroutines.reactive',
);
export const awaitFirstOrNull: KtGenericReferenceFactory<1> = ktReference.genericFactory(
  'awaitFirstOrNull',
  'kotlinx.coroutines.reactive',
);

// kotlinx.coroutines.reactor
export const mono: KtGenericReferenceFactory<1> = ktReference.genericFactory('mono', 'kotlinx.coroutines.reactor');
