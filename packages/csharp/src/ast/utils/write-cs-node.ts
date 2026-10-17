import {
  type AppendValue,
  notNullish,
  type Nullable,
  type Separator,
  type SingleOrMultiple,
  type SourceBuilder,
  toArray,
} from '@goast/core';

import { CsNode } from '../node.ts';

export type CsAppendValue<TBuilder extends SourceBuilder> = AppendValue<TBuilder> | CsNode<TBuilder>;

export function writeCsNode<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  node: Nullable<CsAppendValue<TBuilder>>,
): void {
  if (node instanceof CsNode) {
    node.write(builder);
  } else {
    builder.append(node);
  }
}

export function writeCsNodes<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<CsAppendValue<TBuilder>>>,
  options?: { separator?: Separator<TBuilder, CsAppendValue<TBuilder>> },
): void {
  const filteredNodes = toArray(nodes).filter(notNullish);
  if (filteredNodes.length === 1) {
    writeCsNode(builder, filteredNodes[0]);
  } else if (filteredNodes.length > 1) {
    builder.forEach(filteredNodes, writeCsNode, { separator: options?.separator });
  }
}
