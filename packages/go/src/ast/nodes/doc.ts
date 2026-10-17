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

/** A doc comment: `//` lines directly above a declaration. Writes nothing when there is no text. */
export class GoDoc<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public text: string | null;
  public deprecated: boolean | string;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.text = options.text?.trim() || null;
    this.deprecated = options.deprecated ?? false;
  }

  /** The comment lines, or `null` if there is nothing to write. */
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

export const goDoc: typeof createDoc & { write: typeof writeGoNodes } = Object.assign(createDoc, {
  write: writeGoNodes,
});
