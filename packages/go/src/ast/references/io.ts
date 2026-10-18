import { goReference } from '../nodes/reference.ts';

/** A reference to `io.Reader` of the `io` package. */
export const reader = goReference.factory('Reader', 'io', undefined, { nilable: true });
/** A reference to `io.ReadCloser` of the `io` package. */
export const readCloser = goReference.factory('ReadCloser', 'io', undefined, { nilable: true });
