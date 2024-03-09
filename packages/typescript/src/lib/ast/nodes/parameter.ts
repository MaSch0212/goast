import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDecorator, writeTsDecorators } from './decorator';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';
import { writeTs } from '../writable-nodes';

export const tsParameterNodeKind = 'parameter' as const;

export type TsParameter<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsParameterNodeKind,
  TBuilder
> & {
  name: string;
  description: AppendValue<TBuilder>;
  decorators: TsDecorator<TBuilder>[];
  type: AppendValue<TBuilder>;
  optional: boolean;
  default: AppendValue<TBuilder>;
};

export function tsParameter<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<TsParameter<TBuilder>, 'name'>
): TsParameter<TBuilder> {
  return {
    ...tsNode(tsParameterNodeKind, options),
    name,
    description: options?.description ?? null,
    decorators: options?.decorators ?? [],
    type: options?.type ?? null,
    default: options?.default ?? null,
    optional: options?.optional ?? false,
  };
}

export function isTsParameter<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown
): node is TsParameter<TBuilder> {
  return isTsNode(node, tsParameterNodeKind);
}

export function writeTsParameters<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  parameters: (TsParameter<TBuilder> | AppendValue<TBuilder>)[]
): TBuilder {
  return builder.parenthesize('()', (b) => b.forEach(parameters, (b, p) => writeTs(b, p), { separator: ', ' }));
}

export function writeTsParameter<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsParameter<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    writeTsDecorators(b, node.decorators, false)
      .append(node.name)
      .appendIf(node.optional, '?')
      .appendIf(!!node.type, ': ', node.type)
      .appendIf(!!node.default, ' = ', node.default)
  );
}
