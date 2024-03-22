import { SourceBuilder, AppendValue, AstNodeOptions, notNullish } from '@goast/core';

import { KtFunction } from './function';
import { KtInitBlock } from './init-block';
import { KtProperty } from './property';
import { KtReference } from './reference';
import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';
import { writeKt, writeKtMembers } from '../writable-nodes';

export const ktObjectNodeKind = 'object' as const;

export type KtObject<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<typeof ktObjectNodeKind, TBuilder> & {
  data: boolean;
  name: string | null;
  class: KtReference<TBuilder> | AppendValue<TBuilder>;
  classArguments: AppendValue<TBuilder>[];
  implements: (KtReference<TBuilder> | AppendValue<TBuilder>)[];
  members: (KtInitBlock<TBuilder> | KtProperty<TBuilder> | KtFunction<TBuilder> | AppendValue<TBuilder>)[];
};

export function ktObject<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  options?: AstNodeOptions<KtObject<TBuilder>>
): KtObject<TBuilder> {
  return {
    ...ktNode(ktObjectNodeKind, options),
    data: options?.data ?? false,
    name: options?.name ?? null,
    class: options?.class ?? null,
    classArguments: options?.classArguments ?? [],
    implements: options?.implements ?? [],
    members: options?.members ?? [],
  };
}

export function isKtObject(node: unknown): node is KtObject<never> {
  return isKtNode(node, ktObjectNodeKind);
}

export function writeKtObject<TBuilder extends SourceBuilder>(builder: TBuilder, node: KtObject<TBuilder>): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .appendIf(node.data, 'data ')
      .append('object')
      .appendIf(!!node.name, ' ', node.name)
      .appendIf(!!node.class || node.implements.length > 0, ' : ')
      .appendIf(!!node.class, (b) =>
        writeKt(b, node.class).parenthesize('()', (b) =>
          b.forEach(node.classArguments, (b, a) => writeKt(b, a), { separator: ', ' })
        )
      )
      .appendIf(!!node.class && node.implements.length > 0, ', ')
      .forEach(node.implements, (b, i) => writeKt(b, i), { separator: ', ' })
      .if(node.members.some(notNullish), (b) =>
        b.append(' ').parenthesize('{}', (b) => writeKtMembers(b, node.members), { multiline: true })
      )
      .appendLineIf(!!node.name)
  );
}
