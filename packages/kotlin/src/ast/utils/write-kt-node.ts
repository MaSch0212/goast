import {
  type AppendValue,
  notNullish,
  type Nullable,
  type Separator,
  type SingleOrMultiple,
  type SourceBuilder,
  toArray,
} from '@goast/core';

import { KtNode } from '../node.ts';

export type KtAppendValue<TBuilder extends SourceBuilder> = AppendValue<TBuilder> | KtNode<TBuilder>;

export function writeKtNode<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  node: Nullable<KtAppendValue<TBuilder>>,
): void {
  if (node instanceof KtNode) {
    node.write(builder);
  } else {
    builder.append(node);
  }
}

export function writeKtNodes<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtAppendValue<TBuilder>>>,
  options?: { separator?: Separator<TBuilder, KtAppendValue<TBuilder>> },
): void {
  const filteredNodes = toArray(nodes).filter(notNullish);
  if (filteredNodes.length === 1) {
    writeKtNode(builder, filteredNodes[0]);
  } else if (filteredNodes.length > 1) {
    builder.forEach(filteredNodes, writeKtNode, { separator: options?.separator });
  }
}
