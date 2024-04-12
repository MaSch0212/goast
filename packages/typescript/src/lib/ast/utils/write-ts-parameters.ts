import { SourceBuilder, SingleOrMultiple, Nullable, AppendValue, toArray, notNullish } from '@goast/core';

import { writeTsNodes } from './write-ts-nodes';
import { TsNode } from '../node';

export function writeTsParameters<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<TsNode<TBuilder> | AppendValue<TBuilder>>>,
) {
  const filteredNodes = toArray(nodes).filter(notNullish);
  const multiline =
    filteredNodes.length > 2 ||
    filteredNodes.some(
      (p) => typeof p === 'object' && 'decorators' in p && Array.isArray(p.decorators) && p.decorators.length > 0,
    );
  builder.parenthesize('()', (b) => writeTsNodes(b, filteredNodes, { separator: multiline ? ',\n' : ', ' }), {
    multiline,
  });
}
