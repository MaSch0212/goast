import { ktReference } from '../nodes/reference.ts';

// reactor.core.publisher
export const flux = ktReference.genericFactory<1>('Flux', 'reactor.core.publisher');
export const mono = ktReference.genericFactory<1>('Mono', 'reactor.core.publisher');
