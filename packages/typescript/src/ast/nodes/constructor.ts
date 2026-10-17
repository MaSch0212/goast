import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type SourceBuilder,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsConstructorParameter } from './constructor-parameter.ts';
import { type TsDecorator, tsDecorator } from './decorator.ts';
import { type TsDoc, tsDoc } from './doc.ts';
import { tsParameter } from './parameter.ts';

type Injects = 'params' | 'doc' | 'decorators' | 'body';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<TsDoc<TBuilder>>;
    decorators?: Nullable<Nullable<TsDecorator<TBuilder>>[]>;
    parameters?: Nullable<Nullable<TsConstructorParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    body?: Nullable<AppendValue<TBuilder>>;
  }
>;

/**
 * Represents the constructor of a class.
 *
 * Written in this order: the doc comment, the decorators, the `constructor` keyword, the parameters in parentheses, a
 * space, then the body in braces, followed by a line break.
 *
 * @template TBuilder The type of the source builder the constructor is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsConstructor
 */
export class TsConstructor<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The doc comment written above the constructor, or `null` to omit it. The descriptions of the parameters are added
   * to it as `@param` tags, which also creates a doc comment when none is set.
   */
  public doc: TsDoc<TBuilder> | null;
  /**
   * The decorators written above the constructor, each on its own line.
   */
  public decorators: TsDecorator<TBuilder>[];
  /**
   * The parameters written in parentheses. They are written one per line when there are more than two, or when one of
   * them has decorators.
   */
  public parameters: (TsConstructorParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The statements written in the body, on their own indented lines, or `null` to write empty braces `{}`.
   */
  public body: AppendValue<TBuilder> | null;

  /**
   * Initializes a new instance of the TsConstructor class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.decorators = options.decorators?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    tsDoc.get(this.doc, { parameters: this.parameters })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeDecorators);
    tsDecorator.write(builder, this.decorators, { multiline: true });
    builder.append(this.inject.afterDecorators);

    builder.append('constructor');
    builder.append(this.inject.beforeParams);
    tsParameter.write(builder, this.parameters);
    builder.append(this.inject.afterParams);
    builder.append(' ');

    builder.append(this.inject.beforeBody);
    builder.parenthesize('{}', this.body, { multiline: !!this.body });
    builder.append(this.inject.afterBody);

    builder.appendLine();
  }
}

const createConstructor = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>): TsConstructor<TBuilder> =>
  new TsConstructor<TBuilder>(options ?? {});

/**
 * Factory for creating constructor nodes. The `write` function writes one or more constructors to a builder.
 *
 * @param options The settings of the constructor. See `TsConstructor` for the available properties.
 * @example
 * ```ts
 * tsConstructor({
 *   parameters: [tsConstructorParameter('x', { type: 'number' }), 'y'],
 *   body: 'this.x = x;',
 * });
 * // Emits:
 * // constructor(x: number, y) {
 * //   this.x = x;
 * // }
 * ```
 */
export const tsConstructor: typeof createConstructor & { write: typeof writeTsNodes } = Object.assign(
  createConstructor,
  {
    write: writeTsNodes,
  },
);
