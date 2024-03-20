import { AppendValue, AstNodeOptions, SourceBuilder, notNullish } from '@goast/core';

import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsIntersectionNodeKind = 'intersection-type' as const;

export type TsIntersectionType<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsIntersectionNodeKind,
  TBuilder
> & {
  types: AppendValue<TBuilder>[];
};

export function tsIntersectionType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  types: AppendValue<TBuilder>[],
  options?: AstNodeOptions<TsIntersectionType<TBuilder>, 'types'>
): TsIntersectionType<TBuilder> {
  return { ...tsNode(tsIntersectionNodeKind, options), types: types.filter(notNullish) };
}

export function isTsIntersectionType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown
): value is TsIntersectionType<TBuilder> {
  return isTsNode(value, tsIntersectionNodeKind);
}

export function writeTsIntersectionType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsIntersectionType<TBuilder>
): TBuilder {
  const types: AppendValue<TBuilder>[] = node.types.length === 0 ? ['unknown'] : resolveNestedIntersectionTypes(node);
  const multiline = types.length > 2;
  return writeTsNode(builder, node, (b) =>
    b.parenthesizeIf(
      types.length > 1,
      '()',
      (b) =>
        b.appendIf(multiline, '& ').forEach(types, (b, t) => b.append(t), {
          separator: multiline ? '\n& ' : ' & ',
        }),
      { indent: multiline, multiline }
    )
  );
}

function resolveNestedIntersectionTypes<TBuilder extends SourceBuilder>(
  node: TsIntersectionType<TBuilder>
): AppendValue<TBuilder>[] {
  const types: AppendValue<TBuilder>[] = [];
  for (const type of node.types) {
    if (isTsIntersectionType<TBuilder>(type)) {
      types.push(...resolveNestedIntersectionTypes(type));
    } else {
      types.push(type);
    }
  }
  return types;
}
