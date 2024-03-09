import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDefaultBuilder, TsNode, isTsNode, tsNode } from '../common';

export const tsTupleNodeKind = 'tuple' as const;

export type TsTuple<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<typeof tsTupleNodeKind, TBuilder> & {
  elements: AppendValue<TBuilder>[];
};

export function tsTuple<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  elements: AppendValue<TBuilder>[],
  options?: AstNodeOptions<TsTuple<TBuilder>, 'elements'>
): TsTuple<TBuilder> {
  return { ...tsNode(tsTupleNodeKind, options), elements };
}

export function isTsTuple<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown
): value is TsTuple<TBuilder> {
  return isTsNode(value, tsTupleNodeKind);
}

export function writeTsTuple<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsTuple<TBuilder>
): TBuilder {
  return builder
    .append('[')
    .if(node.elements.length > 0, (b) =>
      b
        .append(' ')
        .forEach(node.elements, (b, e) => b.append(e), { separator: ', ' })
        .append(' ')
    )
    .append(']');
}
