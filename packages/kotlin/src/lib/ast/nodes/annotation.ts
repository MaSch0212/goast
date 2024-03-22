import { AppendValue, AstNodeOptions, SourceBuilder, StringSuggestions } from '@goast/core';

import { KtArgument } from './argument';
import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';
import { writeKt } from '../writable-nodes';

export const ktAnnotationNodeKind = 'annotation' as const;

export type KtAnnotationTarget = StringSuggestions<
  'file' | 'property' | 'field' | 'get' | 'set' | 'receiver' | 'param' | 'setparam' | 'delegate'
>;
export type KtAnnotation<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktAnnotationNodeKind,
  TBuilder
> & {
  class: AppendValue<TBuilder>;
  arguments: (KtArgument<TBuilder> | AppendValue<TBuilder>)[];
  target: KtAnnotationTarget | null;
};

export function ktAnnotation<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  $class: AppendValue<TBuilder>,
  $arguments?: AppendValue<TBuilder>[] | null,
  options?: AstNodeOptions<KtAnnotation<TBuilder>, 'class' | 'arguments'>
): KtAnnotation<TBuilder> {
  return {
    ...ktNode(ktAnnotationNodeKind, options),
    class: $class,
    arguments: $arguments ?? [],
    target: options?.target ?? null,
  };
}

export function isKtAnnotation(value: unknown): value is KtAnnotation<never> {
  return isKtNode(value, ktAnnotationNodeKind);
}

export function writeKtAnnotation<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtAnnotation<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .append('@')
      .appendIf(!!node.target, node.target as string | null, ':')
      .append(node.class)
      .if(node.arguments.length > 0, (b) =>
        b.parenthesize('()', (b) => b.forEach(node.arguments, (b, p) => writeKt(b, p), { separator: ', ' }))
      )
  );
}

export function writeKtAnnotations<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  annotations: KtAnnotation<TBuilder>[],
  multiline: boolean
): TBuilder {
  return builder.forEach(annotations, (b, a) => writeKtAnnotation(b, a).if(multiline, '\n', ' '));
}
