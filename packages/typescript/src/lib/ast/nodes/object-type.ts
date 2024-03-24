import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsIndexer } from './indexer';
import { TsMethod } from './method';
import { TsProperty } from './property';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';
import { writeTs } from '../writable-nodes';

export const tsObjectTypeNodeKind = 'object-type' as const;

export type TsObjectType<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsObjectTypeNodeKind,
  TBuilder
> & {
  properties: (TsProperty<TBuilder> | AppendValue<TBuilder>)[];
  methods: (TsMethod<TBuilder> | AppendValue<TBuilder>)[];
  indexer: TsIndexer<TBuilder> | null;
};

export function tsObjectType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  options?: AstNodeOptions<TsObjectType<TBuilder>>,
): TsObjectType<TBuilder> {
  return {
    ...tsNode(tsObjectTypeNodeKind, options),
    properties: options?.properties ?? [],
    methods: options?.methods ?? [],
    indexer: options?.indexer ?? null,
  };
}

export function isTsObjectType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown,
): value is TsObjectType<TBuilder> {
  return isTsNode(value, tsObjectTypeNodeKind);
}

export function writeTsObjectType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsObjectType<TBuilder>,
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b.parenthesize(
      '{}',
      (b) =>
        b
          .forEach(node.properties, (b, p) => writeTs(b, p))
          .appendIf(!!node.indexer, (b) => writeTs(b, node.indexer))
          .appendLineIf((node.properties.length > 0 || !!node.indexer) && node.methods.length > 0)
          .forEach(node.methods, (b, m) => writeTs(b, m)),
      {
        multiline: !!node.indexer || node.properties.length > 0 || node.methods.length > 0,
      },
    ),
  );
}
