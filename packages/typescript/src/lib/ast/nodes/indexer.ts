import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsIndexerNodeKind = 'indexer' as const;

export type TsIndexer<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsIndexerNodeKind,
  TBuilder
> & {
  keyName: string;
  key: AppendValue<TBuilder>;
  value: AppendValue<TBuilder>;
  readonly: boolean;
};

export function tsIndexer<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  keyType: AppendValue<TBuilder>,
  valueType: AppendValue<TBuilder>,
  options?: AstNodeOptions<TsIndexer<TBuilder>, 'key' | 'value'>
): TsIndexer<TBuilder> {
  return {
    ...tsNode(tsIndexerNodeKind, options),
    keyName: options?.keyName ?? 'key',
    key: keyType,
    value: valueType,
    readonly: options?.readonly ?? false,
  };
}

export function isTsIndexer<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown
): node is TsIndexer<TBuilder> {
  return isTsNode(node, tsIndexerNodeKind);
}

export function writeTsIndexer<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsIndexer<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.readonly, 'readonly ')
      .append('[', node.keyName, ': ', node.key, ']: ', node.value, ';')
      .appendLine()
  );
}
