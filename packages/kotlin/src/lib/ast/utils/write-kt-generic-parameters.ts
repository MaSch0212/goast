import { SourceBuilder, SingleOrMultiple, Nullable, toArray, notNullish } from '@goast/core';

import { KtAppendValue, writeKtNode } from './write-kt-node';

export function writeKtGenericParameters<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtAppendValue<TBuilder>>>,
) {
  const filteredNodes = toArray(nodes).filter(notNullish);
  if (filteredNodes.length === 0) return;
  builder.parenthesize('<>', (b) => b.forEach(filteredNodes, writeKtNode, { separator: ', ' }));
}
