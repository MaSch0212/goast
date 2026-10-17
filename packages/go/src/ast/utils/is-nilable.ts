import type { SourceBuilder } from '@goast/core';

import { GoInterface } from '../nodes/interface.ts';
import { GoMap } from '../nodes/map.ts';
import { GoPointer } from '../nodes/pointer.ts';
import { GoSlice } from '../nodes/slice.ts';
import type { GoType } from '../nodes/types.ts';
import { any, error } from '../references/builtin.ts';
import { jsonRawMessage } from '../references/encoding.ts';
import { reader } from '../references/io.ts';

/**
 * Whether the zero value of the type is `nil`: pointers, slices, maps and interfaces. Such a type can express an
 * absent value without becoming a pointer.
 */
export function isGoNilableType<TBuilder extends SourceBuilder>(type: GoType<TBuilder>): boolean {
  return (
    type instanceof GoPointer ||
    type instanceof GoSlice ||
    type instanceof GoMap ||
    type instanceof GoInterface ||
    any.matches(type) ||
    error.matches(type) ||
    jsonRawMessage.matches(type) ||
    reader.matches(type)
  );
}
