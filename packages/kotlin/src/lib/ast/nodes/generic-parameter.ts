import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';
import { writeKt } from '../writable-nodes';

export const ktGenericParameterNodeKind = 'generic-parameter' as const;

export type KtGenericParameter<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktGenericParameterNodeKind,
  TBuilder
> & {
  name: string;
  description: AppendValue<TBuilder>;
  constraint: AppendValue<TBuilder>;
};

export function ktGenericParameter<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<KtGenericParameter<TBuilder>, 'name'>
): KtGenericParameter<TBuilder> {
  return {
    ...ktNode(ktGenericParameterNodeKind, options),
    name,
    description: options?.description ?? null,
    constraint: options?.constraint ?? null,
  };
}

export function isKtGenericParameter<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  node: unknown
): node is KtGenericParameter<TBuilder> {
  return isKtNode(node, ktGenericParameterNodeKind);
}

export function writeKtGenericParameter<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtGenericParameter<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b.append(node.name).appendIf(node.constraint !== null, ' : ', node.constraint)
  );
}

export function writeKtGenericParameters<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  parameters: (KtGenericParameter<TBuilder> | AppendValue<TBuilder>)[]
): TBuilder {
  if (parameters.length === 0) return builder;
  return builder.parenthesize('<>', (b) =>
    b.forEach(parameters, (b, p) => writeKt(b, p), {
      separator: ', ',
    })
  );
}
