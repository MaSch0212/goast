import { AppendValue, AstNodeOptions, SourceBuilder, notNullish } from '@goast/core';

import { KtAnnotation, writeKtAnnotations } from './annotation';
import { KtConstructor, writeKtPrimaryConstructor } from './constructor';
import { KtDoc, getFullKtDoc } from './doc';
import { KtEnum } from './enum';
import { KtFunction } from './function';
import { KtGenericParameter, writeKtGenericParameters } from './generic-parameter';
import { KtInitBlock, ktInitBlock } from './init-block';
import { KtInterface } from './interface';
import { KtObject, writeKtObject } from './object';
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
  extends: KtReference<TBuilder> | AppendValue<TBuilder>;
  implements: (KtReference<TBuilder> | AppendValue<TBuilder>)[];
  members: (
    | KtConstructor<TBuilder>
    | KtEnum<TBuilder>
    | KtInitBlock<TBuilder>
    | KtInterface<TBuilder>
    | KtProperty<TBuilder>
    | KtFunction<TBuilder>
    | KtClass<TBuilder>
    | AppendValue<TBuilder>
  )[];
  companionObject: KtObject<TBuilder> | null;
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
    extends: options?.extends ?? null,
    implements: options?.implements ?? [],
    members: options?.members ?? [],
    companionObject: options?.companionObject ?? null,
  };
}

export function isKtClass(node: unknown): node is KtClass<never> {
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
      .appendIf(!!node.extends || node.implements.length > 0, ' : ')
      .appendIf(!!node.extends, (b) =>
        writeKt(b, node.extends).appendIf(node.primaryConstructor?.delegateTarget === 'super', (b) =>
          b.parenthesize('()', (b) =>
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            b.forEach(node.primaryConstructor!.delegateArguments, (b, a) => writeKt(b, a), { separator: ', ' })
          )
        )
      )
      .appendIf(!!node.extends && node.implements.length > 0, ', ')
      .forEach(node.implements, (b, i) => writeKt(b, i), { separator: ', ' })
      .if(node.members.some(notNullish) || !!node.primaryConstructor?.body || !!node.companionObject, (b) =>
        b.append(' ').parenthesize(
          '{}',
          (b) =>
            writeKtMembers(b, [
              node.primaryConstructor?.body ? ktInitBlock(node.primaryConstructor?.body) : null,
              ...node.members,
              node.companionObject
                ? (b) =>
                    b
                      .if(!!node.primaryConstructor?.body || node.members.some(notNullish), (b) =>
                        b.ensurePreviousLineEmpty()
                      )
                      .append('companion ')
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      .append((b) => writeKtObject(b, node.companionObject!))
                : null,
            ]),
          { multiline: true }
        )
      )
      .appendLine()
  );
}
