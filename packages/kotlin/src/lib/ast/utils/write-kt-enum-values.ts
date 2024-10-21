import { notNullish, type Nullable, type SingleOrMultiple, type SourceBuilder, toArray } from '@goast/core';

import { type KtAppendValue, writeKtNode } from './write-kt-node.ts';

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
  const multiline = spacing ||
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
