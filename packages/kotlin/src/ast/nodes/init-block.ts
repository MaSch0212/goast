import type { AppendValue, AstNodeOptions, Prettify, SourceBuilder } from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtNodes } from '../utils/write-kt-node.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    body: AppendValue<TBuilder>;
  }
>;

/**
 * Represents a Kotlin `init` block, whose statements run when the enclosing class is instantiated.
 *
 * Written in this order: the `init` keyword, then the body in braces. A body other than an empty string is written on
 * indented lines of its own, while an empty string writes `init {}` on one line.
 *
 * @template TBuilder The type of the source builder the init block is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktInitBlock
 */
export class KtInitBlock<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The statements written inside the braces. An empty string writes `init {}` on one line. Any other value is written
   * on indented lines of its own.
   */
  public body: AppendValue<TBuilder>;

  /**
   * Initializes a new instance of the KtInitBlock class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.body = options.body;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('init ').parenthesize('{}', this.body, { multiline: !!this.body }).appendLine();
  }
}

const createInitBlock = <TBuilder extends SourceBuilder>(
  body: Options<TBuilder>['body'],
  options?: Prettify<Omit<Options<TBuilder>, 'body'>>,
): KtInitBlock<TBuilder> => new KtInitBlock<TBuilder>({ ...options, body });

/**
 * Factory for creating init block nodes. The `write` function writes one or more init block nodes to a builder.
 *
 * @param body The statements written inside the braces of the init block. See `KtInitBlock.body`.
 * @param options The settings of the init block. See `KtInitBlock` for the available properties.
 * @example
 * ```ts
 * ktInitBlock('println("Hello")');
 * // Emits:
 * // init {
 * //     println("Hello")
 * // }
 * ```
 */
export const ktInitBlock: typeof createInitBlock & { write: typeof writeKtNodes } = Object.assign(createInitBlock, {
  write: writeKtNodes,
});
