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
 * Writes a type parameter or type argument list in angle brackets, such as `<T, U>`.
 * Nothing is written when there are no entries. The entries are written on one line, separated by `, `, unless there
 * are more than two of them. Otherwise each entry is written on its own line, separated by `,` and a line break, and
 * the closing `>` is written on its own line. Nullish entries are skipped.
 * @template TBuilder The type of the source builder the entries are written to.
 * @param builder The builder to write to.
 * @param nodes The type parameters or arguments to write. A single entry is also accepted.
 */
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
