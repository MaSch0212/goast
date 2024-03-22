import { AppendValue, AstNodeOptions, Nullable, SourceBuilder } from '@goast/core';

import { KtArgument } from './argument';
import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';
import { writeKt } from '../writable-nodes';

export const ktCallNodeKind = 'call' as const;

export type KtCall<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<typeof ktCallNodeKind, TBuilder> & {
  callPath: AppendValue<TBuilder>[];
  arguments: (KtArgument<TBuilder> | AppendValue<TBuilder>)[];
};

export function ktCall<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  callPath: AppendValue<TBuilder>[],
  $arguments?: Nullable<(KtArgument<TBuilder> | AppendValue<TBuilder>)[]>,
  options?: AstNodeOptions<KtCall<TBuilder>, 'callPath' | 'arguments'>
): KtCall<TBuilder> {
  return {
    ...ktNode(ktCallNodeKind, options),
    callPath,
    arguments: $arguments ?? [],
  };
}

export function isKtCall(node: unknown): node is KtCall<never> {
  return isKtNode(node, ktCallNodeKind);
}

export function writeKtCall<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtCall<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .forEach(node.callPath, (b, p) => b.append(p), { separator: '.' })
      .parenthesize('()', (b) => b.forEach(node.arguments, writeKt, { separator: ', ' }))
  );
}
