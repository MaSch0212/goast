import type { AstNodeOptions, Prettify, SourceBuilder } from '@goast/core';

import { GoNode } from '../node.ts';
import { writeGoNode, writeGoNodes } from '../utils/write-go-node.ts';
import type { GoType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    type: GoType<TBuilder>;
  }
>;

/**
 * A pointer type, written as `*T`.
 *
 * @template TBuilder The type of the source builder the pointer type is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goPointer
 */
export class GoPointer<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The type the pointer points to, written after the `*`.
   */
  public type: GoType<TBuilder>;

  /**
   * Initializes a new instance of the GoPointer class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.type = options.type;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('*');
    writeGoNode(builder, this.type);
  }
}

const createPointer = <TBuilder extends SourceBuilder>(
  type: Options<TBuilder>['type'],
  options?: Prettify<Omit<Options<TBuilder>, 'type'>>,
): GoPointer<TBuilder> => new GoPointer<TBuilder>({ ...options, type });

/**
 * Factory for creating pointer nodes. The `write` function writes one or more pointer nodes to a builder.
 *
 * @param type The type the pointer points to.
 * @param options Additional settings of the pointer. `GoPointer` has no properties besides `type`.
 * @example
 * ```ts
 * goPointer(goReference('Pet'));
 * // Emits:
 * // *Pet
 * ```
 */
export const goPointer: typeof createPointer & { write: typeof writeGoNodes } = Object.assign(createPointer, {
  write: writeGoNodes,
});
