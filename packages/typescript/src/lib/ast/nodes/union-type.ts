import { AppendValue, AstNodeOptions, SourceBuilder, notNullish } from '@goast/core';

import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsUnionNodeKind = 'union-type' as const;

export type TsUnionType<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsUnionNodeKind,
  TBuilder
> & {
  types: AppendValue<TBuilder>[];
};

export function tsUnionType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  types: AppendValue<TBuilder>[],
  options?: AstNodeOptions<TsUnionType<TBuilder>, 'types'>
): TsUnionType<TBuilder> {
  return { ...tsNode(tsUnionNodeKind, options), types: types.filter(notNullish) };
}

export function isTsUnionType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown
): value is TsUnionType<TBuilder> {
  return isTsNode(value, tsUnionNodeKind);
}

export function writeTsUnionType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsUnionType<TBuilder>
): TBuilder {
  const types: AppendValue<TBuilder>[] = node.types.length === 0 ? ['never'] : node.types;
  return writeTsNode(builder, node, (b) => b.forEach(types, (b, t) => b.parenthesize('()', t), { separator: ' | ' }));
}
