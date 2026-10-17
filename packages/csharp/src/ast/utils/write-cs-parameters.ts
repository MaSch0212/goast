import { notNullish, type Nullable, type SingleOrMultiple, type SourceBuilder, toArray } from '@goast/core';

import { type CsAppendValue, writeCsNode } from './write-cs-node.ts';

/**
 * Writes a parameter list including its parentheses. Lists with more than three parameters, or with parameters that
 * have attributes, are written one parameter per line.
 */
export function writeCsParameters<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<CsAppendValue<TBuilder>>>,
) {
  const filteredNodes = toArray(nodes).filter(notNullish);
  const hasAttributes = filteredNodes.some(
    (p) => typeof p === 'object' && 'attributes' in p && Array.isArray(p.attributes) && p.attributes.length > 0,
  );
  const multiline = filteredNodes.length > 3 || hasAttributes;
  builder.parenthesize(
    '()',
    (b) => b.forEach(filteredNodes, (b, p) => writeCsNode(b, p), { separator: multiline ? ',\n' : ', ' }),
    {
      multiline: multiline && filteredNodes.length > 0,
    },
  );
}
