import { goReference } from '../nodes/reference.ts';

/** A reference to `context.Context` of the `context` package. */
export const context = goReference.factory('Context', 'context', undefined, { nilable: true });
