import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { toGoComment } from '../../utils.ts';
import { GoNode } from '../node.ts';
import { writeGoNodes } from '../utils/write-go-node.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    text?: Nullable<string>;
    /**
     * Marks the declaration as deprecated with a `Deprecated:` paragraph, which Go tools recognize. `true` adds the
     * paragraph without an explanation.
     */
    deprecated?: Nullable<boolean | string>;
  }
>;

/**
 * A doc comment: `//` lines directly above a declaration. Nothing is written when there is neither text nor a
 * deprecation notice.
 *
 * Written in this order: the text, a blank line, then the `Deprecated:` paragraph. Every line is prefixed with `//`,
 * and a blank line is written as a bare `//`.
 *
 * @template TBuilder The type of the source builder the doc comment is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goDoc
 */
export class GoDoc<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The text of the comment, with surrounding whitespace removed. Paragraphs are separated by blank lines. `null` if
   * there is no text.
   */
  public text: string | null;
  /**
   * Whether the declaration is deprecated. `true` adds a `Deprecated:` paragraph without an explanation, a string adds
   * it with that explanation, and `false` adds nothing.
   * @default false
   */
  public deprecated: boolean | string;

  /**
   * Initializes a new instance of the GoDoc class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.text = options.text?.trim() || null;
    this.deprecated = options.deprecated ?? false;
  }

  /**
   * The comment lines, each already prefixed with `//`, or `null` if there is nothing to write. `GoConst` uses these
   * lines to write the doc comment of a spec inside a block.
   */
  public toLines(): string[] | null {
    const paragraphs = [this.text];
    if (this.deprecated !== false) {
      paragraphs.push(
        typeof this.deprecated === 'string' && this.deprecated.trim()
          ? `Deprecated: ${this.deprecated.trim()}`
          : 'Deprecated: This is deprecated by the API description.',
      );
    }
    const text = paragraphs.filter((x): x is string => !!x).join('\n\n');
    return text ? toGoComment(text).split('\n') : null;
  }

  protected override onWrite(builder: TBuilder): void {
    const lines = this.toLines();
    if (!lines) return;
    builder.ensureCurrentLineEmpty();
    for (const line of lines) builder.appendLine(line);
  }
}

const createDoc = <TBuilder extends SourceBuilder>(
  text?: Options<TBuilder>['text'],
  options?: Prettify<Omit<Options<TBuilder>, 'text'>>,
): GoDoc<TBuilder> => new GoDoc<TBuilder>({ ...options, text });

/**
 * Factory for creating doc comment nodes. The `write` function writes one or more doc comments to a builder.
 *
 * @param text The text of the comment. Blank lines separate paragraphs.
 * @param options The settings of the doc comment. See `GoDoc` for the available properties.
 * @example
 * ```ts
 * goDoc('Returns the pet with the given id.', { deprecated: 'Use GetPetByID.' });
 * // Emits:
 * // // Returns the pet with the given id.
 * // //
 * // // Deprecated: Use GetPetByID.
 * ```
 */
export const goDoc: typeof createDoc & { write: typeof writeGoNodes } = Object.assign(createDoc, {
  write: writeGoNodes,
});
