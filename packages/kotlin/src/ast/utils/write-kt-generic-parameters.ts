import { notNullish, type Nullable, type SingleOrMultiple, type SourceBuilder, toArray } from '@goast/core';

import { type KtAppendValue, writeKtNode } from './write-kt-node.ts';

export function writeKtGenericParameters<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtAppendValue<TBuilder>>>,
) {
  const filteredNodes = toArray(nodes).filter(notNullish);
  if (filteredNodes.length === 0) return;
  builder.parenthesize('<>', (b) => b.forEach(filteredNodes, writeKtNode, { separator: ', ' }));
}
