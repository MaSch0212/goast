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

/**
 * Writes a parameter list in parentheses, such as `(a: string, b: number)`.
 * The parameters are written on one line, separated by `, `, unless there are more than two of them or any of them has
 * decorators. Otherwise each parameter is written on its own line, separated by `,` and a line break, and the closing
 * parenthesis is written on its own line. Nullish entries are skipped.
 * @template TBuilder The type of the source builder the parameters are written to.
 * @param builder The builder to write to.
 * @param nodes The parameters to write. A single parameter is also accepted.
 */
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
