/**
 * Pre-built references to Project Reactor publisher types.
 *
 * Each `export const` is a generic factory that creates a `KtReference` with the given name and package, so the
 * generated code imports the type automatically. See `KtGenericReferenceFactory` for the type-argument tuple.
 */

import { type KtGenericReferenceFactory, ktReference } from '../nodes/reference.ts';

// reactor.core.publisher
/** Generic reference to `Flux` from the `reactor.core.publisher` package, taking one type argument. */
export const flux: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>('Flux', 'reactor.core.publisher');
/** Generic reference to `Mono` from the `reactor.core.publisher` package, taking one type argument. */
export const mono: KtGenericReferenceFactory<1> = ktReference.genericFactory<1>('Mono', 'reactor.core.publisher');
