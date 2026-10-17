import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { toGoStringLiteral } from '../../utils.ts';
import { GoNode } from '../node.ts';
import { writeGoNodes } from '../utils/write-go-node.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    value: Nullable<string>;
  }
>;

/**
 * A string literal, written in double quotes as `"..."`. Quotes, backslashes and control characters in the value are
 * escaped, so the literal reads back as the same value.
 *
 * @template TBuilder The type of the source builder the string literal is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goString
 */
export class GoString<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The value of the string. A `null` value is written as an empty string, `""`.
   */
  public value: string;

  /**
   * Initializes a new instance of the GoString class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.value = options.value ?? '';
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(toGoStringLiteral(this.value));
  }
}

const createString = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value'>>,
): GoString<TBuilder> => new GoString<TBuilder>({ ...options, value });

/**
 * Factory for creating string literal nodes. The `write` function writes one or more string literal nodes to a builder.
 *
 * @param value The value of the string. A `null` value is written as an empty string.
 * @param options Additional settings of the string. `GoString` has no properties besides `value`.
 * @example
 * ```ts
 * goString('available');
 * // Emits:
 * // "available"
 * ```
 */
export const goString: typeof createString & { write: typeof writeGoNodes } = Object.assign(createString, {
  write: writeGoNodes,
});
