import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDecorator, writeTsDecorators } from './decorator';
import { TsDoc, getFullTsDoc } from './doc';
import { TsGenericParameter, writeTsGenericParameters } from './generic-parameter';
import { TsParameter, writeTsParameters } from './parameter';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';
import { writeTs } from '../writable-nodes';

export const tsFunctionNodeKind = 'function' as const;

export type TsFunction<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsFunctionNodeKind,
  TBuilder
> & {
  name: string;
  doc: TsDoc<TBuilder> | null;
  generics: (TsGenericParameter<TBuilder> | AppendValue<TBuilder>)[];
  parameters: (TsParameter<TBuilder> | AppendValue<TBuilder>)[];
  decorators: TsDecorator<TBuilder>[];
  returnType: AppendValue<TBuilder>;
  body: AppendValue<TBuilder>;
  export: boolean;
};

export function tsFunction<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<TsFunction<TBuilder>, 'name'>
): TsFunction<TBuilder> {
  return {
    ...tsNode('function', options),
    name,
    doc: options?.doc ?? null,
    decorators: options?.decorators ?? [],
    generics: options?.generics ?? [],
    parameters: options?.parameters ?? [],
    returnType: options?.returnType ?? null,
    body: options?.body ?? null,
    export: options?.export ?? false,
  };
}

export function isTsFunction<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown
): node is TsFunction<TBuilder> {
  return isTsNode(node, tsFunctionNodeKind);
}

export function writeTsFunction<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsFunction<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b
      .append(
        (b) => writeTs(b, getFullTsDoc(node)),
        (b) => writeTsDecorators(b, node.decorators, true)
      )
      .appendIf(node.export, 'export ')
      .append(
        'function ',
        node.name,
        (b) => writeTsGenericParameters(b, node.generics),
        (b) => writeTsParameters(b, node.parameters)
      )
      .appendIf(!!node.returnType, ': ', node.returnType)
      .append(' ')
      .parenthesize('{}', node.body, { multiline: !!node.body })
      .appendLine()
  );
}
