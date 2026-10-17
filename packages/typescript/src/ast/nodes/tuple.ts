import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsType, TsValue } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    elements: Nullable<TsType<TBuilder> | TsValue<TBuilder>>[];
    asConst?: Nullable<boolean>;
  }
>;

/**
 * Represents a tuple, which is a fixed list of types or values, such as `[string, number]`.
 *
 * Written as the elements in square brackets, separated by commas. Tuples of more than three elements are written with
 * one element per line. An empty tuple is written as `[]`, and ` as const` is appended when `asConst` is set.
 *
 * @template TBuilder The type of the source builder the tuple is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsTuple
 */
export class TsTuple<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The types or values of the elements, in the given order. Null entries are skipped.
   */
  public elements: (TsType<TBuilder> | TsValue<TBuilder>)[];
  /**
   * Whether ` as const` is appended after the brackets, such as `[string, number] as const`.
   * @default false
   */
  public asConst: boolean;

  /**
   * Initializes a new instance of the TsTuple class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.elements = options.elements.filter(notNullish);
    this.asConst = options.asConst ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.elements.length === 0) {
      builder.append('[]');
    } else {
      const multiline = this.elements.length > 3;
      builder.parenthesize('[]', (b) => writeTsNodes(b, this.elements, { separator: multiline ? ',\n' : ', ' }), {
        multiline,
      });
    }

    if (this.asConst) {
      builder.append(' as const');
    }
  }
}

const createTuple = <TBuilder extends SourceBuilder>(
  elements: Options<TBuilder>['elements'],
  options?: Prettify<Omit<Options<TBuilder>, 'elements'>>,
): TsTuple<TBuilder> => new TsTuple<TBuilder>({ ...options, elements });

/**
 * Factory for creating tuple nodes. The `write` function writes one or more tuple nodes to a builder.
 *
 * @param elements The types or values of the elements. See `TsTuple.elements`.
 * @param options The settings of the tuple. See `TsTuple` for the available properties.
 * @example
 * ```ts
 * tsTuple(['string', 'number'], { asConst: true });
 * // Emits:
 * // [string, number] as const
 * ```
 */
export const tsTuple: typeof createTuple & { write: typeof writeTsNodes } = Object.assign(createTuple, {
  write: writeTsNodes,
});
