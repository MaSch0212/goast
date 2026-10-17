import { notNullish, type Nullable, type SingleOrMultiple, type SourceBuilder, toArray } from '@goast/core';

import { KtLambda } from '../nodes/lambda.ts';
import { type KtAppendValue, writeKtNode, writeKtNodes } from './write-kt-node.ts';

/**
 * Writes a call's argument list, moving a trailing lambda after the closing parenthesis.
 *
 * - No arguments write `()`.
 * - A trailing `KtLambda`, passed directly or as the value of an unnamed argument, is removed from the arguments and
 *   written after them with a leading space, such as `foo(a) { ... }`.
 * - If the lambda is the only argument, the parentheses are omitted, such as `foo { ... }`.
 * - Arguments are written inline, separated by `, `. With more than three arguments, the parentheses go on their own
 *   lines and each argument is written on its own line, separated by `,` and a line break.
 * - No blank lines and no trailing comma are written.
 *
 * @template TBuilder The type of the source builder the arguments are written to.
 * @param builder The builder to write to.
 * @param nodes The arguments, as a single node or an array. Nullish entries are ignored.
 */
export function writeKtArguments<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtAppendValue<TBuilder>>>,
) {
  const filteredNodes = toArray(nodes).filter(notNullish);

  if (filteredNodes.length === 0) {
    builder.append('()');
    return;
  }

  const lastNode = filteredNodes[filteredNodes.length - 1];
  let lambda: KtAppendValue<TBuilder> | null = null;
  if (lastNode instanceof KtLambda) {
    lambda = lastNode;
    filteredNodes.pop();
  } else if (
    typeof lastNode === 'object' &&
    (!('name' in lastNode) || !lastNode.name) &&
    'value' in lastNode &&
    lastNode.value instanceof KtLambda
  ) {
    lambda = lastNode.value;
    filteredNodes.pop();
  }

  const multiline = filteredNodes.length > 3;

  builder.parenthesizeIf(
    filteredNodes.length > 0,
    '()',
    (b) => writeKtNodes(b, filteredNodes, { separator: multiline ? ',\n' : ', ' }),
    { multiline },
  );

  if (lambda) {
    builder.append(' ');
    writeKtNode(builder, lambda);
  }
}
