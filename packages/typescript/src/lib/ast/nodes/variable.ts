import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDoc } from './doc';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsVariableNodeKind = 'variable' as const;

export type TsVariable<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<typeof tsVariableNodeKind> & {
  name: string;
  doc: TsDoc<TBuilder> | null;
  type: AppendValue<TBuilder>;
  value: AppendValue<TBuilder>;
  export: boolean;
  readonly: boolean;
};

export function tsVariable<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<TsVariable<TBuilder>, 'name'>
): TsVariable<TBuilder> {
  return {
    ...tsNode('variable', options),
    name,
    doc: options?.doc ?? null,
    type: options?.type ?? null,
    value: options?.value ?? null,
    export: options?.export ?? false,
    readonly: options?.readonly ?? false,
  };
}

export function isTsVariable<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown
): node is TsVariable<TBuilder> {
  return isTsNode(node, tsVariableNodeKind);
}

export function writeTsVariable<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsVariable<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.export, 'export ')
      .append(node.readonly ? 'const ' : 'let ', node.name)
      .appendIf(!!node.type, ': ', node.type)
      .appendIf(!!node.value, ' = ', node.value)
      .appendLine(';')
  );
}
