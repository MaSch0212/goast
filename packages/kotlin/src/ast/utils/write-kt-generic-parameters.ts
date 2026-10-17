import { notNullish, type Nullable, type SingleOrMultiple, type SourceBuilder, toArray } from '@goast/core';

import { type KtAppendValue, writeKtNode } from './write-kt-node.ts';

/**
 * Writes a list of generic parameters or type arguments in angle brackets, such as `<T, U>`.
 *
 * Nothing is written when there are no entries. Otherwise the entries are always written on one line, separated by
 * `, `.
 *
 * @template TBuilder The type of the source builder the entries are written to.
 * @param builder The builder to write to.
 * @param nodes The type parameters or type arguments, as a single node or an array. Nullish entries are ignored.
 */
export function writeKtGenericParameters<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtAppendValue<TBuilder>>>,
) {
  const filteredNodes = toArray(nodes).filter(notNullish);
  if (filteredNodes.length === 0) return;
  builder.parenthesize('<>', (b) => b.forEach(filteredNodes, writeKtNode, { separator: ', ' }));
}
