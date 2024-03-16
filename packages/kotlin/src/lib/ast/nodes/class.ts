import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { KtAnnotation, writeKtAnnotations } from './annotation';
import { KtConstructor, writeKtPrimaryConstructor } from './constructor';
import { KtDoc, getFullKtDoc } from './doc';
import { KtFunction } from './function';
import { KtGenericParameter, writeKtGenericParameters } from './generic-parameter';
import { KtInitBlock, ktInitBlock } from './init-block';
import { KtProperty } from './property';
import { KtReference } from './reference';
import { KtDefaultBuilder, KtNode, KtAccessibility, ktNode, isKtNode, writeKtNode } from '../common';
import { writeKt, writeKtMembers } from '../writable-nodes';

export const ktClassNodeKind = 'class' as const;

export type KtClass<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<typeof ktClassNodeKind, TBuilder> & {
  doc: KtDoc<TBuilder> | null;
  annotations: KtAnnotation<TBuilder>[];
  accessibility: KtAccessibility;
  open: boolean;
  abstract: boolean;
  classKind: 'data' | 'value' | 'annotation' | 'sealed' | null;
  name: string;
  generics: KtGenericParameter<TBuilder>[];
  primaryConstructor: KtConstructor<TBuilder> | null;
  baseClass: KtReference<TBuilder> | AppendValue<TBuilder>;
  implementedInterfaces: (KtReference<TBuilder> | AppendValue<TBuilder>)[];
  members: (
    | KtConstructor<TBuilder>
    | KtInitBlock<TBuilder>
    | KtProperty<TBuilder>
    | KtFunction<TBuilder>
    | KtClass<TBuilder>
    | AppendValue<TBuilder>
  )[];
};

export function ktClass<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<KtClass<TBuilder>, 'name'>
): KtClass<TBuilder> {
  return {
    ...ktNode(ktClassNodeKind, options),
    doc: options?.doc ?? null,
    annotations: options?.annotations ?? [],
    accessibility: options?.accessibility ?? null,
    open: options?.open ?? false,
    abstract: options?.abstract ?? false,
    classKind: options?.classKind ?? null,
    name,
    generics: options?.generics ?? [],
    primaryConstructor: options?.primaryConstructor ?? null,
    baseClass: options?.baseClass ?? null,
    implementedInterfaces: options?.implementedInterfaces ?? [],
    members: options?.members ?? [],
  };
}

export function isKtClass<TBuilder extends SourceBuilder = KtDefaultBuilder>(node: unknown): node is KtClass<TBuilder> {
  return isKtNode(node, ktClassNodeKind);
}

export function writeKtClass<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtClass<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .append((b) =>
        writeKt(b, getFullKtDoc(node.doc, { generics: node.generics, parameters: node.primaryConstructor?.parameters }))
      )
      .append((b) => writeKtAnnotations(b, node.annotations, true))
      .appendIf(!!node.accessibility, node.accessibility, ' ')
      .appendIf(node.open, 'open ')
      .appendIf(node.abstract, 'abstract ')
      .appendIf(!!node.classKind, node.classKind, ' ')
      .append('class ', node.name, (b) => writeKtGenericParameters(b, node.generics))
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .appendIf(!!node.primaryConstructor, (b) => writeKtPrimaryConstructor(b, node.primaryConstructor!))
      .appendIf(!!node.baseClass || node.implementedInterfaces.length > 0, ' : ')
      .appendIf(!!node.baseClass, (b) =>
        writeKt(b, node.baseClass).appendIf(node.primaryConstructor?.delegateTarget === 'super', (b) =>
          b.parenthesize('()', (b) =>
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            b.forEach(node.primaryConstructor!.delegateArguments, (b, a) => writeKt(b, a), { separator: ', ' })
          )
        )
      )
      .appendIf(!!node.baseClass && node.implementedInterfaces.length > 0, ', ')
      .forEach(node.implementedInterfaces, (b, i) => writeKt(b, i), { separator: ', ' })
      .if(node.members.length > 0 || !!node.primaryConstructor?.body, (b) =>
        b
          .append(' ')
          .parenthesize(
            '{}',
            (b) =>
              writeKtMembers(b, [
                node.primaryConstructor?.body ? ktInitBlock(node.primaryConstructor?.body) : null,
                ...node.members,
              ]),
            { multiline: true }
          )
      )
      .appendLine()
  );
}
