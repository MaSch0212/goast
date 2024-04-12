import { Nullable, SingleOrMultiple, SourceBuilder, notNullish, toArray } from '@goast/core';

import { KtAppendValue, writeKtNode, writeKtNodes } from './write-kt-node';
import { KtLambda } from '../nodes/lambda';

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
