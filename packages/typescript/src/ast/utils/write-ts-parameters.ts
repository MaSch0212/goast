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

export function writeTsParameters<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<TsNode<TBuilder> | AppendValue<TBuilder>>>,
) {
  const filteredNodes = toArray(nodes).filter(notNullish);
  const multiline = filteredNodes.length > 2 ||
    filteredNodes.some((p) =>
      typeof p === 'object' && 'decorators' in p && Array.isArray(p.decorators) && p.decorators.length > 0
    );
  builder.parenthesize('()', (b) => writeTsNodes(b, filteredNodes, { separator: multiline ? ',\n' : ', ' }), {
    multiline,
  });
}
