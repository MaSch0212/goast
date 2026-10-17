import { type AstNodeOptions, notNullish, type Nullable, type SourceBuilder } from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtNodes } from '../utils/write-kt-node.ts';
import type { KtValue } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    elements: Nullable<Nullable<KtValue<TBuilder>>[]>;
  }
>;

/**
 * Represents a Kotlin collection literal, such as `["read", "write"]`. Kotlin accepts collection literals only inside
 * annotation arguments.
 *
 * Written in this order: the opening bracket, the elements separated by commas, then the closing bracket.
 *
 * @template TBuilder The type of the source builder the collection literal is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktCollectionLiteral
 */
export class KtCollectionLiteral<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The elements written between the brackets, in the given order. Nullish elements are dropped before counting.
   * Literals with more than two elements are written one element per line, shorter ones on a single line.
   */
  public elements: KtValue<TBuilder>[];

  /**
   * Initializes a new instance of the KtCollectionLiteral class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.elements = options.elements?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    const multiline = this.elements.length > 2;
    builder.parenthesize(
      '[]',
      (b) => {
        writeKtNodes(b, this.elements, { separator: multiline ? ',\n' : ', ' });
      },
      { multiline },
    );
  }
}

const createCollectionLiteral = <TBuilder extends SourceBuilder>(
  elements: Options<TBuilder>['elements'],
  options?: Omit<Options<TBuilder>, 'elements'>,
): KtCollectionLiteral<TBuilder> => new KtCollectionLiteral<TBuilder>({ ...options, elements });

/**
 * Factory for creating collection literal nodes. The `write` function writes one or more collection literals to a
 * builder.
 *
 * @param elements The elements of the literal. Nullish elements are dropped.
 * @param options The settings of the literal, which only contain the injection points. See `KtCollectionLiteral`.
 * @example
 * ```ts
 * ktCollectionLiteral(['"read"', '"write"', '"admin"']);
 * // Emits:
 * // [
 * //     "read",
 * //     "write",
 * //     "admin"
 * // ]
 * ```
 */
export const ktCollectionLiteral: typeof createCollectionLiteral & { write: typeof writeKtNodes } = Object.assign(
  createCollectionLiteral,
  {
    write: writeKtNodes,
  },
);
