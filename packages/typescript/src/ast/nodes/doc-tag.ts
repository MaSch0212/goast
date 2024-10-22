import {
  type AstNodeOptions,
  type BasicAppendValue,
  basicAppendValueGroup,
  notNullish,
  type Nullable,
  type ParametersWithOverloads,
  type Prettify,
  type SourceBuilder,
  type StringSuggestions,
} from '@goast/core';

import { isTypeScriptAppendValue } from '../../file-builder.ts';
import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    tag: string;
    type?: Nullable<TsType<TBuilder>>;
    text?: Nullable<BasicAppendValue<TBuilder>>;
  }
>;

export class TsDocTag<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public tag: string;
  public type: TsType<TBuilder> | null;
  public text: BasicAppendValue<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.tag = options.tag;
    this.type = options.type ?? null;
    this.text = options.text ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('@', this.tag);

    if (this.type) {
      builder.append(' ');
      builder.parenthesize('{}', (b) => writeTsNode(b, this.type));
    }

    if (this.text) {
      builder.append(' ', this.text);
    }
  }
}

type _TsDocTagOpt<TBuilder extends SourceBuilder> = Prettify<Omit<Options<TBuilder>, 'tag'>>;

type _TsDocTagArgsMap<TBuilder extends SourceBuilder> =
  & {
    access(
      access: StringSuggestions<'package' | 'private' | 'protected' | 'public'>,
      options?: _TsDocTagOpt<TBuilder>,
    ): never;
    author(authorName: BasicAppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
    author(
      authorName: BasicAppendValue<TBuilder>,
      emailAddress: BasicAppendValue<TBuilder>,
      options?: _TsDocTagOpt<TBuilder>,
    ): never;
    borrows(
      thatNamepath: BasicAppendValue<TBuilder>,
      thisNamepath: BasicAppendValue<TBuilder>,
      options?: _TsDocTagOpt<TBuilder>,
    ): never;
    params(
      paramName: BasicAppendValue<TBuilder>,
      paramDescription: BasicAppendValue<TBuilder>,
      options?: _TsDocTagOpt<TBuilder>,
    ): never;
    example(
      caption: BasicAppendValue<TBuilder>,
      code: BasicAppendValue<TBuilder>,
      options?: _TsDocTagOpt<TBuilder>,
    ): never;
    example(code: BasicAppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
    exports(
      moduleName: BasicAppendValue<TBuilder>,
      exportName: BasicAppendValue<TBuilder>,
      options?: _TsDocTagOpt<TBuilder>,
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
      options?: _TsDocTagOpt<TBuilder>,
    ): never;
    license(identifier: BasicAppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
    listens(eventName: BasicAppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
    mixes(otherObjectPath: BasicAppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
    mixin(mixinName: BasicAppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
    requires(moduleName: BasicAppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
    variation(variationNumber: BasicAppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
  }
  & {
    [K in 'virtual' | 'abstract']: (options?: _TsDocTagOpt<TBuilder>) => never;
  }
  & {
    [K in 'alias' | 'augments' | 'callback' | 'extends' | 'lends' | 'name' | 'see' | 'this']: (
      namePath: BasicAppendValue<TBuilder>,
      options?: _TsDocTagOpt<TBuilder>,
    ) => never;
  }
  & {
    [
      K in
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
        | 'type'
    ]: (options?: _TsDocTagOpt<TBuilder>) => never;
  }
  & {
    [
      K in
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
        | 'typedef'
    ]: {
      (name: BasicAppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
      (options?: _TsDocTagOpt<TBuilder>): never;
    };
  }
  & {
    [
      K in
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
        | 'version'
    ]: {
      (description: BasicAppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
      (options?: _TsDocTagOpt<TBuilder>): never;
    };
  }
  & {
    [K in 'default' | 'defaultvalue']: {
      (value: BasicAppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
      (options?: _TsDocTagOpt<TBuilder>): never;
    };
  }
  & {
    [K in 'event' | 'fires']: (
      className: BasicAppendValue<TBuilder>,
      eventName: BasicAppendValue<TBuilder>,
      options?: _TsDocTagOpt<TBuilder>,
    ) => never;
  }
  & {
    [K in 'external' | 'host']: (nameOfExternal: BasicAppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>) => never;
  }
  & {
    [K in 'memberof' | 'memberof!']: (
      parentNamepath: BasicAppendValue<TBuilder>,
      options?: _TsDocTagOpt<TBuilder>,
    ) => never;
  }
  & {
    [K in 'param' | 'arg' | 'argument' | 'prop' | 'property' | 'template']: {
      (
        name: BasicAppendValue<TBuilder>,
        description: BasicAppendValue<TBuilder>,
        options?: _TsDocTagOpt<TBuilder>,
      ): never;
      (name: BasicAppendValue<TBuilder>, options?: _TsDocTagOpt<TBuilder>): never;
    };
  };

type _TsDocTagArgs<
  TTagName extends StringSuggestions<keyof _TsDocTagArgsMap<TBuilder>>,
  TBuilder extends SourceBuilder,
> = TTagName extends keyof _TsDocTagArgsMap<TBuilder>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ? _TsDocTagArgsMap<TBuilder>[TTagName] extends (...args: any[]) => any
    ? ParametersWithOverloads<_TsDocTagArgsMap<TBuilder>[TTagName]>
  : never
  : [options?: _TsDocTagOpt<TBuilder>];

function createDocTag<
  TTagName extends StringSuggestions<keyof _TsDocTagArgsMap<TBuilder>>,
  TBuilder extends SourceBuilder,
>(
  tag: TTagName,
  ...args: _TsDocTagArgs<TTagName, TBuilder>
): TsDocTag<TBuilder>;
function createDocTag<TBuilder extends SourceBuilder>(tag: string, ...args: unknown[]): TsDocTag<TBuilder> {
  let opt: _TsDocTagOpt<TBuilder> = {};
  if (args.length > 0) {
    const lastArg = args[args.length - 1];
    if (!isTypeScriptAppendValue(lastArg) && !!lastArg) {
      opt = args.pop() as _TsDocTagOpt<TBuilder>;
    }
  }

  let params = args as BasicAppendValue<TBuilder>[];

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

  params = [...params, opt.text].filter(notNullish);
  return new TsDocTag({
    tag,
    type: opt.type,
    text: params.length > 0 ? basicAppendValueGroup<TBuilder>(params, ' ') : null,
    inject: opt.inject,
  });
}

export const tsDocTag = Object.assign(createDocTag, {
  write: writeTsNodes,
});
