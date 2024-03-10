import { SourceBuilder, AppendValue, AstNodeOptions } from '@goast/core';

import { KtDocTag, writeKtDocTag } from './doc-tag';
import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';

export const ktDocNodeKind = 'doc' as const;

export type KtDoc<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<typeof ktDocNodeKind, TBuilder> & {
  description: AppendValue<TBuilder>;
  tags: KtDocTag<TBuilder>[];
};

export function ktDoc<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  description: AppendValue<TBuilder>,
  tags?: KtDocTag<TBuilder>[] | null,
  options?: AstNodeOptions<KtDoc<TBuilder>, 'description' | 'tags'>
): KtDoc<TBuilder> {
  return {
    ...ktNode(ktDocNodeKind, options),
    description,
    tags: tags ?? [],
  };
}

export function isKtDoc<TBuilder extends SourceBuilder = KtDefaultBuilder>(value: unknown): value is KtDoc<TBuilder> {
  return isKtNode(value, ktDocNodeKind);
}

export function writeKtDoc<TBuilder extends SourceBuilder>(builder: TBuilder, node: KtDoc<TBuilder>): TBuilder {
  return writeKtNode(
    builder,
    node,
    !node.description && node.tags.length === 0
      ? (b) => b
      : (b) =>
          b
            .ensureCurrentLineEmpty()
            .parenthesize(
              ['/**', ' */'],
              (b) =>
                b.appendWithLinePrefix(' * ', (b) =>
                  b
                    .appendIf(!!node.description, node.description)
                    .appendLineIf(!!node.description && node.tags.length > 0, '\n')
                    .forEach(node.tags, (b, t) => writeKtDocTag(b, t), { separator: '\n' })
                ),
              { multiline: true, indent: false }
            )
            .appendLine()
  );
}
