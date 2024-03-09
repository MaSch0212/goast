import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { writeKtAnnotations } from './annotation';
import { KtParameter } from './parameter';
import { KtAccessibility, KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';
import { writeKt } from '../writable-nodes';

export const ktClassParameterNodeKind = 'class-parameter' as const;

export type KtClassParameter<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktClassParameterNodeKind,
  TBuilder
> &
  Omit<KtParameter<TBuilder>, 'kind'> & {
    accessibility: KtAccessibility;
    property: 'readonly' | 'mutable' | null;
  };

export function ktClassParameter<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  name: string,
  type: string,
  options?: AstNodeOptions<KtClassParameter<TBuilder>, 'name' | 'type'>
): KtClassParameter<TBuilder> {
  return {
    ...ktNode(ktClassParameterNodeKind, options),
    name,
    type,
    annotations: options?.annotations ?? [],
    default: options?.default ?? null,
    vararg: options?.vararg ?? false,
    accessibility: options?.accessibility ?? null,
    property: options?.property ?? null,
  };
}

export function isKtClassParameter<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  node: unknown
): node is KtClassParameter<TBuilder> {
  return isKtNode(node, ktClassParameterNodeKind);
}

export function writeKtClassParameter<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtClassParameter<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .append((b) => writeKtAnnotations(b, node.annotations, true))
      .appendIf(!!node.accessibility && !!node.property, node.accessibility, ' ')
      .appendIf(node.vararg, 'vararg ')
      .appendIf(!!node.property, node.property === 'mutable' ? 'var' : 'val', ' ')
      .append(node.name, ': ', node.type)
      .appendIf(!!node.default, ' = ', node.default)
  );
}

export function writeKtClassParameters<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  parameters: (KtClassParameter<TBuilder> | AppendValue<TBuilder>)[]
): TBuilder {
  const multiline = parameters.length > 2 || parameters.some((p) => isKtClassParameter(p) && p.annotations.length > 0);
  return builder.parenthesize(
    '()',
    (b) => b.forEach(parameters, (b, p) => writeKt(b, p), { separator: multiline ? ',\n' : ', ' }),
    {
      multiline,
    }
  );
}
