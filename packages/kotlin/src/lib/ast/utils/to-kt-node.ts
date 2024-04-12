import { BasicAppendValue, SourceBuilder } from '@goast/core';

import { KtCall, ktCall } from '../nodes/call';
import { KtString, ktString } from '../nodes/string';
import { listOf, mapOf } from '../references';

export function toKtNode<TBuilder extends SourceBuilder>(object: Record<string | number, unknown>): KtCall<TBuilder>;
export function toKtNode<TBuilder extends SourceBuilder>(list: unknown[]): KtCall<TBuilder>;
export function toKtNode<TBuilder extends SourceBuilder>(string: string): KtString<TBuilder>;
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
