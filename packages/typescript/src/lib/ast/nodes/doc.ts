import { AppendValue, AstNodeOptions, SourceBuilder, createOverwriteProxy } from '@goast/core';

import { TsConstructorParameter, isTsConstructorParameter } from './constructor-parameter';
import { TsDocTag, tsDocTag, writeTsDocTag } from './doc-tag';
import { TsGenericParameter, isTsGenericParameter } from './generic-parameter';
import { TsParameter, isTsParameter } from './parameter';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsDocNodeKind = 'doc' as const;

export type TsDoc<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<typeof tsDocNodeKind, TBuilder> & {
  description: AppendValue<TBuilder>;
  tags: TsDocTag<TBuilder>[];
};

export function tsDoc<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  options?: AstNodeOptions<TsDoc<TBuilder>>
): TsDoc<TBuilder> {
  return {
    ...tsNode(tsDocNodeKind, options),
    description: options?.description ?? null,
    tags: options?.tags ?? [],
  };
}

export function isTsDoc<TBuilder extends SourceBuilder = TsDefaultBuilder>(value: unknown): value is TsDoc<TBuilder> {
  return isTsNode(value, tsDocNodeKind);
}

export function writeTsDoc<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsDoc<TBuilder>
): TBuilder {
  return writeTsNode(
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
                    .forEach(node.tags, (b, t) => writeTsDocTag(b, t), { separator: '\n' })
                ),
              { multiline: true, indent: false }
            )
            .appendLine()
  );
}

export function getFullTsDoc<
  TNode extends TsNode<string> & { doc: TsDoc<TBuilder> | null; parameters?: unknown[]; generics?: unknown[] },
  TBuilder extends SourceBuilder = TsDefaultBuilder
>(node: TNode): TsDoc<TBuilder> | null {
  const paramsWithDesc =
    node.parameters
      ?.filter(
        (x): x is TsParameter<TBuilder> | TsConstructorParameter<TBuilder> =>
          isTsParameter(x) || isTsConstructorParameter(x)
      )
      .filter((x) => x.description) ?? [];
  const genericsWithDesc =
    node.generics
      ?.filter((x): x is TsGenericParameter<TBuilder> => isTsGenericParameter(x))
      .filter((x) => x.description) ?? [];
  if (paramsWithDesc.length === 0 && genericsWithDesc.length === 0) {
    return node.doc;
  }
  const doc = node.doc ? createOverwriteProxy(node.doc) : tsDoc<TBuilder>();
  const paramTags = paramsWithDesc.map<TsDocTag<TBuilder>>((p) => tsDocTag('param', p.name, p.description));
  const genericTags = genericsWithDesc.map<TsDocTag<TBuilder>>((p) => tsDocTag('template', p.name, p.description));
  doc.tags.splice(0, 0, ...genericTags, ...paramTags);
  return doc;
}
