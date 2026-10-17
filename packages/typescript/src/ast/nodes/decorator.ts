import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SingleOrMultiple,
  type SourceBuilder,
  toArray,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode } from '../utils/write-ts-nodes.ts';
import { type TsArgument, tsArgument } from './argument.ts';
import type { TsReference } from './reference.ts';
import type { TsValue } from './types.ts';

type Injects = 'function' | 'arguments';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    function: TsReference<TBuilder> | BasicAppendValue<TBuilder>;
    arguments?: Nullable<Nullable<TsArgument<TBuilder> | TsValue<TBuilder>>[]>;
  }
>;

/**
 * Represents a decorator, such as `@decorator` or `@decorator(arg1, arg2)`.
 *
 * Written in this order: the `@` sign, the function, then the arguments in parentheses when they are set.
 *
 * @template TBuilder The type of the source builder the decorator is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsDecorator
 */
export class TsDecorator<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The function that is called as the decorator, such as `decorator` in `@decorator`. It is written right after the
   * `@` sign, and nodes are written with their own output.
   */
  public function: TsReference<TBuilder> | BasicAppendValue<TBuilder>;
  /**
   * The arguments written in parentheses after the function, or `null` to write no parentheses. An empty array writes
   * `()`, and more than two arguments are written one per line.
   */
  public arguments: (TsArgument<TBuilder> | TsValue<TBuilder>)[] | null;

  /**
   * Initializes a new instance of the TsDecorator class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.function = options.function;
    this.arguments = options.arguments?.filter(notNullish) ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('@');
    builder.append(this.inject.beforeFunction);
    writeTsNode(builder, this.function);
    builder.append(this.inject.afterFunction);

    if (this.arguments) {
      builder.append(this.inject.beforeArguments);
      tsArgument.write(builder, this.arguments);
      builder.append(this.inject.afterArguments);
    }
  }
}

const createDecorator = <TBuilder extends SourceBuilder>(
  fn: Options<TBuilder>['function'],
  args?: Options<TBuilder>['arguments'],
  options?: Prettify<Omit<Options<TBuilder>, 'function' | 'arguments'>>,
): TsDecorator<TBuilder> => new TsDecorator<TBuilder>({ ...options, function: fn, arguments: args });

const writeDecorators = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<TsDecorator<TBuilder> | AppendValue<TBuilder>>>,
  options?: { multiline?: boolean },
): void => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, (b, d) => {
    writeTsNode(b, d);
    b.append(options?.multiline ? '\n' : ' ');
  });
};

/**
 * Factory for creating decorator nodes. The `write` function writes one or more decorators to a builder. With
 * `multiline` each decorator gets its own line, otherwise the decorators are separated by spaces.
 *
 * @param fn The decorator function, such as `Injectable`.
 * @param args The arguments of the decorator. Omit them to write no parentheses.
 * @param options The settings of the decorator. See `TsDecorator` for the available properties.
 * @example
 * ```ts
 * tsDecorator('Injectable', ["'root'"]);
 * // Emits:
 * // @Injectable('root')
 * ```
 */
export const tsDecorator: typeof createDecorator & { write: typeof writeDecorators } = Object.assign(createDecorator, {
  write: writeDecorators,
});
