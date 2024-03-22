/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SourceBuilder, AppendValue, AstNodeOptions } from '@goast/core';

import { KtAnnotation, writeKtAnnotations } from './annotation';
import { KtDoc } from './doc';
import { KtReference } from './reference';
import { KtAccessibility, KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';
import { writeKt } from '../writable-nodes';

export const ktPropertyNodeKind = 'property' as const;
export const ktPropertyAccessorNodeKind = 'property-accessor' as const;

export type KtProperty<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktPropertyNodeKind,
  TBuilder
> & {
  doc: KtDoc<TBuilder> | null;
  name: string;
  type: AppendValue<TBuilder>;
  annotations: KtAnnotation<TBuilder>[];
  accessibility: KtAccessibility;
  getter: KtPropertyAccessor<TBuilder> | null;
  setter: KtPropertyAccessor<TBuilder> | null;
  default: AppendValue<TBuilder>;
  delegate: KtReference<TBuilder> | AppendValue<TBuilder>;
  delegateArguments: AppendValue<TBuilder>[] | null;
  mutable: boolean;
  const: boolean;
  lateinit: boolean;
  open: boolean;
  override: boolean;
  abstract: boolean;
};

export type KtPropertyAccessor<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktPropertyAccessorNodeKind,
  TBuilder
> & {
  accessibility: KtAccessibility;
  annotations: KtAnnotation<TBuilder>[];
  body: AppendValue<TBuilder>;
  singleExpression: boolean;
};

export function ktProperty<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<KtProperty<TBuilder>, 'name'>
): KtProperty<TBuilder> {
  return {
    ...ktNode(ktPropertyNodeKind, options),
    doc: options?.doc ?? null,
    accessibility: options?.accessibility ?? null,
    annotations: options?.annotations ?? [],
    const: options?.const ?? false,
    delegate: options?.delegate ?? null,
    delegateArguments: options?.delegateArguments ?? null,
    getter: options?.getter ?? null,
    default: options?.default ?? null,
    lateinit: options?.lateinit ?? false,
    mutable: options?.mutable ?? false,
    name,
    open: options?.open ?? false,
    override: options?.override ?? false,
    type: options?.type ?? null,
    abstract: options?.abstract ?? false,
    setter: options?.setter ?? null,
  };
}

export function ktPropertyAccessor<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  options?: AstNodeOptions<KtPropertyAccessor<TBuilder>>
): KtPropertyAccessor<TBuilder> {
  return {
    ...ktNode(ktPropertyAccessorNodeKind, options),
    accessibility: options?.accessibility ?? null,
    annotations: options?.annotations ?? [],
    body: options?.body ?? null,
    singleExpression: options?.singleExpression ?? false,
  };
}

export function isKtProperty(node: unknown): node is KtProperty<never> {
  return isKtNode(node, ktPropertyNodeKind);
}

export function isKtPropertyAccessor(node: unknown): node is KtPropertyAccessor<never> {
  return isKtNode(node, ktPropertyAccessorNodeKind);
}

export function writeKtProperty<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtProperty<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .append((b) => writeKt(b, node.doc))
      .append((b) => writeKtAnnotations(b, node.annotations, true))
      .appendIf(!!node.accessibility, node.accessibility, ' ')
      .appendIf(node.const, 'const ')
      .appendIf(node.lateinit, 'lateinit ')
      .appendIf(node.abstract, 'abstract ')
      .appendIf(node.override, 'override ')
      .appendIf(node.open, 'open ')
      .if(node.mutable || !!node.setter, 'var ', 'val ')
      .append(node.name)
      .appendIf(!!node.type || (!node.default && !node.getter?.body), ': ', node.type ? node.type : 'Any?')
      .appendIf(!!node.default, ' = ', node.default)
      .appendIf(
        !!node.delegate,
        ' by ',
        (b) => writeKt(b, node.delegate),
        (b) =>
          b.parenthesizeIf(node.delegateArguments !== null, '()', (b) =>
            b.forEach(node.delegateArguments ?? [], (b, a) => b.append(a), { separator: ', ' })
          )
      )
      .indent((b) =>
        b
          .appendIf(!!node.getter, '\n', (b) => writeKtPropertyAccessor(b, node.getter!, 'get'))
          .appendIf(!!node.setter, '\n', (b) => writeKtPropertyAccessor(b, node.setter!, 'set'))
      )
      .appendLine()
  );
}

export function writeKtPropertyAccessor<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtPropertyAccessor<TBuilder>,
  kind: 'get' | 'set'
): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .append((b) => writeKtAnnotations(b, node.annotations, true))
      .appendIf(!!node.accessibility, node.accessibility, ' ')
      .append(kind)
      .appendIf(!!node.body, (b) =>
        b
          .parenthesize('()', (b) => b.appendIf(kind === 'set', 'value'))
          .if(
            node.singleExpression,
            (b) => b.append(' = ', node.body),
            (b) => b.append(' ').parenthesize('{}', node.body, { multiline: true })
          )
      )
  );
}
