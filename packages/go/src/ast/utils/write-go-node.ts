import {
  type AppendValue,
  notNullish,
  type Nullable,
  type Separator,
  type SingleOrMultiple,
  SourceBuilder,
  toArray,
} from '@goast/core';

import { GoFileBuilder } from '../../file-builder.ts';
import { GoNode } from '../node.ts';

/**
 * A value that the Go writers accept: a plain append value, which is appended as is, or a `GoNode`, which writes
 * itself.
 *
 * @template TBuilder The type of the source builder the value is written to.
 */
export type GoAppendValue<TBuilder extends SourceBuilder> = AppendValue<TBuilder> | GoNode<TBuilder>;

/**
 * Writes one Go node or append value to the builder.
 *
 * A `GoNode` writes itself. Any other value is appended as is, so nullish values write nothing. No separators, line
 * breaks or blank lines are added.
 *
 * @template TBuilder The type of the source builder the node is written to.
 * @param builder The builder to write to.
 * @param node The node or append value to write. Nullish values write nothing.
 */
export function writeGoNode<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  node: Nullable<GoAppendValue<TBuilder>>,
): void {
  if (node instanceof GoNode) {
    node.write(builder);
  } else {
    builder.append(node);
  }
}

/**
 * Writes a list of Go nodes or append values in order. Nullish values are skipped. Several nodes are written one after
 * another, separated by `options.separator` when it is given.
 *
 * @template TBuilder The type of the source builder the nodes are written to.
 * @param builder The builder to write to.
 * @param nodes The node or append values to write. A single value is accepted as well as a list.
 * @param options The options of the list. `separator` is written between the nodes.
 */
export function writeGoNodes<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<GoAppendValue<TBuilder>>>,
  options?: { separator?: Separator<TBuilder, GoAppendValue<TBuilder>> },
): void {
  const filteredNodes = toArray(nodes).filter(notNullish);
  if (filteredNodes.length === 1) {
    writeGoNode(builder, filteredNodes[0]);
  } else if (filteredNodes.length > 1) {
    builder.forEach(filteredNodes, writeGoNode, { separator: options?.separator });
  }
}

/**
 * Renders a node to a string, e.g. to measure it for alignment. Imports it needs are still added to the builder.
 *
 * The node is written to a fork of a `GoFileBuilder`, which shares the imports, or to a new builder with the options of
 * the given one. So the returned text does not include anything else already written to the builder.
 *
 * @template TBuilder The type of the source builder the node would be written to.
 * @param builder The builder whose options and imports are used.
 * @param node The node or append value to render. Nullish values render an empty string.
 * @returns The text of the node.
 */
export function renderGoNode<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  node: Nullable<GoAppendValue<TBuilder>>,
): string {
  const fragment = (builder instanceof GoFileBuilder
    ? builder.fork()
    : new SourceBuilder(builder.options)) as unknown as TBuilder;
  writeGoNode(fragment, node);
  return fragment instanceof GoFileBuilder ? fragment.toFragmentString() : fragment.toString();
}
