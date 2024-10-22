import { notNullish, type Nullable, type SingleOrMultiple, type SourceBuilder, toArray } from '@goast/core';

import { type KtAppendValue, writeKtNode } from './write-kt-node.ts';

export function writeKtAnnotations<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtAppendValue<TBuilder>>>,
  options?: { multiline: boolean },
) {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, (b, a) => {
    writeKtNode(b, a);
    b.append(options?.multiline ? '\n' : ' ');
  });
}
