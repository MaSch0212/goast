import { SourceBuilder, AppendValue, AstNodeOptions } from '@goast/core';

import { KtAnnotation, writeKtAnnotations } from './annotation';
import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';
import { writeKt } from '../writable-nodes';

export const ktParameterNodeKind = 'parameter' as const;

export type KtParameter<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktParameterNodeKind,
  TBuilder
> & {
  name: string;
  type: AppendValue<TBuilder>;
  annotations: KtAnnotation<TBuilder>[];
  default: AppendValue<TBuilder> | null;
  vararg: boolean;
};

export function ktParameter<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  name: string,
  type: AppendValue<TBuilder>,
  options?: AstNodeOptions<KtParameter<TBuilder>, 'name' | 'type'>
): KtParameter<TBuilder> {
  return {
    ...ktNode(ktParameterNodeKind, options),
    name,
    type,
    annotations: options?.annotations ?? [],
    default: options?.default ?? null,
    vararg: options?.vararg ?? false,
  };
}

export function isKtParameter<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  node: unknown
): node is KtParameter<TBuilder> {
  return isKtNode(node, ktParameterNodeKind);
}

export function writeKtParameter<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtParameter<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .append((b) => writeKtAnnotations(b, node.annotations, true))
      .appendIf(node.vararg, 'vararg ')
      .append(node.name, ': ', node.type)
      .appendIf(!!node.default, ' = ', node.default)
  );
}

export function writeKtParameters<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  parameters: (KtParameter<TBuilder> | AppendValue<TBuilder>)[]
): TBuilder {
  const multiline = parameters.length > 2 || parameters.some((p) => isKtParameter(p) && p.annotations.length > 0);
  return builder.parenthesize(
    '()',
    (b) => b.forEach(parameters, (b, p) => writeKt(b, p), { separator: multiline ? ',\n' : ', ' }),
    { multiline }
  );
}
