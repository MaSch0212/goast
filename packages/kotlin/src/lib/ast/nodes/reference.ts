import { SourceBuilder, AppendValue, AstNodeOptions } from '@goast/core';

import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';

export const ktReferenceNodeKind = 'reference';

export type KtReference<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<
  typeof ktReferenceNodeKind,
  TBuilder
> & {
  name: string;
  packageName: string | null;
  generics: AppendValue<TBuilder>[];
};

export function ktReference<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  name: string,
  packageName?: string | null,
  options?: AstNodeOptions<KtReference<TBuilder>, 'name' | 'packageName'>
): KtReference<TBuilder> {
  return {
    ...ktNode(ktReferenceNodeKind, options),
    name,
    packageName: packageName ?? null,
    generics: options?.generics ?? [],
  };
}

export function isKtReference<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  value: unknown
): value is KtReference<TBuilder> {
  return isKtNode(value, ktReferenceNodeKind);
}

export function writeKtReference<TBuilder extends KtDefaultBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtReference<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) => {
    b.append(node.name);
    if (node.generics.length > 0) {
      b.parenthesize('<>', (b) => b.forEach(node.generics, (b, g) => b.append(g), { separator: ', ' }));
    }
    if (node.packageName) {
      b.addImport(node.name, node.packageName);
    }
  });
}
