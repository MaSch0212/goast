import { AstNode, AstNodeOptions, SourceBuilder, astNode, defaultOpenApiGeneratorConfig, isAstNode } from '@goast/core';

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

export function isKtNode(value: unknown): value is KtNode<string, never>;
export function isKtNode<TKind extends string>(value: unknown, kind: TKind): value is KtNode<TKind, never>;
export function isKtNode<TKind extends string>(value: unknown, kind?: TKind): value is KtNode<TKind, never> {
  return kind === undefined ? isAstNode(value, ktLangkey) : isAstNode(value, ktLangkey, kind);
}

const ktConfigSymbol = Symbol();
type _BuilderWithConfig = SourceBuilder & { [ktConfigSymbol]?: KotlinGeneratorConfig };

export function getKotlinBuilderOptions(builder: SourceBuilder) {
  if (builder instanceof KotlinFileBuilder) {
    return builder.options;
  }
  if (ktConfigSymbol in builder.options) {
    return builder.options[ktConfigSymbol] as KotlinGeneratorConfig;
  }
  const options = { ...defaultOpenApiGeneratorConfig, ...defaultKotlinGeneratorConfig, ...builder.options };
  (builder as _BuilderWithConfig)[ktConfigSymbol] = options;
  return options;
}

export function writeKtNode<TNode extends KtNode<string, TBuilder>, TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: TNode,
  build: (builder: TBuilder) => void
) {
  return builder.append(node.inject.before, build, node.inject.after);
}
