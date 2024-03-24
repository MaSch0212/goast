import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsGenericParameter, writeTsGenericParameters } from './generic-parameter';
import { TsParameter, writeTsParameters } from './parameter';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsArrowFunctionNodeKind = 'arrow-function' as const;

export type TsArrowFunction<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsArrowFunctionNodeKind,
  TBuilder
> & {
  generics: (TsGenericParameter<TBuilder> | AppendValue<TBuilder>)[];
  parameters: (TsParameter<TBuilder> | AppendValue<TBuilder>)[];
  returnType: AppendValue<TBuilder>;
  body: AppendValue<TBuilder>;
};

export function tsArrowFunction<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  options?: AstNodeOptions<TsArrowFunction<TBuilder>>,
): TsArrowFunction<TBuilder> {
  return {
    ...tsNode(tsArrowFunctionNodeKind, options),
    generics: options?.generics ?? [],
    parameters: options?.parameters ?? [],
    returnType: options?.returnType ?? null,
    body: options?.body ?? null,
  };
}

export function isTsArrowFunction<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown,
): node is TsArrowFunction<TBuilder> {
  return isTsNode(node, tsArrowFunctionNodeKind);
}

export function writeTsArrowFunction<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsArrowFunction<TBuilder>,
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b
      .append(
        (b) => writeTsGenericParameters(b, node.generics),
        (b) => writeTsParameters(b, node.parameters),
      )
      .appendIf(!!node.returnType, ': ', node.returnType)
      .append(' => ')
      .parenthesize('{}', node.body, { multiline: !!node.body }),
  );
}
