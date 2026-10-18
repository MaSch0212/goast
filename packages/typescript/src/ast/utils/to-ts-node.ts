import type { BasicAppendValue, SourceBuilder } from '@goast/core';

import { type TsObject, tsObject } from '../nodes/object.ts';
import { tsProperty } from '../nodes/property.ts';
import { type TsString, tsString } from '../nodes/string.ts';
import { type TsTuple, tsTuple } from '../nodes/tuple.ts';

/**
 * Converts a plain object to a TypeScript object literal node.
 * Each entry becomes a property named after its key, and each value is converted with this function.
 * @template TBuilder The type of the source builder the node is written to.
 * @param object The object to convert.
 * @returns An object node with one property per entry of `object`.
 */
export function toTsNode<TBuilder extends SourceBuilder>(object: Record<string, unknown>): TsObject<TBuilder>;
/**
 * Converts an array to a TypeScript tuple node.
 * Each item is converted with this function, in order.
 * @template TBuilder The type of the source builder the node is written to.
 * @param tuple The array to convert.
 * @returns A tuple node with one element per item of `tuple`.
 */
export function toTsNode<TBuilder extends SourceBuilder>(tuple: unknown[]): TsTuple<TBuilder>;
/**
 * Converts a string to a TypeScript string literal node.
 * @template TBuilder The type of the source builder the node is written to.
 * @param string The string to convert.
 * @returns A string literal node with the value of `string`.
 */
export function toTsNode<TBuilder extends SourceBuilder>(string: string): TsString<TBuilder>;
/**
 * Converts a value of unknown type to a node. Arrays and objects are converted as in the overloads above.
 * `null`, `undefined`, booleans and numbers are written as plain text, and any other value is written as a
 * string literal of its `String()` form.
 * @template TBuilder The type of the source builder the node is written to.
 * @param value The value to convert.
 * @returns The converted node.
 */
export function toTsNode<TBuilder extends SourceBuilder>(value: unknown): BasicAppendValue<TBuilder>;
export function toTsNode<TBuilder extends SourceBuilder>(value: unknown): unknown {
  if (Array.isArray(value)) {
    return tsTuple(value.map((x) => toTsNode<TBuilder>(x)));
  }
  if (typeof value === 'object' && value !== null) {
    const result = tsObject<TBuilder>();
    for (const [k, v] of Object.entries(value)) {
      result.members.push(tsProperty(k, { value: toTsNode(v) }));
    }
    return result;
  }
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  return tsString(String(value));
}
