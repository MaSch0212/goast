import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';
import { writeTs } from '../writable-nodes';

export const tsGenericParameterNodeKind = 'generic-parameter' as const;

export type TsGenericParameter<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsGenericParameterNodeKind,
  TBuilder
> & {
  name: string;
  description: AppendValue<TBuilder>;
  constraint: AppendValue<TBuilder>;
  default: AppendValue<TBuilder>;
  const: boolean;
};

export function tsGenericParameter<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<TsGenericParameter<TBuilder>, 'name'>,
): TsGenericParameter<TBuilder> {
  return {
    ...tsNode(tsGenericParameterNodeKind, options),
    name,
    description: options?.description ?? null,
    constraint: options?.constraint ?? null,
    default: options?.default ?? null,
    const: options?.const ?? false,
  };
}

export function isTsGenericParameter<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown,
): node is TsGenericParameter<TBuilder> {
  return isTsNode(node, tsGenericParameterNodeKind);
}

export function writeTsGenericParameters<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  parameters: (TsGenericParameter<TBuilder> | AppendValue<TBuilder>)[],
): TBuilder {
  if (parameters.length === 0) return builder;
  return builder.parenthesize('<>', (b) =>
    b.forEach(parameters, (b, p) => writeTs(b, p), {
      separator: ', ',
    }),
  );
}

export function writeTsGenericParameter<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsGenericParameter<TBuilder>,
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.const, 'const ')
      .append(node.name)
      .appendIf(node.constraint !== null, ' extends ', node.constraint)
      .appendIf(node.default !== null, ' = ', node.default),
  );
}
