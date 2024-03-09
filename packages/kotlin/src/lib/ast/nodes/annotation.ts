import { AppendValue, AstNodeOptions, SourceBuilder, StringSuggestions } from '@goast/core';

import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';

export const ktAnnotationNodeKind = 'annotation' as const;

export type KtAnnotationTarget = StringSuggestions<
  'file' | 'property' | 'field' | 'get' | 'set' | 'receiver' | 'param' | 'setparam' | 'delegate'
>;
export type KtAnnotation<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktAnnotationNodeKind,
  TBuilder
> & {
  class: AppendValue<TBuilder>;
  parameters: AppendValue<TBuilder>[];
  target: KtAnnotationTarget | null;
};

export function ktAnnotation<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  $class: AppendValue<TBuilder>,
  parameters?: AppendValue<TBuilder>[] | null,
  options?: AstNodeOptions<KtAnnotation<TBuilder>, 'class' | 'parameters'>
): KtAnnotation<TBuilder> {
  return {
    ...ktNode(ktAnnotationNodeKind, options),
    class: $class,
    parameters: parameters ?? [],
    target: options?.target ?? null,
  };
}

export function isKtAnnotation<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  value: unknown
): value is KtAnnotation<TBuilder> {
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
      .if(node.parameters.length > 0, (b) =>
        b.parenthesize('()', (b) => b.forEach(node.parameters, (b, p) => b.append(p), { separator: ', ' }))
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
