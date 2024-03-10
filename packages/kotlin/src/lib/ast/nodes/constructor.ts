import { AppendValue, AstNodeOptions, SourceBuilder, StringSuggestions, suggestionsAsString } from '@goast/core';

import { KtAnnotation, writeKtAnnotations } from './annotation';
import { KtParameter, writeKtParameters } from './parameter';
import { KtAccessibility, KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';

export const ktConstructorNodeKind = 'constructor' as const;

export type KtConstructor<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktConstructorNodeKind,
  TBuilder
> & {
  accessibility: KtAccessibility;
  annotations: KtAnnotation<TBuilder>[];
  parameters: KtParameter<TBuilder>[];
  body: AppendValue<TBuilder>;
  delegateTarget: StringSuggestions<'this' | 'super'> | null;
  delegateArguments: AppendValue<TBuilder>[];
};

export function ktConstructor<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  parameters: KtParameter<TBuilder>[],
  body: AppendValue<TBuilder>,
  options?: AstNodeOptions<KtConstructor<TBuilder>, 'parameters' | 'body'>
): KtConstructor<TBuilder> {
  return {
    ...ktNode(ktConstructorNodeKind, options),
    parameters,
    body,
    accessibility: options?.accessibility ?? null,
    annotations: options?.annotations ?? [],
    delegateTarget: options?.delegateTarget ?? null,
    delegateArguments: options?.delegateArguments ?? [],
  };
}

export function isKtConstructor<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  node: unknown
): node is KtConstructor<TBuilder> {
  return isKtNode(node, ktConstructorNodeKind);
}

export function writeKtConstructor<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  node: KtConstructor<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .append((b) => writeKtAnnotations(b, node.annotations, true))
      .appendIf(!!node.accessibility, node.accessibility, ' ')
      .append('constructor', (b) => writeKtParameters(b, node.parameters), ' ')
      .appendIf(
        !!node.delegateTarget,
        ': ',
        suggestionsAsString(node.delegateTarget),
        (b) =>
          b.parenthesize('()', (b) => b.forEach(node.delegateArguments, (b, a) => b.append(a), { separator: ', ' })),
        ' '
      )
      .parenthesize('{}', node.body, { multiline: !!node.body })
  );
}
