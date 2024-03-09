import {
  AppendValue,
  AstNodeOptions,
  ParametersWithOverloads,
  SourceBuilder,
  StringSuggestions,
  appendValueGroup,
} from '@goast/core';

import { isTypeScriptAppendValue } from '../../file-builder';
import { TsDefaultBuilder, TsNode, isTsNode, tsNode, writeTsNode } from '../common';

export const tsDocTagNodeKind = 'doc-tag' as const;

export type TsDocTag<TBuilder extends SourceBuilder = TsDefaultBuilder> = TsNode<typeof tsDocTagNodeKind, TBuilder> & {
  tag: string;
  type: AppendValue<TBuilder>;
  text: AppendValue<TBuilder>;
};

type _TsDocTagOpt<TBuilder extends SourceBuilder> = AstNodeOptions<TsDocTag<TBuilder>, 'tag'>;

type _TsDocTagArgsMap<TBuilder extends SourceBuilder> = {
  access(
    access: StringSuggestions<'package' | 'private' | 'protected' | 'public'>,
    options?: _TsDocTagOpt<TBuilder>
  ): never;
  author(authorName: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
  author(
    authorName: AppendValue<TBuilder>,
    emailAddress: AppendValue<TBuilder>,
    options?: _TsDocTagOpt<TBuilder>
  ): never;
  borrows(
    thatNamepath: AppendValue<TBuilder>,
    thisNamepath: AppendValue<TBuilder>,
    options?: _TsDocTagOpt<TBuilder>
  ): never;
  params(
    paramName: AppendValue<TBuilder>,
    paramDescription: AppendValue<TBuilder>,
    options?: _TsDocTagOpt<TBuilder>
  ): never;
  example(caption: AppendValue<TBuilder>, code: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
  example(code: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
  exports(
    moduleName: AppendValue<TBuilder>,
    exportName: AppendValue<TBuilder>,
    options?: _TsDocTagOpt<TBuilder>
  ): never;
  kind(
    kindName: StringSuggestions<
      | 'class'
      | 'constant'
      | 'event'
      | 'external'
      | 'file'
      | 'function'
      | 'member'
      | 'mixin'
      | 'module'
      | 'namespace'
      | 'typedef'
    >,
    options?: _TsDocTagOpt<TBuilder>
  ): never;
  license(identifier: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
  listens(eventName: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
  mixes(otherObjectPath: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
  mixin(mixinName: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
  requires(moduleName: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
  variation(variationNumber: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
} & {
  [K in 'virtual' | 'abstract']: (options?: _TsDocTagOpt<TBuilder>) => never;
} & {
  [K in 'alias' | 'augments' | 'callback' | 'extends' | 'lends' | 'name' | 'see' | 'this']: (
    namePath: AppendValue<TBuilder>,
    options?: _TsDocTagOpt<TBuilder>
  ) => never;
} & {
  [K in
    | 'async'
    | 'generator'
    | 'global'
    | 'hideconstructor'
    | 'ignore'
    | 'inheritdoc'
    | 'inner'
    | 'instance'
    | 'override'
    | 'static'
    | 'enum'
    | 'package'
    | 'private'
    | 'protected'
    | 'implements'
    | 'type']: (options?: _TsDocTagOpt<TBuilder>) => never;
} & {
  [K in
    | 'class'
    | 'constructor'
    | 'const'
    | 'function'
    | 'func'
    | 'method'
    | 'constant'
    | 'member'
    | 'constructs'
    | 'interface'
    | 'var'
    | 'yield'
    | 'yields'
    | 'module'
    | 'namespace'
    | 'typedef']: {
    (name: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
    (options?: _TsDocTagOpt<TBuilder>): never;
  };
} & {
  [K in
    | 'return'
    | 'returns'
    | 'throws'
    | 'exception'
    | 'classdesc'
    | 'copyright'
    | 'deprecated'
    | 'desc'
    | 'description'
    | 'file'
    | 'fileoverview'
    | 'overview'
    | 'public'
    | 'readonly'
    | 'since'
    | 'summary'
    | 'todo'
    | 'tutorial'
    | 'version']: {
    (description: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
    (options?: _TsDocTagOpt<TBuilder>): never;
  };
} & {
  [K in 'default' | 'defaultvalue']: {
    (value: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
    (options?: _TsDocTagOpt<TBuilder>): never;
  };
} & {
  [K in 'event' | 'fires']: (
    className: AppendValue<TBuilder>,
    eventName: AppendValue<TBuilder>,
    options?: _TsDocTagOpt<TBuilder>
  ) => never;
} & {
  [K in 'external' | 'host']: (nameOfExternal: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>) => never;
} & {
  [K in 'memberof' | 'memberof!']: (parentNamepath: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>) => never;
} & {
  [K in 'param' | 'arg' | 'argument' | 'prop' | 'property' | 'template']: {
    (name: AppendValue<TBuilder>, description: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
    (name: AppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
  };
};

type _TsDocTagArgs<
  TTagName extends StringSuggestions<keyof _TsDocTagArgsMap<TBuilder>>,
  TBuilder extends SourceBuilder
> = TTagName extends keyof _TsDocTagArgsMap<TBuilder>
  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _TsDocTagArgsMap<TBuilder>[TTagName] extends (...args: any[]) => any
    ? ParametersWithOverloads<_TsDocTagArgsMap<TBuilder>[TTagName]>
    : never
  : [options?: _TsDocTagOpt<TBuilder>];

export function tsDocTag<
  TTagName extends StringSuggestions<keyof _TsDocTagArgsMap<TBuilder>>,
  TBuilder extends SourceBuilder = TsDefaultBuilder
>(tag: TTagName, ...args: _TsDocTagArgs<TTagName, TBuilder>): TsDocTag<TBuilder>;
export function tsDocTag<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  tag: string,
  ...args: unknown[]
): TsDocTag<TBuilder> {
  let opt: _TsDocTagOpt<TBuilder> = {};
  if (args.length > 0) {
    const lastArg = args[args.length - 1];
    if (typeof lastArg === 'object' && lastArg !== null && !('kind' in lastArg)) {
      opt = args.pop() as _TsDocTagOpt<TBuilder>;
    }
  }

  let params = args as AppendValue<TBuilder>[];

  if (tag === 'author' && params.length === 2) {
    params[1] = `<${params[1]}>`;
  }

  if (tag === 'borrows') {
    params.splice(1, 0, 'as');
  }

  if (tag === 'example') {
    if (typeof params[0] === 'string') {
      params[0] = `<caption>${params[0]}</caption>`;
    }
    if (params[1] && isTypeScriptAppendValue(params[1])) {
      params.splice(1, 0, '\n');
    }
  }

  if ((tag === 'event' || tag === 'fires') && typeof params[0] === 'string' && typeof params[1] === 'string') {
    params.splice(0, 2, `${params[0]}#${params[1]}`);
  }

  params = [...params, opt.text].filter((x) => !!x);
  return {
    ...tsNode(tsDocTagNodeKind, opt),
    tag,
    type: opt.type,
    text: params.length > 0 ? appendValueGroup<TBuilder>(params, ' ') : null,
  };
}

export function isTsDocTag<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  value: unknown
): value is TsDocTag<TBuilder> {
  return isTsNode(value, tsDocTagNodeKind);
}

export function writeTsDocTag<TBuilder extends SourceBuilder = TsDefaultBuilder>(
  builder: TBuilder,
  node: TsDocTag<TBuilder>
): TBuilder {
  return writeTsNode(builder, node, (b) =>
    b.append('@', node.tag).appendIf(!!node.type, ' {', node.type, '}').appendIf(!!node.text, ' ', node.text)
  );
}
