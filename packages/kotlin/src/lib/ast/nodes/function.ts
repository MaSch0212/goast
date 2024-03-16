import { SourceBuilder, AppendValue, AstNodeOptions } from '@goast/core';

import { KtAnnotation, writeKtAnnotations } from './annotation';
import { KtDoc } from './doc';
import { KtGenericParameter, writeKtGenericParameters } from './generic-parameter';
import { KtParameter, writeKtParameters } from './parameter';
import { KtReference } from './reference';
import { KtDefaultBuilder, KtNode, KtAccessibility, ktNode, isKtNode, writeKtNode } from '../common';
import { writeKt } from '../writable-nodes';

export const ktFunctionNodeKind = 'function' as const;

export type KtFunction<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktFunctionNodeKind,
  TBuilder
> & {
  name: string;
  generics: KtGenericParameter<TBuilder>[];
  parameters: KtParameter<TBuilder>[];
  doc: KtDoc<TBuilder> | null;
  returnType: AppendValue<TBuilder>;
  body: AppendValue<TBuilder>;
  accessibility: KtAccessibility;
  annotations: KtAnnotation<TBuilder>[];
  receiverType: KtReference<TBuilder> | AppendValue<TBuilder>;
  receiverAnnotations: KtAnnotation<TBuilder>[];
  singleExpression: boolean;
  open: boolean;
  inline: boolean;
  infix: boolean;
  tailrec: boolean;
  operator: boolean;
  override: boolean;
  abstract: boolean;
  inject: {
    beforeDoc: AppendValue<TBuilder>;
    afterDoc: AppendValue<TBuilder>;
    beforeAnnotations: AppendValue<TBuilder>;
    afterAnnotations: AppendValue<TBuilder>;
    beforeKeywords: AppendValue<TBuilder>;
    afterKeywords: AppendValue<TBuilder>;
    beforeGenerics: AppendValue<TBuilder>;
    afterGenerics: AppendValue<TBuilder>;
    beforeReceiverAnnotations: AppendValue<TBuilder>;
    afterReceiverAnnotations: AppendValue<TBuilder>;
    beforeReceiverType: AppendValue<TBuilder>;
    afterReceiverType: AppendValue<TBuilder>;
    beforeName: AppendValue<TBuilder>;
    afterName: AppendValue<TBuilder>;
    beforeParameters: AppendValue<TBuilder>;
    afterParameters: AppendValue<TBuilder>;
    beforeReturnType: AppendValue<TBuilder>;
    afterReturnType: AppendValue<TBuilder>;
  };
};

export function ktFunction<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<KtFunction<TBuilder>, 'name'>
): KtFunction<TBuilder> {
  const base = ktNode(ktFunctionNodeKind, options);
  return {
    ...base,
    name,
    generics: options?.generics ?? [],
    parameters: options?.parameters ?? [],
    doc: options?.doc ?? null,
    returnType: options?.returnType ?? null,
    body: options?.body ?? null,
    accessibility: options?.accessibility ?? null,
    annotations: options?.annotations ?? [],
    receiverType: options?.receiverType ?? null,
    receiverAnnotations: options?.receiverAnnotations ?? [],
    singleExpression: options?.singleExpression ?? false,
    open: options?.open ?? false,
    inline: options?.inline ?? false,
    infix: options?.infix ?? false,
    tailrec: options?.tailrec ?? false,
    operator: options?.operator ?? false,
    override: options?.override ?? false,
    abstract: options?.abstract ?? false,
    inject: {
      ...base.inject,
      beforeDoc: options?.inject?.beforeDoc ?? null,
      afterDoc: options?.inject?.afterDoc ?? null,
      beforeAnnotations: options?.inject?.beforeAnnotations ?? null,
      afterAnnotations: options?.inject?.afterAnnotations ?? null,
      beforeKeywords: options?.inject?.beforeKeywords ?? null,
      afterKeywords: options?.inject?.afterKeywords ?? null,
      beforeGenerics: options?.inject?.beforeGenerics ?? null,
      afterGenerics: options?.inject?.afterGenerics ?? null,
      beforeReceiverAnnotations: options?.inject?.beforeReceiverAnnotations ?? null,
      afterReceiverAnnotations: options?.inject?.afterReceiverAnnotations ?? null,
      beforeReceiverType: options?.inject?.beforeReceiverType ?? null,
      afterReceiverType: options?.inject?.afterReceiverType ?? null,
      beforeName: options?.inject?.beforeName ?? null,
      afterName: options?.inject?.afterName ?? null,
      beforeParameters: options?.inject?.beforeParameters ?? null,
      afterParameters: options?.inject?.afterParameters ?? null,
      beforeReturnType: options?.inject?.beforeReturnType ?? null,
      afterReturnType: options?.inject?.afterReturnType ?? null,
    },
  };
}

export function isKtFunction<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  node: unknown
): node is KtFunction<TBuilder> {
  return isKtNode(node, ktFunctionNodeKind);
}

export function writeKtFunction<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtFunction<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .append(node.inject.beforeDoc)
      .append((b) => writeKt(b, node.doc))
      .append(node.inject.afterDoc)
      .append(node.inject.beforeAnnotations)
      .append((b) => writeKtAnnotations(b, node.annotations, true))
      .append(node.inject.afterAnnotations)
      .appendIf(!!node.accessibility, node.accessibility, ' ')
      .append(node.inject.beforeKeywords)
      .appendIf(node.inline, 'inline ')
      .appendIf(node.infix, 'infix ')
      .appendIf(node.tailrec, 'tailrec ')
      .appendIf(node.open, 'open ')
      .appendIf(node.override, 'override ')
      .appendIf(node.abstract, 'abstract ')
      .appendIf(node.operator, 'operator ')
      .append(node.inject.afterKeywords)
      .append('fun ')
      .appendIf(
        node.generics.length > 0,
        node.inject.beforeGenerics,
        (b) => writeKtGenericParameters(b, node.generics),
        node.inject.afterGenerics,
        ' '
      )
      .appendIf(
        !!node.receiverType,
        node.inject.beforeReceiverAnnotations,
        (b) => writeKtAnnotations(b, node.receiverAnnotations, false),
        node.inject.afterReceiverAnnotations,
        node.inject.beforeReceiverType,
        (b) => writeKt(b, node.receiverType),
        node.inject.afterReceiverType,
        '.'
      )
      .append(
        node.inject.beforeName,
        node.name,
        node.inject.afterName,
        node.inject.beforeParameters,
        (b) => writeKtParameters(b, node.parameters),
        node.inject.afterParameters
      )
      .appendIf(!!node.returnType, ': ', node.inject.beforeReturnType, node.returnType, node.inject.afterReturnType)
      .if(!node.abstract, (b) =>
        b
          .append(' ')
          .appendIf(node.singleExpression && !!node.body, '= ')
          .parenthesizeIf(!node.singleExpression || !node.body, '{}', node.body, {
            multiline: !!node.body,
            indent: true,
          })
      )
  );
}
