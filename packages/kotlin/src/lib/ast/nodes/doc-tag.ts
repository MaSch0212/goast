import {
  SourceBuilder,
  AppendValue,
  AstNodeOptions,
  StringSuggestions,
  ParametersWithOverloads,
  appendValueGroup,
} from '@goast/core';

import { KtDefaultBuilder, KtNode, isKtNode, ktNode, writeKtNode } from '../common';

export const ktDocTagNodeKind = 'doc-tag' as const;

export type KtDocTag<TBuilder extends SourceBuilder = KtDefaultBuilder> = KtNode<typeof ktDocTagNodeKind, TBuilder> & {
  tag: string;
  args: AppendValue<TBuilder>[];
  description: AppendValue<TBuilder>;
};

type _KtDocTagOpt<TBuilder extends SourceBuilder> = AstNodeOptions<KtDocTag<TBuilder>, 'tag' | 'args'>;

type _KtDocTagArgsMap<TBuilder extends SourceBuilder> = {
  suppress(options?: _KtDocTagOpt<TBuilder>): never;
} & {
  [K in 'return' | 'constructor' | 'receiver' | 'author' | 'since']: (
    description: AppendValue<TBuilder>,
    options?: _KtDocTagOpt<TBuilder>
  ) => never;
} & {
  [K in 'param' | 'property']: (
    name: string,
    description: AppendValue<TBuilder>,
    options?: _KtDocTagOpt<TBuilder>
  ) => never;
} & {
  [K in 'see' | 'sample']: (identifier: string, options?: _KtDocTagOpt<TBuilder>) => never;
} & {
  [K in 'throws' | 'exception']: (
    $class: AppendValue<TBuilder>,
    description: AppendValue<TBuilder>,
    options?: _KtDocTagOpt<TBuilder>
  ) => never;
};

const tagsWithDescription = [
  'return',
  'constructor',
  'receiver',
  'author',
  'since',
  'param',
  'property',
  'throws',
  'exception',
];

type _KtDocTagArgs<
  TTagName extends StringSuggestions<keyof _KtDocTagArgsMap<TBuilder>>,
  TBuilder extends SourceBuilder
> = TTagName extends keyof _KtDocTagArgsMap<TBuilder>
  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _KtDocTagArgsMap<TBuilder>[TTagName] extends (...args: any[]) => any
    ? ParametersWithOverloads<_KtDocTagArgsMap<TBuilder>[TTagName]>
    : never
  : [options?: _KtDocTagOpt<TBuilder>];

export function ktDocTag<
  TTagName extends StringSuggestions<keyof _KtDocTagArgsMap<TBuilder>>,
  TBuilder extends SourceBuilder = KtDefaultBuilder
>(tag: TTagName, ...args: _KtDocTagArgs<TTagName, TBuilder>): KtDocTag<TBuilder>;
export function ktDocTag<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  tag: string,
  ...args: unknown[]
): KtDocTag<TBuilder> {
  let opt: _KtDocTagOpt<TBuilder> = {};
  if (args.length > 0) {
    const lastArg = args[args.length - 1];
    if (typeof lastArg === 'object' && lastArg !== null && !('kind' in lastArg)) {
      opt = args.pop() as _KtDocTagOpt<TBuilder>;
    }
  }

  const params = args as AppendValue<TBuilder>[];
  if (tagsWithDescription.includes(tag)) {
    const description = params.pop();
    if (opt.description && description) {
      opt.description = appendValueGroup<TBuilder>([description, opt.description], '\n');
    } else if (description) {
      opt.description = description;
    }
  }

  return {
    ...ktNode(ktDocTagNodeKind, opt),
    tag,
    args: params,
    description: opt.description ?? null,
  };
}

export function isKtDocTag<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  node: unknown
): node is KtDocTag<TBuilder> {
  return isKtNode(node, ktDocTagNodeKind);
}

export function writeKtDocTag<TBuilder extends SourceBuilder = KtDefaultBuilder>(
  builder: TBuilder,
  node: KtDocTag<TBuilder>
): TBuilder {
  return writeKtNode(builder, node, (b) =>
    b
      .append('@', node.tag)
      .forEach(node.args, (b, a) => b.append(' ', a))
      .appendIf(!!node.description, ' ', node.description)
  );
}
