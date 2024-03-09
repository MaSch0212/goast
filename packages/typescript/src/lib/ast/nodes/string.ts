import { AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDefaultBuilder, TsNode, getTypeScriptBuilderOptions, isTsNode, tsNode } from '../common';

export const tsStringNodeKind = 'string' as const;

export type TsString<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<typeof tsStringNodeKind, TBuilder> & {
  value: string;
  template: boolean;
};

export function tsString<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: string,
  options?: AstNodeOptions<TsString<TBuilder>, 'value'>
): TsString<TBuilder> {
  return {
    ...tsNode(tsStringNodeKind, options),
    value,
    template: options?.template ?? false,
  };
}

export function isTsString<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown
): value is TsString<TBuilder> {
  return isTsNode(value, tsStringNodeKind);
}

export function writeTsString<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsString<TBuilder>
): TBuilder {
  const builderOptions = getTypeScriptBuilderOptions(builder);
  let value = JSON.stringify(node.value);
  if (builderOptions.useSingleQuotes) {
    value = `'${value.slice(1, -1).replace(/'/g, "\\'")}'`;
  } else if (node.template) {
    value = `\`${value.slice(1, -1).replace(/`/g, '\\`')}\``;
  }
  return builder.append(value);
}
