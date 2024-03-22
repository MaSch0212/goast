import { AppendValue, AstNodeOptions, SourceBuilder, notNullish } from '@goast/core';

import { KtAnnotation, writeKtAnnotations } from './annotation';
import { KtClass } from './class';
import { KtConstructor, writeKtPrimaryConstructor } from './constructor';
import { KtDoc, getFullKtDoc } from './doc';
import { KtEnumValue, writeKtEnumValues } from './enum-value';
import { KtFunction } from './function';
import { KtInitBlock, ktInitBlock } from './init-block';
import { KtInterface } from './interface';
import { KtObject, writeKtObject } from './object';
import { KtProperty } from './property';
import { KtReference } from './reference';
import { KtAccessibility, KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';
import { writeKt, writeKtMembers } from '../writable-nodes';

export const ktEnumNodeKind = 'enum' as const;

export type KtEnum<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<typeof ktEnumNodeKind, TBuilder> & {
  name: string;
  doc: KtDoc<TBuilder> | null;
  annotations: KtAnnotation<TBuilder>[];
  accessibility: KtAccessibility;
  primaryConstructor: KtConstructor<TBuilder> | null;
  implements: (KtReference<TBuilder> | AppendValue<TBuilder>)[];
  values: KtEnumValue<TBuilder>[];
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

export function ktEnum<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  name: string,
  values?: KtEnumValue<TBuilder>[],
  options?: AstNodeOptions<KtEnum<TBuilder>, 'name' | 'values'>
): KtEnum<TBuilder> {
  return {
    ...ktNode(ktEnumNodeKind, options),
    name,
    doc: options?.doc ?? null,
    annotations: options?.annotations ?? [],
    accessibility: options?.accessibility ?? null,
    primaryConstructor: options?.primaryConstructor ?? null,
    implements: options?.implements ?? [],
    values: values ?? [],
    members: options?.members ?? [],
    companionObject: options?.companionObject ?? null,
  };
}

export function isKtEnum(node: unknown): node is KtEnum<never> {
  return isKtNode(node, ktEnumNodeKind);
}

export function writeKtEnum<TBuilder extends SourceBuilder>(builder: TBuilder, node: KtEnum<TBuilder>): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .append((b) => writeKt(b, getFullKtDoc(node.doc, { parameters: node.primaryConstructor?.parameters })))
      .append((b) => writeKtAnnotations(b, node.annotations, true))
      .appendIf(!!node.accessibility, node.accessibility, ' ')
      .append('enum class ', node.name)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .appendIf(!!node.primaryConstructor, (b) => writeKtPrimaryConstructor(b, node.primaryConstructor!))
      .appendIf(node.implements.length > 0, ' : ')
      .forEach(node.implements, (b, i) => writeKt(b, i), { separator: ', ' })
      .if(
        node.values.length > 0 ||
          node.members.some(notNullish) ||
          !!node.primaryConstructor?.body ||
          !!node.companionObject,
        (b) =>
          b.append(' ').parenthesize(
            '{}',
            (b) =>
              b
                .append((b) => writeKtEnumValues(b, node.values))
                .appendIf(node.members.some(notNullish) || !!node.companionObject, ';', (b) =>
                  b.ensurePreviousLineEmpty()
                )
                .append((b) =>
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
                  ])
                ),
            { multiline: true }
          )
      )
      .appendLine()
  );
}
