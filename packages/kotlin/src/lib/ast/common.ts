import { AstNode, AstNodeOptions, SourceBuilder, astNode, isAstNode } from '@goast/core';

import { KotlinGeneratorConfig, defaultKotlinGeneratorConfig } from '../config';
import { KotlinFileBuilder } from '../file-builder';

export const ktLangkey = 'kt';
export type KtDefaultBuilder = KotlinFileBuilder;
export type KtNode<TKind extends string, TBuilder extends SourceBuilder = KtDefaultBuilder> = AstNode<
  typeof ktLangkey,
  TKind,
  TBuilder
>;

export type KtAccessibility = 'public' | 'protected' | 'internal' | 'private' | null;
export function ktNode<TKind extends string, TBuilder extends SourceBuilder = KtDefaultBuilder>(
  kind: TKind,
  options?: AstNodeOptions<KtNode<TKind, TBuilder>>
): KtNode<TKind, TBuilder> {
  return astNode(ktLangkey, kind, options);
}

export function isKtNode<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  value: unknown
): value is KtNode<string, TBuilder>;
export function isKtNode<TKind extends string, TBuilder extends SourceBuilder = KtDefaultBuilder>(
  value: unknown,
  kind: TKind
): value is KtNode<TKind, TBuilder>;
export function isKtNode<TKind extends string, TBuilder extends SourceBuilder = KtDefaultBuilder>(
  value: unknown,
  kind?: TKind
): value is KtNode<TKind, TBuilder> {
  return kind === undefined ? isAstNode(value, ktLangkey) : isAstNode(value, ktLangkey, kind);
}

const ktConfigSymbol = Symbol();
export function getKotlinBuilderOptions(builder: SourceBuilder) {
  if (builder instanceof KotlinFileBuilder) {
    return builder.options;
  }
  if (ktConfigSymbol in builder.options) {
    return builder.options[ktConfigSymbol] as KotlinGeneratorConfig;
  }
  const options = { ...defaultKotlinGeneratorConfig, ...builder.options };
  (builder as any)[ktConfigSymbol] = options;
  return options;
}

export function writeKtNode<TNode extends KtNode<string, TBuilder>, TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: TNode,
  build: (builder: TBuilder) => void
) {
  return builder.append(node.inject.before, build, node.inject.after);
}
