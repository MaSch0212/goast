import { notNullish, type Nullable, type SingleOrMultiple, type SourceBuilder, toArray } from '@goast/core';

import { type KtAppendValue, writeKtNode } from './write-kt-node.ts';

/**
 * Writes the entries of a Kotlin enum class, separated by commas.
 *
 * The entries are written inline, separated by `, `, unless the list is multiline. The list is multiline when any entry
 * has annotations, a doc comment or members, when there are more than four entries, or when any entry has arguments.
 * A multiline list writes each entry on its own line, separated by `,` and a line break. When any entry has
 * annotations, a doc comment or members, a blank line is also written before every entry except the first. No trailing
 * comma or semicolon is written, so the caller adds the terminator.
 *
 * @template TBuilder The type of the source builder the entries are written to.
 * @param builder The builder to write to.
 * @param nodes The enum entries, as a single node or an array. Nullish entries are ignored.
 */
export function writeKtEnumValues<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtAppendValue<TBuilder>>>,
) {
  const filteredNodes = toArray(nodes).filter(notNullish);
  const spacing = filteredNodes.some(
    (v) =>
      typeof v === 'object' &&
      (('annotations' in v && Array.isArray(v.annotations) && v.annotations.length > 0) ||
        ('doc' in v && v.doc) ||
        ('members' in v && Array.isArray(v.members) && v.members.some(notNullish))),
  );
  const multiline =
    spacing ||
    filteredNodes.length > 4 ||
    filteredNodes.some(
      (v) => typeof v === 'object' && 'arguments' in v && Array.isArray(v.arguments) && v.arguments.length > 0,
    );
  builder.forEach(
    filteredNodes,
    (b, v, i) => b.if(spacing && i > 0, (b) => b.ensurePreviousLineEmpty()).append((b) => writeKtNode(b, v)),
    { separator: multiline ? ',\n' : ', ' },
  );
}
