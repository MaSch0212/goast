import { AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsExportNodeKind = 'export' as const;

export type TsExport<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<typeof tsExportNodeKind, TBuilder> & {
  name: string;
  filePath: string;
};

export function tsExport<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  filePath: string,
  options?: AstNodeOptions<TsExport<TBuilder>, 'name' | 'filePath'>
): TsExport<TBuilder> {
  return { ...tsNode(tsExportNodeKind, options), name, filePath };
}

export function isTsExport<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown
): value is TsExport<TBuilder> {
  return isTsNode(value, tsExportNodeKind);
}

export function writeTsExport<TBuilder extends TsDefaultBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsExport<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) => b.addExport(node.name, node.filePath));
}
