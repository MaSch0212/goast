import {
  type AppendValue,
  notNullish,
  type Nullable,
  type SingleOrMultiple,
  type SourceBuilder,
  toArray,
} from '@goast/core';

import type { TsNode } from '../node.ts';
import { writeTsNodes } from './write-ts-nodes.ts';

export function writeTsGenericParameters<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<TsNode<TBuilder> | AppendValue<TBuilder>>>,
): void {
  const filteredNodes = toArray(nodes).filter(notNullish);
  const multiline = filteredNodes.length > 2;
  builder.parenthesizeIf(
    filteredNodes.length > 0,
    '<>',
    (b) => writeTsNodes(b, filteredNodes, { separator: multiline ? ',\n' : ', ' }),
    { multiline },
  );
}
