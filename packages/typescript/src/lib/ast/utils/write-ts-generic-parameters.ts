import { SourceBuilder, SingleOrMultiple, Nullable, AppendValue, toArray, notNullish } from '@goast/core';

import { writeTsNodes } from './write-ts-nodes';
import { TsNode } from '../node';

export function writeTsGenericParameters<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<TsNode<TBuilder> | AppendValue<TBuilder>>>,
) {
  const filteredNodes = toArray(nodes).filter(notNullish);
  const multiline = filteredNodes.length > 2;
  builder.parenthesizeIf(
    filteredNodes.length > 0,
    '<>',
    (b) => writeTsNodes(b, filteredNodes, { separator: multiline ? ',\n' : ', ' }),
    { multiline },
  );
}
