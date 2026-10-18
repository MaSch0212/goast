import { notNullish, type Nullable, type SingleOrMultiple, type SourceBuilder, toArray } from '@goast/core';

import { type CsAppendValue, writeCsNodes } from './write-cs-node.ts';

/** Writes an argument list including its parentheses: `()`, `(a, b)`. More than three arguments are written one per line. */
export function writeCsArguments<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<CsAppendValue<TBuilder>>>,
) {
  const filteredNodes = toArray(nodes).filter(notNullish);

  if (filteredNodes.length === 0) {
    builder.append('()');
    return;
  }

  const multiline = filteredNodes.length > 3;
  builder.parenthesize('()', (b) => writeCsNodes(b, filteredNodes, { separator: multiline ? ',\n' : ', ' }), {
    multiline,
  });
}
