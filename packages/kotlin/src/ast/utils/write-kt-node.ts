import {
  type AppendValue,
  notNullish,
  type Nullable,
  type Separator,
  type SingleOrMultiple,
  type SourceBuilder,
  toArray,
} from '@goast/core';

import { KtNode } from '../node.ts';

/**
 * A value that the Kotlin writers accept: a plain append value, which is appended as is, or a `KtNode`, which writes
 * itself.
 * @template TBuilder The type of the source builder the value is written to.
 */
export type KtAppendValue<TBuilder extends SourceBuilder> = AppendValue<TBuilder> | KtNode<TBuilder>;

/**
 * Writes one Kotlin node or append value to the builder.
 *
 * A `KtNode` writes itself. Any other value is appended as is, so nullish values write nothing. No separators, line
 * breaks or blank lines are added.
 *
 * @template TBuilder The type of the source builder the node is written to.
 * @param builder The builder to write to.
 * @param node The node or append value to write. Nullish values write nothing.
 */
export function writeKtNode<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  node: Nullable<KtAppendValue<TBuilder>>,
): void {
  if (node instanceof KtNode) {
    node.write(builder);
  } else {
    builder.append(node);
  }
}

/**
 * Writes one or more Kotlin nodes or append values to the builder, ignoring nullish entries.
 *
 * After nullish entries are removed, a single entry is written as is, and several entries are written one after
 * another.
 * Between two entries the `separator` option is written: a string is appended as is, and a callback appends its own
 * content. Without a separator, the entries are written back to back. No entries write nothing. No line breaks or blank
 * lines are added by this function.
 *
 * @template TBuilder The type of the source builder the nodes are written to.
 * @param builder The builder to write to.
 * @param nodes A single node or an array of nodes. Nullish entries are ignored.
 * @param options Options for writing. `separator` is written between each pair of consecutive entries.
 */
export function writeKtNodes<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtAppendValue<TBuilder>>>,
  options?: { separator?: Separator<TBuilder, KtAppendValue<TBuilder>> },
): void {
  const filteredNodes = toArray(nodes).filter(notNullish);
  if (filteredNodes.length === 1) {
    writeKtNode(builder, filteredNodes[0]);
  } else if (filteredNodes.length > 1) {
    builder.forEach(filteredNodes, writeKtNode, { separator: options?.separator });
  }
}
