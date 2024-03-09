import { AppendValue, AstNodeOptions, Prettify, SourceBuilder } from '@goast/core';

import { TsDecorator, writeTsDecorators } from './decorator';
import { TsDoc } from './doc';
import { TsDefaultBuilder, TsNode, TsAccessibility, tsNode, isTsNode, writeTsNode } from '../common';

export const tsPropertyMethodNodeKind = 'property-method' as const;
export const tsPropertyNodeKind = 'property' as const;
export const tsPropertySimpleKind = 'simple' as const;
export const tsPropertyGetterSetterKind = 'getterSetter' as const;

export type TsPropertyMethod<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsPropertyMethodNodeKind,
  TBuilder
> & {
  type: AppendValue<TBuilder>;
  decorators: TsDecorator<TBuilder>[];
  body: AppendValue<TBuilder>;
  accessibility: TsAccessibility;
  static: boolean;
  abstract: boolean;
  override: boolean;
};
export type TsProperty<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<
  typeof tsPropertyNodeKind,
  TBuilder
> & {
  name: string;
  doc: TsDoc<TBuilder> | null;
} & (
    | {
        propertyKind: typeof tsPropertySimpleKind;
        type: AppendValue<TBuilder>;
        value: AppendValue<TBuilder>;
        decorators: TsDecorator<TBuilder>[];
        readonly: boolean;
        accessibility: TsAccessibility;
        static: boolean;
        abstract: boolean;
        override: boolean;
        optional: boolean;
      }
    | {
        propertyKind: typeof tsPropertyGetterSetterKind;
        get: TsPropertyMethod<TBuilder> | null;
        set: TsPropertyMethod<TBuilder> | null;
      }
  );

export function tsPropertyMethod<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  options?: AstNodeOptions<TsPropertyMethod<TBuilder>>
): TsPropertyMethod<TBuilder> {
  return {
    ...tsNode(tsPropertyMethodNodeKind, options),
    decorators: options?.decorators ?? [],
    type: options?.type ?? null,
    body: options?.body ?? null,
    accessibility: options?.accessibility ?? null,
    static: options?.static ?? false,
    abstract: options?.abstract ?? false,
    override: options?.override ?? false,
  };
}

type _TsPropertyAutoOpt<TBuilder extends SourceBuilder = TsDefaultBuilder> = AstNodeOptions<
  TsProperty<TBuilder> & { propertyKind: typeof tsPropertySimpleKind },
  'propertyKind'
>;
type _TsPropertyGetSetOpt<TBuilder extends SourceBuilder = TsDefaultBuilder> = AstNodeOptions<
  TsProperty<TBuilder> & { propertyKind: typeof tsPropertyGetterSetterKind },
  'propertyKind'
>;
export function tsProperty<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  name: string,
  options?: Prettify<_TsPropertyAutoOpt<TBuilder>> | Prettify<_TsPropertyGetSetOpt<TBuilder>>
): TsProperty<TBuilder> {
  if (options && ('get' in options || 'set' in options)) {
    return {
      ...tsNode(tsPropertyNodeKind, options),
      name,
      doc: options?.doc ?? null,
      propertyKind: tsPropertyGetterSetterKind,
      get: options.get ?? null,
      set: options.set ?? null,
    };
  } else {
    const o = options as _TsPropertyAutoOpt<TBuilder> | undefined;
    return {
      ...tsNode(tsPropertyNodeKind, options),
      name,
      doc: o?.doc ?? null,
      propertyKind: tsPropertySimpleKind,
      decorators: o?.decorators ?? [],
      type: o?.type ?? null,
      value: o?.value ?? null,
      readonly: o?.readonly ?? false,
      accessibility: o?.accessibility ?? null,
      static: o?.static ?? false,
      abstract: o?.abstract ?? false,
      override: o?.override ?? false,
      optional: o?.optional ?? false,
    };
  }
}

export function isTsPropertyMethod<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown
): node is TsPropertyMethod<TBuilder> {
  return isTsNode(node, tsPropertyMethodNodeKind);
}

export function isTsProperty<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  node: unknown
): node is TsProperty<TBuilder>;
export function isTsProperty<
  TKind extends TsProperty['propertyKind'],
  TBuilder extends SourceBuilder = TsDefaultBuilder
>(node: unknown, propertyKind: TKind): node is TsProperty<TBuilder> & { propertyKind: TKind };
export function isTsProperty<
  TKind extends TsProperty['propertyKind'] = TsProperty['propertyKind'],
  TBuilder extends SourceBuilder = TsDefaultBuilder
>(node: unknown, propertyKind?: TKind): boolean {
  return (
    isTsNode(node, tsPropertyNodeKind) &&
    (propertyKind === undefined || (node as TsProperty<TBuilder>).propertyKind === propertyKind)
  );
}

export function writeTsPropertyMethod<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  kind: 'set' | 'get',
  name: string,
  node: TsPropertyMethod<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    writeTsDecorators(b, node.decorators, true)
      .appendIf(node.accessibility !== null, node.accessibility + ' ')
      .appendIf(node.static, 'static ')
      .appendIf(node.abstract, 'abstract ')
      .appendIf(node.override, 'override ')
      .append(kind, ' ', name)
      .parenthesize('()', (b) =>
        b.if(kind === 'set', (b) => b.append('value').appendIf(node.type !== null, ': ', node.type))
      )
      .appendIf(kind === 'get' && node.type !== null, ': ', node.type)
      .if(
        node.body !== null,
        (b) => b.append(' ').parenthesize('{}', node.body, { multiline: true }),
        (b) => b.append(';')
      )
      .appendLine()
  );
}

export function writeTsProperty<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsProperty<TBuilder>
): TBuilder {
  if ('get' in node) {
    return writeTsNode(builder, node, (b) => {
      if (node.get) {
        writeTsPropertyMethod(b, 'get', node.name, node.get);
      }
      if (node.set) {
        writeTsPropertyMethod(b, 'set', node.name, node.set);
      }
    });
  } else {
    return writeTsNode(builder, node, (b) =>
      writeTsDecorators(b, node.decorators, true)
        .appendIf(!!node.accessibility, node.accessibility + ' ')
        .appendIf(node.static, 'static ')
        .appendIf(node.abstract, 'abstract ')
        .appendIf(node.override, 'override ')
        .appendIf(node.readonly, 'readonly ')
        .append(node.name)
        .appendIf(node.optional, '?')
        .appendIf(!!node.type, ': ', node.type)
        .appendIf(!!node.value, ' = ', node.value)
        .append(';')
        .appendLine()
    );
  }
}
