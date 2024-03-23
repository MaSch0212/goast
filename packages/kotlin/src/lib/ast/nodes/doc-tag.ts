import {
  SourceBuilder,
  AppendValue,
  AstNodeOptions,
  StringSuggestions,
  ParametersWithOverloads,
  appendValueGroup,
  Prettify,
  SingleOrMultiple,
  toArray,
} from '@goast/core';

import { KotlinFileBuilder } from '../../file-builder';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type KtDocTagOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtDocTag<TBuilder>,
  typeof KtNode<TBuilder>,
  'tag'
>;

export class KtDocTag<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, TInjects> {
  public tag: string;
  public args: AppendValue<TBuilder>[];
  public description: AppendValue<TBuilder>;

  constructor(options: KtDocTagOptions<TBuilder>) {
    super(options);
    this.tag = options.tag;
    this.args = options.args ?? [];
    this.description = options.description;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('@', this.tag);
    this.args.forEach((a) => builder.append(' ', a));
    builder.appendIf(!!this.description, ' ', this.description);
  }
}

type _KtDocTagOpt<TBuilder extends SourceBuilder> = Prettify<Omit<KtDocTagOptions<TBuilder>, 'tag'>>;

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

function createDocTag<
  TTagName extends StringSuggestions<keyof _KtDocTagArgsMap<TBuilder>>,
  TBuilder extends SourceBuilder = KotlinFileBuilder
>(tag: TTagName, ...args: _KtDocTagArgs<TTagName, TBuilder>): KtDocTag<TBuilder>;
function createDocTag<TBuilder extends SourceBuilder = KotlinFileBuilder>(
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

  return new KtDocTag({ ...opt, tag, args: params });
}

const writeDocTags = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  tags: SingleOrMultiple<KtDocTag<TBuilder> | AppendValue<TBuilder>>
) => {
  builder.forEach(toArray(tags), (b, t) => b.appendLine((b) => writeKt(b, t)));
};

export const ktDocTag = Object.assign(createDocTag, {
  write: writeDocTags,
});
