import type { BasicAppendValue, SourceBuilder } from '@goast/core';

import { type CsCollectionExpression, csCollectionExpression } from '../nodes/collection-expression.ts';
import { type CsString, csString } from '../nodes/string.ts';

/**
 * Converts a JavaScript value into the C# literal expression for it: strings become string literals, numbers and
 * booleans their literal text, `null`/`undefined` become `null` and arrays become collection expressions.
 */
export function toCsNode<TBuilder extends SourceBuilder>(list: unknown[]): CsCollectionExpression<TBuilder>;
export function toCsNode<TBuilder extends SourceBuilder>(string: string): CsString<TBuilder>;
export function toCsNode<TBuilder extends SourceBuilder>(value: unknown): BasicAppendValue<TBuilder>;
export function toCsNode<TBuilder extends SourceBuilder>(value: unknown): unknown {
  if (Array.isArray(value)) {
    return csCollectionExpression<TBuilder>(value.map((x) => toCsNode<TBuilder>(x)));
  }
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    return csString<TBuilder>(value);
  }
  throw new Error(`Cannot convert a value of type '${typeof value}' to a C# literal.`);
}
