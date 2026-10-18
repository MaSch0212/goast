import type { BasicAppendValue, SourceBuilder } from '@goast/core';

import { type KtCall, ktCall } from '../nodes/call.ts';
import { type KtString, ktString } from '../nodes/string.ts';
import { listOf, mapOf } from '../references/index.ts';

/**
 * Converts a plain object into a Kotlin `mapOf(...)` call, with one `"key".to(value)` entry per property.
 *
 * Each property value is converted with the same rules, recursively. The entries are the arguments of the call, so
 * they are written inline with `, ` between them, or one per line separated by `,` when there are more than three.
 * No blank lines are written.
 *
 * @template TBuilder The type of the source builder the call is written to.
 * @param object The object whose own enumerable properties become the map entries.
 * @returns A Kotlin call node for `mapOf`.
 */
export function toKtNode<TBuilder extends SourceBuilder>(object: Record<string | number, unknown>): KtCall<TBuilder>;
/**
 * Converts an array into a Kotlin `listOf(...)` call, with each element converted recursively.
 *
 * The elements are the arguments of the call, so they are written inline, separated by `, `, or one per line separated
 * by `,` when there are more than three. No blank lines are written.
 *
 * @template TBuilder The type of the source builder the call is written to.
 * @param list The array whose elements become the list entries.
 * @returns A Kotlin call node for `listOf`.
 */
export function toKtNode<TBuilder extends SourceBuilder>(list: unknown[]): KtCall<TBuilder>;
/**
 * Converts a string into a Kotlin string literal node.
 *
 * @template TBuilder The type of the source builder the literal is written to.
 * @param string The string to convert.
 * @returns A Kotlin string literal node.
 */
export function toKtNode<TBuilder extends SourceBuilder>(string: string): KtString<TBuilder>;
/**
 * Converts any value into a Kotlin node or a plain append value.
 *
 * `null` and `undefined` become the text `null`. Booleans and numbers are written with `String(value)`. Arrays and
 * objects are converted to `listOf` and `mapOf` calls, as described for the other overloads. All remaining values are
 * converted to a string literal of their `String` representation.
 *
 * @template TBuilder The type of the source builder the value is written to.
 * @param value The value to convert.
 * @returns A Kotlin call or string node for arrays, objects and other values, or the text of `null`, booleans and
 * numbers.
 */
export function toKtNode<TBuilder extends SourceBuilder>(value: unknown): BasicAppendValue<TBuilder>;
export function toKtNode<TBuilder extends SourceBuilder>(value: unknown): unknown {
  if (Array.isArray(value)) {
    return ktCall(
      [listOf.infer()],
      value.map((x) => toKtNode<TBuilder>(x)),
    );
  }
  if (typeof value === 'object' && value !== null) {
    return ktCall(
      [mapOf.infer()],
      Object.entries(value).map(([k, v]) => ktCall([toKtNode(k), 'to'], [toKtNode(v)])),
    );
  }
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  return ktString(String(value));
}
