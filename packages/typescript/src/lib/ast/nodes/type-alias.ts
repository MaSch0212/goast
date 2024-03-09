import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDoc } from './doc';
import { TsGenericParameter, writeTsGenericParameters } from './generic-parameter';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsTypeAliasNodeKind = 'type-alias' as const;

export type TsTypeAlias<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsTypeAliasNodeKind,
  TBuilder
> & {
  name: string;
  doc: TsDoc<TBuilder> | null;
  generics: (TsGenericParameter<TBuilder> | AppendValue<TBuilder>)[];
  type: AppendValue<TBuilder>;
  export: boolean;
};

export function tsTypeAlias<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  options: AstNodeOptions<TsTypeAlias<TBuilder>, 'name', 'type'>
): TsTypeAlias<TBuilder> {
  return {
    ...tsNode(tsTypeAliasNodeKind, options),
    name,
    doc: options.doc ?? null,
    generics: options.generics ?? [],
    type: options.type,
    export: options.export ?? false,
  };
}

export function isTsTypeAlias<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown
): node is TsTypeAlias<TBuilder> {
  return isTsNode(node, tsTypeAliasNodeKind);
}

export function writeTsTypeAlias<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsTypeAlias<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.export, 'export ')
      .append('type ', node.name, (b) => writeTsGenericParameters(b, node.generics), ' = ', node.type, ';')
      .appendLine()
  );
}
