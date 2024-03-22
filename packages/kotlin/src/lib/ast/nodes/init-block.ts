import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';

export const ktInitBlockNodeKind = 'init-block' as const;

export type KtInitBlock<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktInitBlockNodeKind,
  TBuilder
> & {
  body: AppendValue<TBuilder>;
};

export function ktInitBlock<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  body: AppendValue<TBuilder>,
  options?: AstNodeOptions<KtInitBlock<TBuilder>, 'body'>
): KtInitBlock<TBuilder> {
  return {
    ...ktNode(ktInitBlockNodeKind, options),
    body,
  };
}

export function isKtInitBlock(value: unknown): value is KtInitBlock<never> {
  return isKtNode(value, ktInitBlockNodeKind);
}

export function writeKtInitBlock<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  node: KtInitBlock<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) => b.append('init ').parenthesize('{}', node.body, { multiline: !!node.body }));
}
