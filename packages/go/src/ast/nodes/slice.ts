import type { AstNodeOptions, Prettify, SourceBuilder } from '@goast/core';

import { GoNode } from '../node.ts';
import { writeGoNode, writeGoNodes } from '../utils/write-go-node.ts';
import type { GoType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    elementType: GoType<TBuilder>;
  }
>;

/**
 * A slice type, written as `[]T`.
 *
 * @template TBuilder The type of the source builder the slice type is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goSlice
 */
export class GoSlice<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The type of the elements, written after the brackets.
   */
  public elementType: GoType<TBuilder>;

  /**
   * Initializes a new instance of the GoSlice class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.elementType = options.elementType;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('[]');
    writeGoNode(builder, this.elementType);
  }
}

const createSlice = <TBuilder extends SourceBuilder>(
  elementType: Options<TBuilder>['elementType'],
  options?: Prettify<Omit<Options<TBuilder>, 'elementType'>>,
): GoSlice<TBuilder> => new GoSlice<TBuilder>({ ...options, elementType });

/**
 * Factory for creating slice nodes. The `write` function writes one or more slice nodes to a builder.
 *
 * @param elementType The type of the elements.
 * @param options Additional settings of the slice. `GoSlice` has no properties besides `elementType`.
 * @example
 * ```ts
 * goSlice(goReference('Pet'));
 * // Emits:
 * // []Pet
 * ```
 */
export const goSlice: typeof createSlice & { write: typeof writeGoNodes } = Object.assign(createSlice, {
  write: writeGoNodes,
});
