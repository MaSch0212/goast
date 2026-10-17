import { type AstNodeOptions, type Nullable, type Prettify, type SourceBuilder, spliceString } from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtNodes } from '../utils/write-kt-node.ts';
import { ktArgument } from './argument.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    value?: Nullable<string>;
    template?: Nullable<boolean>;
    multiline?: Nullable<boolean>;
    trimMargin?: Nullable<boolean>;
    marginPrefix?: Nullable<string>;
    autoAddMarginPrefix?: Nullable<boolean>;
  }
>;

/**
 * Represents a Kotlin string literal, such as `"Hello"`, or the `null` literal when the value is `null`.
 *
 * The value is escaped like a JSON string, and `$` is escaped so that it stays literal, unless `template` is set. A
 * multiline string is written as a raw string in triple quotes. Its line breaks are kept, and with `trimMargin` each
 * line is prefixed with `marginPrefix` and the string is followed by `.trimMargin()`.
 *
 * @template TBuilder The type of the source builder the string is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktString
 */
export class KtString<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The text of the string, escaped as described above. `null` writes the Kotlin `null` literal instead of a string.
   */
  public value: string | null;
  /**
   * Whether `${...}` placeholders in the value are kept as Kotlin string templates. Otherwise `$` is escaped as
   * `\$`, so the placeholder text is written literally.
   * @default false
   */
  public template: boolean;
  /**
   * Whether the string is written as a raw string in triple quotes. Line breaks in the value become line breaks in the
   * output, and without `trimMargin` the text is written in one piece.
   * @default false
   */
  public multiline: boolean;
  /**
   * Whether a multiline string starts on a new line and is followed by `.trimMargin()`, the Kotlin call that removes
   * the margin prefix at runtime. Has no effect on single-line strings.
   * @default true
   */
  public trimMargin: boolean;
  /**
   * The prefix written at the start of each line of a multiline string, and passed to `trimMargin` as its argument,
   * such as `.trimMargin("!")`. `null` uses `|` as the prefix and writes `.trimMargin()` without an argument.
   */
  public marginPrefix: string | null;
  /**
   * Whether the margin prefix is written at the start of each line of a multiline string. When `false`, the lines are
   * written as they are, and `.trimMargin()` is still appended.
   * @default true
   */
  public autoAddMarginPrefix: boolean;

  /**
   * Initializes a new instance of the KtString class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.value = options?.value ?? null;
    this.template = options?.template ?? false;
    this.multiline = options?.multiline ?? false;
    this.trimMargin = options?.trimMargin ?? true;
    this.marginPrefix = options?.marginPrefix ?? null;
    this.autoAddMarginPrefix = options?.autoAddMarginPrefix ?? true;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.value === null) {
      builder.append('null');
      return;
    }

    let value = JSON.stringify(this.value).slice(1, -1);
    if (this.multiline) {
      value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    }

    if (!this.template) {
      value = value.replace(/\$/g, '\\$');
    } else {
      const originalParts = this.findTemplateParts(this.value);
      const escapedParts = this.findTemplateParts(value);
      if (originalParts.length !== escapedParts.length) {
        throw new Error('Template parts count mismatch');
      }
      for (let i = originalParts.length - 1; i >= 0; i--) {
        const original = originalParts[i];
        const escaped = escapedParts[i];
        value = spliceString(value, escaped.index, escaped.value.length, original.value);
      }
    }

    builder.append(this.multiline ? '"""' + (this.trimMargin ? '\n' : '') : '"');

    if (this.multiline && this.trimMargin) {
      builder.indent((b) => {
        if (this.autoAddMarginPrefix) {
          b.appendWithLinePrefix(this.marginPrefix ?? '|', value);
        } else {
          b.append(value);
        }

        b.append('\n""".trimMargin');
        ktArgument.write(b, [this.marginPrefix ? new KtString<TBuilder>({ value: this.marginPrefix }) : null]);
      });
    } else {
      builder.append(value, this.multiline ? '"""' : '"');
    }
  }

  protected findTemplateParts(value: string): { value: string; index: number }[] {
    const parts: { value: string; index: number }[] = [];
    let start: number | undefined = undefined;
    let bracketCount = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === '$' && value[i + 1] === '{') {
        start = i;
      } else if (value[i] === '{') {
        bracketCount++;
      } else if (value[i] === '}') {
        bracketCount--;
        if (bracketCount === 0 && start !== undefined) {
          parts.push({ value: value.slice(start, i + 1), index: start });
          start = undefined;
        }
      }
    }
    return parts;
  }
}

const createString = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value'>>,
): KtString<TBuilder> => new KtString<TBuilder>({ ...options, value });

/**
 * Factory for creating string nodes. The `write` function writes one or more string nodes to a builder.
 *
 * @param value The text of the string, or `null` for the Kotlin `null` literal.
 * @param options The settings of the string. See `KtString` for the available properties.
 * @example
 * ```ts
 * ktString('first line\nsecond line', { multiline: true });
 * // Emits:
 * // """
 * //     |first line
 * //     |second line
 * //     """.trimMargin()
 * ```
 */
export const ktString: typeof createString & { write: typeof writeKtNodes } = Object.assign(createString, {
  write: writeKtNodes,
});
