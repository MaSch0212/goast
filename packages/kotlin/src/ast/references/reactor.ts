import { type KtGenericReferenceFactory, ktReference } from '../nodes/reference.ts';

// reactor.core.publisher
export const flux: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>('Flux', 'reactor.core.publisher');
export const mono: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>('Mono', 'reactor.core.publisher');
