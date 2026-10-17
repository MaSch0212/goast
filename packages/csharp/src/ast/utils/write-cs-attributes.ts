import { notNullish, type Nullable, type SingleOrMultiple, type SourceBuilder, toArray } from '@goast/core';

import { type CsAppendValue, writeCsNode } from './write-cs-node.ts';

/**
 * Writes attributes. By default every attribute is followed by a space (`[A] [B] `); with `multiline` every attribute
 * is written on its own line.
 */
export function writeCsAttributes<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<CsAppendValue<TBuilder>>>,
  options?: { multiline: boolean },
) {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, (b, a) => {
    writeCsNode(b, a);
    b.append(options?.multiline ? '\n' : ' ');
  });
}
