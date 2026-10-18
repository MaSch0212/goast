import { goReference } from '../nodes/reference.ts';

/** A reference to `json.RawMessage` of the `encoding/json` package. */
export const jsonRawMessage = goReference.factory('RawMessage', 'encoding/json', undefined, { nilable: true });
