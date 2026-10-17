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

export type GoAppendValue<TBuilder extends SourceBuilder> = AppendValue<TBuilder> | GoNode<TBuilder>;

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
