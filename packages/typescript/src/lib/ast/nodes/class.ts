import { AppendValue, AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsConstructor } from './constructor';
import { TsDecorator, writeTsDecorators } from './decorator';
import { TsDoc, getFullTsDoc } from './doc';
import { TsGenericParameter, writeTsGenericParameters } from './generic-parameter';
import { TsIndexer } from './indexer';
import { TsMethod } from './method';
import { TsProperty } from './property';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';
import { writeTs } from '../writable-nodes';

export const tsClassNodeKind = 'class' as const;

export type TsClass<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<typeof tsClassNodeKind, TBuilder> & {
  name: string;
  doc: TsDoc<TBuilder> | null;
  decorators: TsDecorator<TBuilder>[];
  generics: (TsGenericParameter<TBuilder> | AppendValue<TBuilder>)[];
  extends: AppendValue<TBuilder>;
  implements: AppendValue<TBuilder>[];
  properties: (TsProperty<TBuilder> | AppendValue<TBuilder>)[];
  methods: (TsMethod<TBuilder> | AppendValue<TBuilder>)[];
  indexer: TsIndexer<TBuilder> | null;
  ctor: TsConstructor<TBuilder> | AppendValue<TBuilder>;
  export: boolean;
  abstract: boolean;
};

export function tsClass<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  options?: AstNodeOptions<TsClass<TBuilder>, 'name'>
): TsClass<TBuilder> {
  return {
    ...tsNode(tsClassNodeKind, options),
    name,
    doc: options?.doc ?? null,
    decorators: options?.decorators ?? [],
    generics: options?.generics ?? [],
    extends: options?.extends ?? null,
    implements: options?.implements ?? [],
    properties: options?.properties ?? [],
    methods: options?.methods ?? [],
    indexer: options?.indexer ?? null,
    ctor: options?.ctor ?? null,
    export: options?.export ?? false,
    abstract: options?.abstract ?? false,
  };
}

export function isTsClass<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown
): value is TsClass<TBuilder> {
  return isTsNode(value, tsClassNodeKind);
}

export function writeTsClass<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsClass<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b
      .append((b) => writeTs(b, getFullTsDoc(node)))
      .append((b) => writeTsDecorators(b, node.decorators, true))
      .appendIf(node.export, 'export ')
      .appendIf(node.abstract, 'abstract ')
      .append('class ', node.name, (b) => writeTsGenericParameters(b, node.generics))
      .appendIf(!!node.extends, ' extends ', node.extends)
      .if(node.implements.length > 0, (b) =>
        b.append(' implements ').forEach(node.implements, (b, i) => b.append(i), { separator: ', ' })
      )
      .append(' ')
      .parenthesize(
        '{}',
        (b) =>
          b
            .forEach(node.properties, (b, p) => writeTs(b, p))
            .appendLineIf(node.properties.length > 0 && !!node.ctor)
            .append((b) => writeTs(b, node.ctor))
            .appendLineIf((!!node.ctor || node.properties.length > 0) && node.methods.length > 0)
            .forEach(node.methods, (b, m) => writeTs(b, m), { separator: '\n' }),
        { multiline: node.properties.length > 0 || !!node.ctor || node.methods.length > 0 }
      )
      .appendLine()
  );
}
