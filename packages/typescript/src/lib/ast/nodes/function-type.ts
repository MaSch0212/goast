import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsGenericParameter, writeTsGenericParameters } from './generic-parameter';
import { TsParameter, writeTsParameters } from './parameter';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsFunctionTypeNodeKind = 'function-type' as const;

export type TsFunctionType<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsFunctionTypeNodeKind,
  TBuilder
> & {
  generics: (TsGenericParameter<TBuilder> | AppendValue<TBuilder>)[];
  parameters: (TsParameter<TBuilder> | AppendValue<TBuilder>)[];
  returnType: AppendValue<TBuilder>;
};

export function tsFunctionType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  options: AstNodeOptions<TsFunctionType<TBuilder>, never, 'returnType'>
): TsFunctionType<TBuilder> {
  return {
    ...tsNode(tsFunctionTypeNodeKind, options),
    generics: options.generics ?? [],
    parameters: options.parameters ?? [],
    returnType: options.returnType,
  };
}

export function isTsFunctionType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown
): node is TsFunctionType<TBuilder> {
  return isTsNode(node, tsFunctionTypeNodeKind);
}

export function writeTsFunctionType<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsFunctionType<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b.parenthesize('()', (b) =>
      b
        .append(
          (b) => writeTsGenericParameters(b, node.generics),
          (b) => writeTsParameters(b, node.parameters)
        )
        .append(' => ', node.returnType)
    )
  );
}
