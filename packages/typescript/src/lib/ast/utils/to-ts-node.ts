import { SourceBuilder, BasicAppendValue } from '@goast/core';

import { TsObject, tsObject } from '../nodes/object';
import { tsProperty } from '../nodes/property';
import { TsString, tsString } from '../nodes/string';
import { TsTuple, tsTuple } from '../nodes/tuple';

export function toTsNode<TBuilder extends SourceBuilder>(object: Record<string, unknown>): TsObject<TBuilder>;
export function toTsNode<TBuilder extends SourceBuilder>(tuple: unknown[]): TsTuple<TBuilder>;
export function toTsNode<TBuilder extends SourceBuilder>(string: string): TsString<TBuilder>;
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
