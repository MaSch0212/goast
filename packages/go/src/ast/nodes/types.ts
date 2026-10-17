import type { BasicAppendValue, SourceBuilder } from '@goast/core';

import type { GoInterface } from './interface.ts';
import type { GoMap } from './map.ts';
import type { GoPointer } from './pointer.ts';
import type { GoReference } from './reference.ts';
import type { GoSlice } from './slice.ts';
import type { GoStruct } from './struct.ts';

/** Anything that can be written where Go expects a type. */
export type GoType<TBuilder extends SourceBuilder> =
  | GoReference<TBuilder>
  | GoPointer<TBuilder>
  | GoSlice<TBuilder>
  | GoMap<TBuilder>
  | GoStruct<TBuilder>
  | GoInterface<TBuilder>
  | BasicAppendValue<TBuilder>;
