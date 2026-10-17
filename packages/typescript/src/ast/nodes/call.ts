import {
  type ArrayItem,
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';
import { type TsArgument, tsArgument } from './argument.ts';
import type { TsType, TsValue } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    path: Nullable<TsType<TBuilder> | TsValue<TBuilder>>[];
    arguments?: Nullable<Nullable<TsArgument<TBuilder> | TsValue<TBuilder>>[]>;
  }
>;

/**
 * Represents a call, such as `console.log('x', 42)`.
 *
 * Written in this order: the path, with its segments joined by dots, then the arguments in parentheses when they are
 * set.
 *
 * @template TBuilder The type of the source builder the call is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsCall
 */
export class TsCall<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The segments of the called expression, joined with dots, such as `a.b.c`. Nullish segments are left out.
   */
  public path: (TsType<TBuilder> | TsValue<TBuilder>)[];
  /**
   * The arguments written in parentheses after the path, or `null` to write no parentheses at all. An empty array
   * writes `()`.
   */
  public arguments: (TsArgument<TBuilder> | TsValue<TBuilder>)[] | null;

  /**
   * Initializes a new instance of the TsCall class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.path = options.path.filter(notNullish);
    this.arguments = options.arguments?.filter(notNullish) ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    writeTsNodes(builder, this.path, { separator: '.' });

    if (this.arguments) {
      tsArgument.write(builder, this.arguments);
    }
  }
}

const createCall = <TBuilder extends SourceBuilder>(
  path: Options<TBuilder>['path'] | ArrayItem<Options<TBuilder>['path']>,
  args?: Options<TBuilder>['arguments'],
  options?: Prettify<Omit<Options<TBuilder>, 'path' | 'arguments'>>,
): TsCall<TBuilder> => new TsCall<TBuilder>({ ...options, path: Array.isArray(path) ? path : [path], arguments: args });

/**
 * Factory for creating call nodes. The `write` function writes one or more calls to a builder.
 *
 * @param path The segments of the called expression. A single segment can be passed without an array.
 * @param args The arguments of the call. Omit them to write no parentheses.
 * @param options The settings of the call. See `TsCall` for the available properties.
 * @example
 * ```ts
 * tsCall(['console', 'log'], ["'Hello'", '42']);
 * // Emits:
 * // console.log('Hello', 42)
 * ```
 */
export const tsCall: typeof createCall & { write: typeof writeTsNodes } = Object.assign(createCall, {
  write: writeTsNodes,
});
