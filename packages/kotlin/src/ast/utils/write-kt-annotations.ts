import { notNullish, type Nullable, type SingleOrMultiple, type SourceBuilder, toArray } from '@goast/core';

import { type KtAppendValue, writeKtNode } from './write-kt-node.ts';

/**
 * Writes a list of annotations, each followed by a separator.
 *
 * Each annotation, including the last one, is followed by a line break when `options.multiline` is set, or by a single
 * space otherwise. Nothing is written before the first annotation, and no blank lines are added. Content written after
 * the annotations therefore starts after that trailing separator.
 *
 * @template TBuilder The type of the source builder the annotations are written to.
 * @param builder The builder to write to.
 * @param nodes The annotations, as a single node or an array. Nullish entries are ignored.
 * @param options Options for writing. When `multiline` is `true`, each annotation is followed by a line break instead
 * of a space.
 */
export function writeKtAnnotations<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtAppendValue<TBuilder>>>,
  options?: { multiline: boolean },
) {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, (b, a) => {
    writeKtNode(b, a);
    b.append(options?.multiline ? '\n' : ' ');
  });
}
