import { AstNode, AstNodeOptions, SourceBuilder, StringBuilder, astNode, isAstNode } from '@goast/core';

import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from '../config';
import { TypeScriptFileBuilder } from '../file-builder';

export const tsLangKey = 'ts';
export type TsDefaultBuilder = TypeScriptFileBuilder;
export type TsNode<TKind extends string, TBuilder extends SourceBuilder = TsDefaultBuilder> = AstNode<
  typeof tsLangKey,
  TKind,
  TBuilder
>;

export type TsAccessibility = 'public' | 'protected' | 'private' | null;
export function tsNode<TKind extends string, TBuilder extends SourceBuilder = TsDefaultBuilder>(
  kind: TKind,
  options?: AstNodeOptions<TsNode<TKind, TBuilder>>,
): TsNode<TKind, TBuilder> {
  return astNode(tsLangKey, kind, options);
}

export function isTsNode<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown,
): value is TsNode<string, TBuilder>;
export function isTsNode<TKind extends string, TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown,
  kind: TKind,
): value is TsNode<TKind, TBuilder>;
export function isTsNode<TKind extends string, TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown,
  kind?: TKind,
): value is TsNode<TKind, TBuilder> {
  return kind === undefined ? isAstNode(value, tsLangKey) : isAstNode(value, tsLangKey, kind);
}

const tsConfigSymbol = Symbol();
export function getTypeScriptBuilderOptions(builder: StringBuilder) {
  if (builder instanceof TypeScriptFileBuilder) {
    return builder.options;
  }
  if (tsConfigSymbol in builder.options) {
    return builder.options[tsConfigSymbol] as TypeScriptGeneratorConfig;
  }
  const options = { ...defaultTypeScriptGeneratorConfig, ...builder.options };
  (builder as any)[tsConfigSymbol] = options;
  return options;
}

export function writeTsNode<TNode extends TsNode<string, TBuilder>, TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TNode,
  build: (builder: TBuilder) => void,
) {
  return builder.append(node.inject.before, build, node.inject.after);
}
