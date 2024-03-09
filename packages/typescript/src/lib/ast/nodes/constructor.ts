import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsConstructorParameter, writeTsConstructorParameters } from './constructor-parameter';
import { TsDecorator, writeTsDecorators } from './decorator';
import { TsDoc, getFullTsDoc } from './doc';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';
import { writeTs } from '../writable-nodes';

export const tsConstructorNodeKind = 'constructor' as const;

export type TsConstructor<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsConstructorNodeKind,
  TBuilder
> & {
  doc: TsDoc<TBuilder> | null;
  parameters: (TsConstructorParameter<TBuilder> | AppendValue<TBuilder>)[];
  body: AppendValue<TBuilder>;
  decorators: TsDecorator<TBuilder>[];
  inject: {
    beforeParams: AppendValue<TBuilder>;
    afterParams: AppendValue<TBuilder>;
  };
};

export function tsConstructor<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  options?: AstNodeOptions<TsConstructor<TBuilder>>
): TsConstructor<TBuilder> {
  const base = tsNode(tsConstructorNodeKind, options);
  return {
    ...base,
    doc: options?.doc ?? null,
    parameters: options?.parameters ?? [],
    decorators: options?.decorators ?? [],
    body: options?.body ?? null,
    inject: {
      ...base.inject,
      afterParams: options?.inject?.afterParams ?? [],
      beforeParams: options?.inject?.beforeParams ?? [],
    },
  };
}

export function isTsConstructor<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown
): node is TsConstructor<TBuilder> {
  return isTsNode(node, tsConstructorNodeKind);
}

export function writeTsConstructor<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsConstructor<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b
      .append(
        (b) => writeTs(b, getFullTsDoc(node)),
        (b) => writeTsDecorators(b, node.decorators, true),
        'constructor',
        node.inject.beforeParams,
        (b) => writeTsConstructorParameters(b, node.parameters),
        node.inject.afterParams,
        ' '
      )
      .parenthesize('{}', node.body, { multiline: !!node.body })
      .appendLine()
  );
}
