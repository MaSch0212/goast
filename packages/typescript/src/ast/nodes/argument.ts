import type { AstNodeOptions, Prettify, SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode } from '../utils/write-ts-nodes.ts';
import { writeTsParameters } from '../utils/write-ts-parameters.ts';
import type { TsValue } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    value: TsValue<TBuilder>;
  }
>;

/**
 * Represents a single argument of a call or a decorator. The node itself writes only the value.
 *
 * The parentheses around the arguments and the separators between them are written by the `write` function. It writes
 * the parentheses even when there are no arguments, and puts one argument per line when there are more than two.
 *
 * @template TBuilder The type of the source builder the argument is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsArgument
 */
export class TsArgument<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The value written as the argument, such as `42` or an expression. Nodes are written with their own output, and
   * other values are appended as they are.
   */
  public value: TsValue<TBuilder>;

  /**
   * Initializes a new instance of the TsArgument class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.value = options.value;
  }

  protected override onWrite(builder: TBuilder): void {
    writeTsNode(builder, this.value);
  }
}

const createArgument = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value'>>,
): TsArgument<TBuilder> => new TsArgument<TBuilder>({ ...options, value });

/**
 * Factory for creating argument nodes. The `write` function writes one or more arguments to a builder, enclosed in
 * parentheses.
 *
 * @param value The value of the argument.
 * @param options The settings of the argument. See `TsArgument` for the available properties.
 * @example
 * ```ts
 * tsArgument('42');
 * // Emits:
 * // 42
 * ```
 */
export const tsArgument: typeof createArgument & { write: typeof writeTsParameters } = Object.assign(createArgument, {
  write: writeTsParameters,
});
