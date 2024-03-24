import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDecorator, writeTsDecorators } from './decorator';
import { TsDoc } from './doc';
import { TsGenericParameter, writeTsGenericParameters } from './generic-parameter';
import { TsParameter, writeTsParameters } from './parameter';
import { TsAccessibility, TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsMethodNodeKind = 'method' as const;

export type TsMethod<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<typeof tsMethodNodeKind, TBuilder> & {
  name: string;
  doc: TsDoc<TBuilder> | null;
  generics: (TsGenericParameter<TBuilder> | AppendValue<TBuilder>)[];
  parameters: (TsParameter<TBuilder> | AppendValue<TBuilder>)[];
  returnType: AppendValue<TBuilder>;
  decorators: TsDecorator<TBuilder>[];
  body: AppendValue<TBuilder>;
  accessibility: TsAccessibility;
  static: boolean;
  abstract: boolean;
  override: boolean;
  optional: boolean;
};

export function tsMethod<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<TsMethod<TBuilder>, 'name'>,
): TsMethod<TBuilder> {
  return {
    ...tsNode(tsMethodNodeKind, options),
    name,
    doc: options?.doc ?? null,
    generics: options?.generics ?? [],
    decorators: options?.decorators ?? [],
    parameters: options?.parameters ?? [],
    returnType: options?.returnType ?? null,
    body: options?.body ?? null,
    accessibility: options?.accessibility ?? null,
    static: options?.static ?? false,
    abstract: options?.abstract ?? false,
    override: options?.override ?? false,
    optional: options?.optional ?? false,
  };
}

export function isTsMethod<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown,
): node is TsMethod<TBuilder> {
  return isTsNode(node, tsMethodNodeKind);
}

export function writeTsMethod<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsMethod<TBuilder>,
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    writeTsDecorators(b, node.decorators, true)
      .appendIf(!!node.accessibility, node.accessibility + ' ')
      .appendIf(node.static, 'static ')
      .appendIf(node.abstract, 'abstract ')
      .appendIf(node.override, 'override ')
      .append(node.name)
      .appendIf(node.optional, '?')
      .append(
        (b) => writeTsGenericParameters(b, node.generics),
        (b) => writeTsParameters(b, node.parameters),
      )
      .appendIf(!!node.returnType, ': ', node.returnType)
      .if(
        !!node.body,
        (b) => b.append(' ').parenthesize('{}', node.body, { multiline: true }),
        (b) => b.append(';'),
      )
      .appendLine(),
  );
}
