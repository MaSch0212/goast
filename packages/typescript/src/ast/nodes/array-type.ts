import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsType } from './types.ts';

type Injects = 'type';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    readonly?: Nullable<boolean>;
    type: TsType<TBuilder>;
  }
>;

/**
 * Represents an array type, such as `readonly (number)[]`. The element type is always wrapped in parentheses.
 *
 * Written in this order: the `readonly` keyword when set, the element type in parentheses, then `[]`.
 *
 * @template TBuilder The type of the source builder the array type is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsArrayType
 */
export class TsArrayType<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * Whether the array is written with the `readonly` keyword in front of it.
   * @default false
   */
  public readonly: boolean;
  /**
   * The element type of the array. It is always wrapped in parentheses, so `number` is written as `(number)[]`.
   */
  public type: TsType<TBuilder>;

  /**
   * Initializes a new instance of the TsArrayType class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.readonly = options.readonly ?? false;
    this.type = options.type;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.readonly) builder.append('readonly ');

    builder
      .append(this.inject.beforeType)
      .parenthesize('()', (b) => writeTsNode(b, this.type))
      .append(this.inject.afterType);

    builder.append('[]');
  }
}

const createArrayType = <TBuilder extends SourceBuilder>(
  type: Options<TBuilder>['type'],
  options?: Prettify<Omit<Options<TBuilder>, 'type'>>,
): TsArrayType<TBuilder> => new TsArrayType<TBuilder>({ ...options, type });

/**
 * Factory for creating array type nodes. The `write` function writes one or more array types to a builder.
 *
 * @param type The element type of the array.
 * @param options The settings of the array type. See `TsArrayType` for the available properties.
 * @example
 * ```ts
 * tsArrayType('number', { readonly: true });
 * // Emits:
 * // readonly (number)[]
 * ```
 */
export const tsArrayType: typeof createArrayType & { write: typeof writeTsNodes } = Object.assign(createArrayType, {
  write: writeTsNodes,
});
