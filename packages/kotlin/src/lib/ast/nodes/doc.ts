import { SourceBuilder, AppendValue, AstNodeOptions, createOverwriteProxy } from '@goast/core';

import { KtDocTag, ktDocTag, writeKtDocTag } from './doc-tag';
import { KtGenericParameter } from './generic-parameter';
import { KtParameter } from './parameter';
import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';

export const ktDocNodeKind = 'doc' as const;

export type KtDoc<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<typeof ktDocNodeKind, TBuilder> & {
  description: AppendValue<TBuilder>;
  tags: KtDocTag<TBuilder>[];
};

export function ktDoc<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  description?: AppendValue<TBuilder>,
  tags?: KtDocTag<TBuilder>[] | null,
  options?: AstNodeOptions<KtDoc<TBuilder>, 'description' | 'tags'>
): KtDoc<TBuilder> {
  return {
    ...ktNode(ktDocNodeKind, options),
    description,
    tags: tags ?? [],
  };
}

export function isKtDoc(value: unknown): value is KtDoc<never> {
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

export function getFullKtDoc<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  baseDoc: KtDoc<TBuilder> | null,
  options: {
    parameters?: KtParameter<TBuilder>[];
    generics?: KtGenericParameter<TBuilder>[];
  }
): KtDoc<TBuilder> | null {
  const paramsWithDesc = options.parameters?.filter((x) => x.description) ?? [];
  const classParamsWithPropertyDesc = options.parameters?.filter((x) => x.property && x.propertyDescription) ?? [];
  const genericsWithDesc = options.generics?.filter((x) => x.description) ?? [];
  if (
    baseDoc === null &&
    paramsWithDesc.length === 0 &&
    genericsWithDesc.length === 0 &&
    classParamsWithPropertyDesc.length === 0
  ) {
    return null;
  }

  const doc = baseDoc ? createOverwriteProxy(baseDoc) : ktDoc<TBuilder>();
  const paramTags = paramsWithDesc.map<KtDocTag<TBuilder>>((p) => ktDocTag('param', p.name, p.description));
  const propertyTags = classParamsWithPropertyDesc.map<KtDocTag<TBuilder>>((p) =>
    ktDocTag('property', p.name, p.propertyDescription)
  );
  const genericTags = genericsWithDesc.map<KtDocTag<TBuilder>>((p) => ktDocTag('param', p.name, p.description));
  doc.tags.splice(0, 0, ...genericTags, ...paramTags, ...propertyTags);
  return doc;
}
