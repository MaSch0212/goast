import { SourceBuilder, AppendValue, AstNodeOptions, notNullish } from '@goast/core';

import { KtAnnotation, writeKtAnnotations } from './annotation';
import { KtClass } from './class';
import { KtDoc, getFullKtDoc } from './doc';
import { KtEnum } from './enum';
import { KtFunction } from './function';
import { KtGenericParameter, writeKtGenericParameters } from './generic-parameter';
import { KtObject, writeKtObject } from './object';
import { KtProperty } from './property';
import { KtDefaultBuilder, KtNode, KtAccessibility, ktNode, isKtNode, writeKtNode } from '../common';
import { writeKt, writeKtMembers } from '../writable-nodes';

export const ktInterfaceNodeKind = 'interface' as const;

export type KtInterface<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktInterfaceNodeKind,
  TBuilder
> & {
  doc: KtDoc<TBuilder> | null;
  annotations: KtAnnotation<TBuilder>[];
  accessibility: KtAccessibility;
  name: string;
  generics: KtGenericParameter<TBuilder>[];
  extends: AppendValue<TBuilder>[];
  members: (
    | KtEnum<TBuilder>
    | KtInterface<TBuilder>
    | KtProperty<TBuilder>
    | KtFunction<TBuilder>
    | KtClass<TBuilder>
    | AppendValue<TBuilder>
  )[];
  companionObject: KtObject<TBuilder> | null;
};

export function ktInterface<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<KtInterface<TBuilder>, 'name'>
): KtInterface<TBuilder> {
  return {
    ...ktNode(ktInterfaceNodeKind, options),
    doc: options?.doc ?? null,
    annotations: options?.annotations ?? [],
    accessibility: options?.accessibility ?? null,
    name,
    generics: options?.generics ?? [],
    extends: options?.extends ?? [],
    members: options?.members ?? [],
    companionObject: options?.companionObject ?? null,
  };
}

export function isKtInterface<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  node: unknown
): node is KtInterface<TBuilder> {
  return isKtNode(node, ktInterfaceNodeKind);
}

export function writeKtInterface<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtInterface<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .append((b) => writeKt(b, getFullKtDoc(node.doc, { generics: node.generics })))
      .append((b) => writeKtAnnotations(b, node.annotations, true))
      .appendIf(!!node.accessibility, node.accessibility, ' ')
      .append('interface ', node.name, (b) => writeKtGenericParameters(b, node.generics))
      .appendIf(node.extends.length > 0, ' : ')
      .forEach(node.extends, (b, i) => writeKt(b, i), { separator: ', ' })
      .if(node.members.some(notNullish) || !!node.companionObject, (b) =>
        b.append(' ').parenthesize(
          '{}',
          (b) =>
            writeKtMembers(b, [
              ...node.members,
              node.companionObject
                ? (b) =>
                    b
                      .if(node.members.some(notNullish), (b) => b.ensurePreviousLineEmpty())
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
