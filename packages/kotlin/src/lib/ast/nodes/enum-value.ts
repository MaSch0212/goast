import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { KtAnnotation, writeKtAnnotations } from './annotation';
import { KtDoc } from './doc';
import { KtFunction } from './function';
import { KtParameter } from './parameter';
import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';
import { writeKt, writeKtMembers } from '../writable-nodes';

export const ktEnumValueNodeKind = 'enum-value' as const;

export type KtEnumValue<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktEnumValueNodeKind,
  TBuilder
> & {
  name: string;
  doc: KtDoc<TBuilder> | null;
  annotations: KtAnnotation<TBuilder>[];
  arguments: AppendValue<TBuilder>[];
  members: (KtParameter<TBuilder> | KtFunction<TBuilder> | AppendValue<TBuilder>)[];
};

export function ktEnumValue<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<KtEnumValue<TBuilder>, 'name'>
): KtEnumValue<TBuilder> {
  return {
    ...ktNode(ktEnumValueNodeKind, options),
    name,
    doc: options?.doc ?? null,
    annotations: options?.annotations ?? [],
    arguments: options?.arguments ?? [],
    members: options?.members ?? [],
  };
}

export function isKtEnumValue<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  node: unknown
): node is KtEnumValue<TBuilder> {
  return isKtNode(node, ktEnumValueNodeKind);
}

export function writeKtEnumValue<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  node: KtEnumValue<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .append((b) => writeKt(b, node.doc))
      .append((b) => writeKtAnnotations(b, node.annotations, true))
      .append(node.name)
      .appendIf(node.arguments.length > 0, (b) =>
        b.parenthesize('()', (b) => b.forEach(node.arguments, (b, a) => b.append(a), { separator: ', ' }))
      )
      .appendIf(node.members.length > 0, (b) =>
        b.append(' ').parenthesize('{}', (b) => writeKtMembers(b, node.members), { multiline: true })
      )
  );
}

export function writeKtEnumValues<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  values: KtEnumValue<TBuilder>[]
): TBuilder {
  const spacing = values.some((v) => v.annotations.length > 0 || v.doc || v.members.length > 0);
  const multiline = spacing || values.length > 4 || values.some((v) => v.arguments.length > 0);
  return builder.forEach(
    values,
    (b, v, i) => b.if(spacing && i > 0, (b) => b.ensurePreviousLineEmpty()).append((b) => writeKtEnumValue(b, v)),
    { separator: multiline ? ',\n' : ', ' }
  );
}
