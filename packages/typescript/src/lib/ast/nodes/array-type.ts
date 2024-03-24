import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsArrayTypeNodeKind = 'array-type' as const;

export type TsArrayType<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsArrayTypeNodeKind,
  TBuilder
> & {
  type: AppendValue<TBuilder>;
  readonly: boolean;
};

export function tsArrayType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  type: AppendValue<TBuilder>,
  options?: AstNodeOptions<TsArrayType<TBuilder>, 'type'>,
): TsArrayType<TBuilder> {
  return {
    ...tsNode(tsArrayTypeNodeKind, options),
    type,
    readonly: options?.readonly ?? false,
  };
}

export function isTsArrayType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown,
): node is TsArrayType<TBuilder> {
  return isTsNode(node, tsArrayTypeNodeKind);
}

export function writeTsArrayType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsArrayType<TBuilder>,
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b.appendIf(node.readonly, 'readonly ').parenthesize('()', node.type, { indent: false }).append('[]'),
  );
}
