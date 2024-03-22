import {
  AppendValue,
  AstNodeOptions,
  Nullable,
  SourceBuilder,
  StringSuggestions,
  suggestionsAsString,
} from '@goast/core';

import { KtAnnotation, writeKtAnnotations } from './annotation';
import { KtArgument } from './argument';
import { KtParameter, writeKtParameters } from './parameter';
import { KtAccessibility, KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';
import { writeKt } from '../writable-nodes';

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
  delegateArguments: (KtArgument<TBuilder> | AppendValue<TBuilder>)[];
};

export function ktConstructor<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  parameters?: Nullable<KtParameter<TBuilder>[]>,
  body?: AppendValue<TBuilder>,
  options?: AstNodeOptions<KtConstructor<TBuilder>, 'parameters' | 'body'>
): KtConstructor<TBuilder> {
  return {
    ...ktNode(ktConstructorNodeKind, options),
    parameters: parameters ?? [],
    body,
    accessibility: options?.accessibility ?? null,
    annotations: options?.annotations ?? [],
    delegateTarget: options?.delegateTarget ?? null,
    delegateArguments: options?.delegateArguments ?? [],
  };
}

export function isKtConstructor(node: unknown): node is KtConstructor<never> {
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
          b.parenthesize('()', (b) => b.forEach(node.delegateArguments, (b, a) => writeKt(b, a), { separator: ', ' })),
        ' '
      )
      .parenthesize('{}', node.body, { multiline: !!node.body })
  );
}

export function writeKtPrimaryConstructor<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  node: KtConstructor<TBuilder>
): TBuilder {
  if (node.parameters.length === 0 && !node.accessibility && node.annotations.length === 0) {
    return builder;
  }

  const needsCtorKeyword = node.annotations.length > 0 || !!node.accessibility;
  return writeKtNode(builder, node, (b) =>
    b
      .appendIf(needsCtorKeyword, ' ')
      .append((b) => writeKtAnnotations(b, node.annotations, false))
      .appendIf(!!node.accessibility, node.accessibility, ' ')
      .appendIf(needsCtorKeyword, 'constructor')
      .appendIf(needsCtorKeyword || node.parameters.length > 0, (b) => writeKtParameters(b, node.parameters))
  );
}
