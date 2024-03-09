import { AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDefaultBuilder, TsNode, getTypeScriptBuilderOptions, isTsNode, tsNode, writeTsNode } from '../common';

export const tsAnyNodeKind = 'any' as const;

export type TsAny<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<typeof tsAnyNodeKind, TBuilder>;

export function tsAny<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  options?: AstNodeOptions<TsAny<TBuilder>>
): TsAny<TBuilder> {
  return tsNode(tsAnyNodeKind, options);
}

export function isTsAny<TBuilder extends SourceBuilder = TsDefaultBuilder>(value: unknown): value is TsAny<TBuilder> {
  return isTsNode(value, tsAnyNodeKind);
}

export function writeTsAny<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsAny<TBuilder>
): TBuilder {
  const builderOptions = getTypeScriptBuilderOptions(builder);
  return writeTsNode(builder, node, (b) => b.append(builderOptions.preferUnknown ? 'unknown' : 'any'));
}
