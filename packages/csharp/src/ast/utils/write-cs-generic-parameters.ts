import { notNullish, type Nullable, type SingleOrMultiple, type SourceBuilder, toArray } from '@goast/core';

import { type CsAppendValue, writeCsNode, writeCsNodes } from './write-cs-node.ts';

/** Writes the type parameter list of a declaration or the type arguments of a reference: `<T, U>`. */
export function writeCsGenericParameters<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<CsAppendValue<TBuilder>>>,
) {
  const filteredNodes = toArray(nodes).filter(notNullish);
  if (filteredNodes.length === 0) return;
  builder.parenthesize('<>', (b) => b.forEach(filteredNodes, writeCsNode, { separator: ', ' }));
}

/**
 * Writes the `where` clauses of generic parameters that have constraints. A single clause is written on the same line
 * (` where T : class`), multiple clauses are written one per (indented) line. Nothing is written if no parameter has
 * constraints.
 */
export function writeCsGenericConstraints<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<CsAppendValue<TBuilder>>>,
) {
  const constrained = toArray(nodes)
    .filter(notNullish)
    .filter(
      (n): n is typeof n & { name: string; constraints: CsAppendValue<TBuilder>[] } =>
        typeof n === 'object' && 'constraints' in n && Array.isArray(n.constraints) && n.constraints.length > 0,
    );
  if (constrained.length === 0) return;

  const writeClause = (b: TBuilder, n: (typeof constrained)[number]) => {
    b.append('where ', n.name, ' : ');
    writeCsNodes(b, n.constraints, { separator: ', ' });
  };

  if (constrained.length === 1) {
    builder.append(' ');
    writeClause(builder, constrained[0]);
  } else {
    builder.indent((b) => b.forEach(constrained, (b, n) => writeClause(b.appendLine(), n)));
  }
}
