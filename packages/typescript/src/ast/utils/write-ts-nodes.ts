import {
  type AppendValue,
  notNullish,
  type Nullable,
  type Separator,
  type SingleOrMultiple,
  type SourceBuilder,
  toArray,
} from '@goast/core';

import { TsNode } from '../node.ts';

/**
 * Writes a single node or value to a builder.
 * A `TsNode` writes itself. Any other value is passed to the builder's `append` method.
 * @template TBuilder The type of the source builder the node is written to.
 * @param builder The builder to write to.
 * @param node The node or value to write.
 */
export function writeTsNode<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  node: Nullable<AppendValue<TBuilder> | TsNode<TBuilder>>,
): void {
  if (node instanceof TsNode) {
    node.write(builder);
  } else {
    builder.append(node);
  }
}

/**
 * Writes one or more nodes or values to a builder, one after another.
 * Nullish entries are skipped, and nothing is written when no entries remain. Without a separator, the entries are
 * written back to back, so any line break has to come from the nodes themselves.
 * @template TBuilder The type of the source builder the nodes are written to.
 * @param builder The builder to write to.
 * @param nodes The nodes or values to write. A single entry is also accepted.
 * @param options Options for writing. `separator` is written between each pair of written entries.
 */
export function writeTsNodes<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<AppendValue<TBuilder> | TsNode<TBuilder>>>,
  options?: { separator?: Separator<TBuilder, AppendValue<TBuilder> | TsNode<TBuilder>> },
): void {
  const filteredNodes = toArray(nodes).filter(notNullish);
  if (filteredNodes.length === 1) {
    writeTsNode(builder, filteredNodes[0]);
  } else if (filteredNodes.length > 1) {
    builder.forEach(filteredNodes, writeTsNode, { separator: options?.separator });
  }
}
