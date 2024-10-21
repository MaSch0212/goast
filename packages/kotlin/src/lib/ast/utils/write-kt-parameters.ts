import { notNullish, type Nullable, type SingleOrMultiple, type SourceBuilder, toArray } from '@goast/core';

import { type KtAppendValue, writeKtNode } from './write-kt-node.ts';

export function writeKtParameters<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtAppendValue<TBuilder>>>,
) {
  const filteredNodes = toArray(nodes).filter(notNullish);
  const hasAnnotations = filteredNodes.some(
    (p) => typeof p === 'object' && 'annotations' in p && Array.isArray(p.annotations) && p.annotations.length > 0,
  );
  const multiline = filteredNodes.length > 2 || hasAnnotations;
  const spacing = multiline && hasAnnotations;
  builder.parenthesize(
    '()',
    (b) =>
      b.forEach(
        filteredNodes,
        (b, p, i) => b.if(i > 0 && spacing, (b) => b.ensurePreviousLineEmpty()).append((b) => writeKtNode(b, p)),
        { separator: multiline ? ',\n' : ', ' },
      ),
    { multiline },
  );
}
