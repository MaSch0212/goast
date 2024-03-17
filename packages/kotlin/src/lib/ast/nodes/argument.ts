import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';

export const ktArgumentNodeKind = 'argument' as const;

export type KtArgument<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktArgumentNodeKind,
  TBuilder
> & {
  name: string | null;
  value: AppendValue<TBuilder>;
};

export function ktArgument<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  value: AppendValue<TBuilder>,
  options?: AstNodeOptions<KtArgument<TBuilder>, 'value'>
): KtArgument<TBuilder> {
  return {
    ...ktNode(ktArgumentNodeKind, options),
    name: options?.name ?? null,
    value,
  };
}

export function ktNamedArgument<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  name: string,
  value: AppendValue<TBuilder>,
  options?: AstNodeOptions<KtArgument<TBuilder>, 'name' | 'value'>
): KtArgument<TBuilder> {
  return ktArgument(value, { ...options, name });
}

export function isKtArgument<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  node: unknown
): node is KtArgument<TBuilder> {
  return isKtNode(node, ktArgumentNodeKind);
}

export function writeKtArgument<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtArgument<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) => b.appendIf(!!node.name, node.name, ' = ').append(node.value));
}
