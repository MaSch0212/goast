import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsDecorator, writeTsDecorators } from './decorator';
import { TsDoc } from './doc';
import { TsGenericParameter, writeTsGenericParameters } from './generic-parameter';
import { TsIndexer } from './indexer';
import { TsMethod } from './method';
import { TsProperty } from './property';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';
import { writeTs } from '../writable-nodes';

export const tsInterfaceNodeKind = 'interface' as const;

export type TsInterface<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsInterfaceNodeKind,
  TBuilder
> & {
  name: string;
  doc: TsDoc<TBuilder> | null;
  generics: (TsGenericParameter<TBuilder> | AppendValue<TBuilder>)[];
  extends: AppendValue<TBuilder>[];
  decorators: TsDecorator<TBuilder>[];
  properties: (TsProperty<TBuilder> | AppendValue<TBuilder>)[];
  methods: (TsMethod<TBuilder> | AppendValue<TBuilder>)[];
  indexer: TsIndexer<TBuilder> | null;
  export: boolean;
};

export function tsInterface<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<TsInterface<TBuilder>, 'name'>
): TsInterface<TBuilder> {
  return {
    ...tsNode(tsInterfaceNodeKind, options),
    name,
    doc: options?.doc ?? null,
    decorators: options?.decorators ?? [],
    generics: options?.generics ?? [],
    extends: options?.extends ?? [],
    properties: options?.properties ?? [],
    indexer: options?.indexer ?? null,
    methods: options?.methods ?? [],
    export: options?.export ?? false,
  };
}

export function isTsInterface<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown
): value is TsInterface<TBuilder> {
  return isTsNode(value, tsInterfaceNodeKind);
}

export function writeTsInterface<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsInterface<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    writeTsDecorators(b, node.decorators, true)
      .appendIf(node.export, 'export ')
      .append('interface ')
      .append(node.name, (b) => writeTsGenericParameters(b, node.generics))
      .if(node.extends.length > 0, (b) =>
        b.append(' extends ').forEach(node.extends, (b, e) => b.append(e), { separator: ', ' })
      )
      .append(' ')
      .parenthesize(
        '{}',
        (b) =>
          b
            .forEach(node.properties, (b, p) => writeTs(b, p))
            .appendLineIf(node.properties.length > 0 && node.methods.length > 0)
            .forEach(node.methods, (b, m) => writeTs(b, m), { separator: '\n' }),
        { multiline: node.properties.length > 0 || node.methods.length > 0 }
      )
      .appendLine()
  );
}
