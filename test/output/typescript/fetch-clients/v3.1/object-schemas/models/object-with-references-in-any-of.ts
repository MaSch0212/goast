import type { EmptyObject } from './empty-object';
import type { MyString } from './my-string';
import type { MyTitle } from './my-title';

export type ObjectWithReferencesInAnyOf =
  | (EmptyObject)
  | (MyTitle)
  | (MyString)
  | (string);
