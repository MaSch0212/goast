import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsMethod } from './method';
import { TsProperty } from './property';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';
import { writeTs } from '../writable-nodes';

export const tsObjectNodeKind = 'object' as const;

export type TsObject<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<typeof tsObjectNodeKind, TBuilder> & {
  properties: (TsProperty<TBuilder> | AppendValue<TBuilder>)[];
  methods: (TsMethod<TBuilder> | AppendValue<TBuilder>)[];
};

export function tsObject<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  options?: AstNodeOptions<TsObject<TBuilder>>
): TsObject<TBuilder> {
  return {
    ...tsNode(tsObjectNodeKind, options),
    properties: options?.properties ?? [],
    methods: options?.methods ?? [],
  };
}

export function isTsObject<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown
): value is TsObject<TBuilder> {
  return isTsNode(value, tsObjectNodeKind);
}

export function writeTsObject<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsObject<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b.parenthesize(
      '{}',
      (b) =>
        b
          .forEach(node.properties, (b, p) => writeTs(b, p))
          .appendLineIf(node.properties.length > 0 && node.methods.length > 0)
          .forEach(node.methods, (b, m) => writeTs(b, m), { separator: '\n' }),
      {
        multiline: node.properties.length > 0 || node.methods.length > 0,
      }
    )
  );
}
