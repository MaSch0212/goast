import type { SourceBuilder } from '@goast/core';

import { GoInterface } from '../nodes/interface.ts';
import { GoMap } from '../nodes/map.ts';
import { GoPointer } from '../nodes/pointer.ts';
import { GoSlice } from '../nodes/slice.ts';
import type { GoType } from '../nodes/types.ts';
import { isGoNilableReference } from '../nodes/reference.ts';

/**
 * Whether the zero value of the type is `nil`: pointers, slices, maps and interfaces. Such a type can express an
 * absent value without becoming a pointer.
 *
 * @template TBuilder The type of the source builder the type is written to.
 * @param type The type to check.
 * @returns Whether the zero value of the type is `nil`.
 */
export function isGoNilableType<TBuilder extends SourceBuilder>(type: GoType<TBuilder>): boolean {
  return (
    type instanceof GoPointer ||
    type instanceof GoSlice ||
    type instanceof GoMap ||
    type instanceof GoInterface ||
    isGoNilableReference(type)
  );
}
