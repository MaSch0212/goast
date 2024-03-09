import { AppendValue, AstNodeOptions, Nullable, SourceBuilder } from '@goast/core';

import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsDecoratorNodeKind = 'decorator' as const;

export type TsDecorator<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsDecoratorNodeKind,
  TBuilder
> & {
  function: AppendValue<TBuilder>;
  parameters: AppendValue<TBuilder>[] | null;
};

export function tsDecorator<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  fn: AppendValue<TBuilder>,
  params?: Nullable<AppendValue<TBuilder>[]>,
  options?: AstNodeOptions<TsDecorator<TBuilder>, 'function' | 'parameters'>
): TsDecorator<TBuilder> {
  return {
    ...tsNode(tsDecoratorNodeKind, options),
    function: fn,
    parameters: params ?? null,
  };
}

export function isTsDecorator<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown
): node is TsDecorator<TBuilder> {
  return isTsNode(node, tsDecoratorNodeKind);
}

export function writeTsDecorators<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  decorators: TsDecorator<TBuilder>[],
  multiline: boolean
): TBuilder {
  return builder.forEach(decorators, (b, d) => writeTsDecorator(b, d).if(multiline, '\n', ' '));
}

export function writeTsDecorator<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsDecorator<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b
      .append('@', node.function)
      .if(!!node.parameters, (b) =>
        b.parenthesize('()', (b) => b.forEach(node.parameters ?? [], (b, p) => b.append(p), { separator: ', ' }))
      )
  );
}
