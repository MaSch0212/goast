import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDoc } from './doc';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';
import { writeTs } from '../writable-nodes';

export const tsEnumNodeKind = 'enum' as const;
export const tsEnumValueNodeKind = 'enum-value' as const;

export type TsEnum<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<typeof tsEnumNodeKind, TBuilder> & {
  name: string;
  doc: TsDoc<TBuilder> | null;
  members: (TsEnumValue<TBuilder> | AppendValue<TBuilder>)[];
  export: boolean;
  const: boolean;
};
export type TsEnumValue<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsEnumValueNodeKind,
  TBuilder
> & {
  name: string;
  doc: TsDoc<TBuilder> | null;
  value: AppendValue<TBuilder>;
};

export function tsEnumValue<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<TsEnumValue<TBuilder>, 'name'>
): TsEnumValue<TBuilder> {
  return {
    ...tsNode(tsEnumValueNodeKind, options),
    name,
    doc: options?.doc ?? null,
    value: options?.value ?? null,
  };
}

export function tsEnum<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<TsEnum<TBuilder>, 'name'>
): TsEnum<TBuilder> {
  return {
    ...tsNode(tsEnumNodeKind, options),
    name,
    doc: options?.doc ?? null,
    members: options?.members ?? [],
    export: options?.export ?? false,
    const: options?.const ?? false,
  };
}

export function isTsEnumValue<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown
): node is TsEnumValue<TBuilder> {
  return isTsNode(node, tsEnumValueNodeKind);
}

export function isTsEnum<TBuilder extends SourceBuilder = TsDefaultBuilder>(node: unknown): node is TsEnum<TBuilder> {
  return isTsNode(node, tsEnumNodeKind);
}

export function writeTsEnumValue<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsEnumValue<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) => b.append(node.name).appendIf(node.value !== null, ' = ', node.value));
}

export function writeTsEnum<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsEnum<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b
      .appendIf(node.export, 'export ')
      .appendIf(node.const, 'const ')
      .append('enum ', node.name, ' ')
      .parenthesize(
        '{}',
        (b) =>
          b.forEach(node.members, (b, m) => writeTs(b, m), {
            separator: ',\n',
          }),
        { multiline: node.members.length > 0 }
      )
      .appendLine()
  );
}
