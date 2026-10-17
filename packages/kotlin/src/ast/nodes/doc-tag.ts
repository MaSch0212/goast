import {
  type AstNodeOptions,
  type BasicAppendValue,
  basicAppendValueGroup,
  notNullish,
  type Nullable,
  type ParametersWithOverloads,
  type Prettify,
  type SingleOrMultiple,
  type SourceBuilder,
  type StringSuggestions,
} from '@goast/core';

import { isKotlinAppendValue } from '../../file-builder.ts';
import { KtNode } from '../node.ts';
import { type KtAppendValue, writeKtNodes } from '../utils/write-kt-node.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    tag: string;
    args?: Nullable<Nullable<BasicAppendValue<TBuilder>>[]>;
    description?: Nullable<BasicAppendValue<TBuilder>>;
  }
>;

/**
 * Represents a documentation tag, such as `@param x The value.` or `@see Foo`. Tags are written inside the KDoc comment
 * of the declaration that they document.
 *
 * Written in this order: the `@` sign and the tag name, the arguments, then the description. Each part after the tag
 * name is preceded by a space.
 *
 * @template TBuilder The type of the source builder the tag is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktDocTag
 */
export class KtDocTag<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the tag, written after the `@` sign, such as `param` or `see`.
   */
  public tag: string;
  /**
   * The arguments written after the tag name, each preceded by a space. For `@param x`, the name `x` is an argument.
   */
  public args: BasicAppendValue<TBuilder>[];
  /**
   * The text written at the end of the tag, preceded by a space, or `null` to omit it.
   */
  public description: BasicAppendValue<TBuilder> | null;

  /**
   * Initializes a new instance of the KtDocTag class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.tag = options.tag;
    this.args = options.args?.filter(notNullish) ?? [];
    this.description = options.description ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('@', this.tag);
    this.args.forEach((a) => builder.append(' ', a));
    if (this.description) builder.append(' ', this.description);
  }
}

type _KtDocTagOpt<TBuilder extends SourceBuilder> = Prettify<Omit<Options<TBuilder>, 'tag'>>;

type _KtDocTagArgsMap<TBuilder extends SourceBuilder> = {
  suppress(options?: _KtDocTagOpt<TBuilder>): never;
} & {
  [K in 'return' | 'constructor' | 'receiver' | 'author' | 'since']: (
    description: BasicAppendValue<TBuilder>,
    options?: _KtDocTagOpt<TBuilder>,
  ) => never;
} & {
  [K in 'param' | 'property']: (
    name: string,
    description: BasicAppendValue<TBuilder>,
    options?: _KtDocTagOpt<TBuilder>,
  ) => never;
} & {
  [K in 'see' | 'sample']: (identifier: string, options?: _KtDocTagOpt<TBuilder>) => never;
} & {
  [K in 'throws' | 'exception']: (
    $class: BasicAppendValue<TBuilder>,
    description: BasicAppendValue<TBuilder>,
    options?: _KtDocTagOpt<TBuilder>,
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
  TBuilder extends SourceBuilder,
> = TTagName extends keyof _KtDocTagArgsMap<TBuilder>
  ? _KtDocTagArgsMap<TBuilder>[TTagName] extends (...args: any[]) => any
    ? ParametersWithOverloads<_KtDocTagArgsMap<TBuilder>[TTagName]>
    : never
  : [options?: _KtDocTagOpt<TBuilder>];

function createDocTag<
  TTagName extends StringSuggestions<keyof _KtDocTagArgsMap<TBuilder>>,
  TBuilder extends SourceBuilder,
>(tag: TTagName, ...args: _KtDocTagArgs<TTagName, TBuilder>): KtDocTag<TBuilder>;
function createDocTag<TBuilder extends SourceBuilder>(tag: string, ...args: unknown[]): KtDocTag<TBuilder> {
  let opt: _KtDocTagOpt<TBuilder> = {};
  if (args.length > 0) {
    const lastArg = args[args.length - 1];
    if (!isKotlinAppendValue(lastArg) && !!lastArg) {
      opt = args.pop() as _KtDocTagOpt<TBuilder>;
    }
  }

  const params = args as BasicAppendValue<TBuilder>[];
  if (tagsWithDescription.includes(tag)) {
    const description = params.pop();
    if (opt.description && description) {
      opt.description = basicAppendValueGroup<TBuilder>([description, opt.description], '\n');
    } else if (description) {
      opt.description = description;
    }
  }

  return new KtDocTag({ ...opt, tag, args: params });
}

const writeDocTags = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtAppendValue<TBuilder>>>,
): void => {
  writeKtNodes(builder, nodes, { separator: '\n' });
};

/**
 * Factory for creating doc tag nodes. The `write` function writes one or more tags to a builder, one per line.
 *
 * The arguments depend on the tag. `param` and `property` take a name and a description, `throws` and `exception` take
 * a class and a description, and `see` and `sample` take an identifier. `suppress` takes no arguments, and tags such as
 * `return` take only a description. Other tags take their arguments as given. A settings object can be passed last.
 *
 * @param tag The name of the tag, written after the `@` sign.
 * @param args The arguments of the tag, followed by an optional settings object. See the description for the arguments
 * of each tag.
 * @example
 * ```ts
 * ktDocTag('param', 'id', 'The identifier of the pet.');
 * // Emits:
 * // @param id The identifier of the pet.
 * ```
 */
export const ktDocTag: typeof createDocTag & { write: typeof writeDocTags } = Object.assign(createDocTag, {
  write: writeDocTags,
});
