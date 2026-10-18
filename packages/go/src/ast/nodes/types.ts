import type { BasicAppendValue, SourceBuilder } from '@goast/core';

import type { GoInterface } from './interface.ts';
import type { GoMap } from './map.ts';
import type { GoPointer } from './pointer.ts';
import type { GoReference } from './reference.ts';
import type { GoSlice } from './slice.ts';
import type { GoStruct } from './struct.ts';

/**
 * Anything that can be written where Go expects a type: a reference to a named type, a pointer, a slice, a map, a
 * struct, an interface, or any other value, which is appended as is.
 *
 * @template TBuilder The type of the source builder the type is written to.
 */
export type GoType<TBuilder extends SourceBuilder> =
  | GoReference<TBuilder>
  | GoPointer<TBuilder>
  | GoSlice<TBuilder>
  | GoMap<TBuilder>
  | GoStruct<TBuilder>
  | GoInterface<TBuilder>
  | BasicAppendValue<TBuilder>;
