import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type SourceBuilder,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import { type TsGenericParameter, tsGenericParameter } from './generic-parameter.ts';
import { type TsParameter, tsParameter } from './parameter.ts';
import type { TsType } from './types.ts';

type Injects = 'generics' | 'params' | 'returnType' | 'body';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    async?: Nullable<boolean>;
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    parameters?: Nullable<Nullable<TsParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    returnType?: Nullable<TsType<TBuilder>>;
    singleExpression?: Nullable<boolean>;
    body?: Nullable<AppendValue<TBuilder>>;
  }
>;

/**
 * Represents an arrow function, such as `(x, y): number => { ... }`.
 *
 * Written in this order: the `async` keyword when set, the generics, the parameters, the return type, ` => `, then the
 * body. The function has no doc comment and no decorators.
 *
 * @template TBuilder The type of the source builder the arrow function is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsArrowFunction
 */
export class TsArrowFunction<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * Whether the function is written with the `async` keyword in front of it.
   * @default false
   */
  public async: boolean;
  /**
   * The type parameters written in angle brackets before the parameters, such as `<T, U>`. Nothing is written when
   * there are none.
   */
  public generics: (TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The parameters written in parentheses, such as `(x, y)`. The parentheses are always written, and more than two
   * parameters are written one per line.
   */
  public parameters: (TsParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The return type written after the parameters as `: Type`, or `null` to omit it.
   */
  public returnType: TsType<TBuilder> | null;
  /**
   * Whether the body is written directly after ` => ` without braces, such as `(x) => x * 2`. Without a body, empty
   * braces are written instead.
   * @default false
   */
  public singleExpression: boolean;
  /**
   * The body of the function, or `null` to write empty braces `{}`. A block body is written in braces on its own
   * indented lines. With `singleExpression` the body is written without braces.
   */
  public body: AppendValue<TBuilder> | null;

  /**
   * Initializes a new instance of the TsArrowFunction class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.async = options.async ?? false;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.returnType = options.returnType ?? null;
    this.singleExpression = options.singleExpression ?? false;
    this.body = options.body ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.async) {
      builder.append('async ');
    }

    builder.append(this.inject.beforeGenerics);
    tsGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    builder.append(this.inject.beforeParams);
    tsParameter.write(builder, this.parameters);
    builder.append(this.inject.afterParams);

    if (this.returnType) {
      builder.append(': ');
      builder.append(this.inject.beforeReturnType);
      writeTsNode(builder, this.returnType);
      builder.append(this.inject.afterReturnType);
    }

    builder.append(' => ');

    builder.append(this.inject.beforeBody);
    if (this.singleExpression && this.body) {
      builder.append(this.body);
    } else {
      builder.parenthesize('{}', this.body, { multiline: !!this.body });
    }
    builder.append(this.inject.afterBody);
  }
}

const createArrowFunction = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>): TsArrowFunction<TBuilder> =>
  new TsArrowFunction<TBuilder>(options ?? {});

/**
 * Factory for creating arrow function nodes. The `write` function writes one or more arrow functions to a builder.
 *
 * @param options The settings of the arrow function. See `TsArrowFunction` for the available properties.
 * @example
 * ```ts
 * tsArrowFunction({
 *   generics: ['T', 'U'],
 *   parameters: ['x', 'y'],
 *   returnType: 'number',
 *   body: 'return 42;',
 * });
 * // Emits:
 * // <T, U>(x, y): number => {
 * //   return 42;
 * // }
 * ```
 */
export const tsArrowFunction: typeof createArrowFunction & { write: typeof writeTsNodes } = Object.assign(
  createArrowFunction,
  {
    write: writeTsNodes,
  },
);
