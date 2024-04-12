import { SourceBuilder, SingleOrMultiple, Nullable, toArray, notNullish } from '@goast/core';

import { KtAppendValue, writeKtNode } from './write-kt-node';

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
