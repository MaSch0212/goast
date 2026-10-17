import { notNullish, type Nullable, type SingleOrMultiple, type SourceBuilder, toArray } from '@goast/core';

import { type KtAppendValue, writeKtNode } from './write-kt-node.ts';

/**
 * Writes a parenthesized parameter list, such as the parameters of a function or constructor.
 *
 * The list is multiline when there are more than two parameters or when any parameter has annotations. A multiline list
 * puts the opening and closing parentheses on their own lines, indents the parameters and writes each one on its own
 * line, separated by `,` and a line break. When any parameter has annotations, a blank line is also written between
 * each pair of parameters. Otherwise the parameters are written inline, separated by `, `. An empty list is written
 * as `()`. No trailing comma is written.
 *
 * @template TBuilder The type of the source builder the parameters are written to.
 * @param builder The builder to write to.
 * @param nodes The parameters, as a single node or an array. Nullish entries are ignored.
 */
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
