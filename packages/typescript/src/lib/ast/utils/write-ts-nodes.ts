import { SourceBuilder, Nullable, AppendValue, SingleOrMultiple, Separator, toArray, notNullish } from '@goast/core';

import { TsNode } from '../node';

export function writeTsNode<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  node: Nullable<AppendValue<TBuilder> | TsNode<TBuilder>>,
): void {
  if (node instanceof TsNode) {
    node.write(builder);
  } else {
    builder.append(node);
  }
}

export function writeTsNodes<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<AppendValue<TBuilder> | TsNode<TBuilder>>>,
  options?: { separator?: Separator<TBuilder, AppendValue<TBuilder> | TsNode<TBuilder>> },
): void {
  const filteredNodes = toArray(nodes).filter(notNullish);
  if (filteredNodes.length === 1) {
    writeTsNode(builder, filteredNodes[0]);
  } else if (filteredNodes.length > 1) {
    builder.forEach(filteredNodes, writeTsNode, { separator: options?.separator });
  }
}
