import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsReferenceNodeKind = 'reference' as const;

export type TsReference<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsReferenceNodeKind,
  TBuilder
> & {
  name: string;
  moduleNameOrfilePath: string | null;
  generics: AppendValue<TBuilder>[];
};

export function tsReference<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  moduleNameOrfilePath?: string | null,
  options?: AstNodeOptions<TsReference<TBuilder>, 'name' | 'moduleNameOrfilePath'>
): TsReference<TBuilder> {
  return {
    ...tsNode(tsReferenceNodeKind, options),
    name,
    moduleNameOrfilePath: moduleNameOrfilePath ?? null,
    generics: options?.generics ?? [],
  };
}

export function isTsReference<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown
): value is TsReference<TBuilder> {
  return isTsNode(value, tsReferenceNodeKind);
}

export function writeTsReference<TBuilder extends TsDefaultBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsReference<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) => {
    b.append(node.name);
    if (node.generics.length > 0) {
      b.parenthesize('<>', (b) => b.forEach(node.generics, (b, g) => b.append(g), { separator: ', ' }));
    }
    if (node.moduleNameOrfilePath) {
      b.addImport(node.name, node.moduleNameOrfilePath);
    }
  });
}
