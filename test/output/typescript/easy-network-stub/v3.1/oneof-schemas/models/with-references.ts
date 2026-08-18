import type { EmptyOneOf } from './empty-one-of';
import type { MyString } from './my-string';
import type { MyTitle } from './my-title';

export type WithReferences =
  | (EmptyOneOf)
  | (MyTitle)
  | (MyString)
  | (string);
