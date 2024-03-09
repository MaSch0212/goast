import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { writeTsDecorators } from './decorator';
import { TsParameter } from './parameter';
import { TsDefaultBuilder, TsNode, TsAccessibility, isTsNode, tsNode, writeTsNode } from '../common';
import { writeTs } from '../writable-nodes';

export const tsConstructorParameterNodeKind = 'constructor-parameter' as const;

export type TsConstructorParameter<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsConstructorParameterNodeKind,
  TBuilder
> &
  Omit<TsParameter<TBuilder>, 'kind'> & {
    accessibility: TsAccessibility;
    readonly: boolean;
  };

export function tsConstructorParameter<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<TsConstructorParameter<TBuilder>, 'name'>
): TsConstructorParameter<TBuilder> {
  return {
    ...tsNode(tsConstructorParameterNodeKind, options),
    name,
    description: options?.description ?? null,
    decorators: options?.decorators ?? [],
    type: options?.type ?? null,
    default: options?.default ?? null,
    accessibility: options?.accessibility ?? null,
    readonly: options?.readonly ?? false,
    optional: options?.optional ?? false,
  };
}

export function isTsConstructorParameter<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown
): node is TsConstructorParameter<TBuilder> {
  return isTsNode(node, tsConstructorParameterNodeKind);
}

export function writeTsConstructorParameters<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  parameters: (TsConstructorParameter<TBuilder> | AppendValue<TBuilder>)[]
): TBuilder {
  return builder.parenthesize('()', (b) =>
    b.forEach(parameters, (b, p) => writeTs(b, p), {
      separator: ', ',
    })
  );
}

export function writeTsConstructorParameter<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsConstructorParameter<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    writeTsDecorators(b, node.decorators, false)
      .appendIf(!!node.accessibility, node.accessibility + ' ')
      .appendIf(node.readonly, 'readonly ')
      .append(node.name)
      .appendIf(node.optional, '?')
      .appendIf(!!node.type, ': ', node.type)
      .appendIf(!!node.default, ' = ', node.default)
  );
}
