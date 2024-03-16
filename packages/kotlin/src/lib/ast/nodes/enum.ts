import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { KtAnnotation, writeKtAnnotations } from './annotation';
import { KtClass } from './class';
import { KtConstructor, writeKtPrimaryConstructor } from './constructor';
import { KtDoc, getFullKtDoc } from './doc';
import { KtEnumValue, writeKtEnumValues } from './enum-value';
import { KtFunction } from './function';
import { KtInitBlock, ktInitBlock } from './init-block';
import { KtProperty } from './property';
import { KtAccessibility, KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';
import { writeKt, writeKtMembers } from '../writable-nodes';

export const ktEnumNodeKind = 'enum' as const;

export type KtEnum<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<typeof ktEnumNodeKind, TBuilder> & {
  name: string;
  doc: KtDoc<TBuilder> | null;
  annotations: KtAnnotation<TBuilder>[];
  accessibility: KtAccessibility;
  primaryConstructor: KtConstructor<TBuilder> | null;
  values: KtEnumValue<TBuilder>[];
  members: (
    | KtConstructor<TBuilder>
    | KtEnum<TBuilder>
    | KtInitBlock<TBuilder>
    | KtProperty<TBuilder>
    | KtFunction<TBuilder>
    | KtClass<TBuilder>
    | AppendValue<TBuilder>
  )[];
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
    values: values ?? [],
    members: options?.members ?? [],
  };
}

export function isKtEnum<TBuilder extends SourceBuilder = KtDefaultBuilder>(node: unknown): node is KtEnum<TBuilder> {
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
      .if(node.values.length > 0 || node.members.length > 0 || !!node.primaryConstructor?.body, (b) =>
        b.append(' ').parenthesize(
          '{}',
          (b) =>
            b
              .append((b) => writeKtEnumValues(b, node.values))
              .appendIf(node.members.length > 0, ';', (b) => b.ensurePreviousLineEmpty())
              .append((b) =>
                writeKtMembers(b, [
                  node.primaryConstructor?.body ? ktInitBlock(node.primaryConstructor?.body) : null,
                  ...node.members,
                ])
              ),
          { multiline: true }
        )
      )
      .appendLine()
  );
}
