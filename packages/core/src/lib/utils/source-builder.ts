import { EOL } from 'os';

import { Condition, evalCondition } from './condition';
import { BuilderFn, StringBuilder, StringBuilderOptions, TextOrBuilderFn } from './string.utils';
import { Nullable } from './type.utils';

export type IndentOptions = { readonly type: 'tabs' } | { readonly type: 'spaces'; readonly count: number };

export type SourceBuilderOptions = StringBuilderOptions & {
  indent: IndentOptions;
  charsTreatedAsEmptyLine: string[];
};

export const defaultSourceBuilderOptions: SourceBuilderOptions = {
  indent: { type: 'spaces', count: 2 },
  newLine: EOL,
  charsTreatedAsEmptyLine: ['{'],
};

type KnownParatheses = '()' | '[]' | '{}' | '<>';
export type Paratheses =
  | KnownParatheses
  | Omit<string, KnownParatheses>
  | [open: Nullable<string>, close: Nullable<string>];

export type SeparatorBuidlerFn<TBuilder extends SourceBuilder, TItem> = (
  builder: TBuilder,
  previousItem: TItem,
  nextItem: TItem,
  previousItemIndex: number,
  nextItemIndex: number
) => void;
export type Separator<TBuilder extends SourceBuilder, TItem> = string | SeparatorBuidlerFn<TBuilder, TItem>;

/**
 * Options for the `parenthesize` methods of the `SourceBuilder`.
 * @see SourceBuilder.parenthesize
 * @see SourceBuilder.parenthesizeIf
 */
export type ParenthesizeOptions = {
  /**
   * Whether to add line breaks after start and before end of the parentheses. Defaults to `false`.
   */
  readonly multiline?: boolean;
  /**
   * Whether to indent the content inside parentheses. Defaults to `true`.
   */
  readonly indent?: boolean;
};

/**
 * Options for the `forEach` methods of the `SourceBuilder`.
 * @see SourceBuilder.forEach
 * @see SourceBuilder.forEachIf
 */
export type ForEachOptions<TBuilder extends SourceBuilder, TItem> = {
  /**
   * The condition to check before adding content for each item. Defaults to `true`.
   */
  readonly condition?: Condition<TItem>;
  /**
   * The seperator to add between items. Default to `undefined`.
   */
  readonly separator?: Separator<TBuilder, TItem>;
};

/**
 * Represents an in-memory source file.
 */
export class SourceBuilder extends StringBuilder {
  private readonly __options: SourceBuilderOptions;
  private readonly _emptyLineCharRegex: RegExp;
  private readonly _indentString: string;

  private _linePrefix: string = '';
  private _isLineIndented: boolean = false;
  private _isLastLineEmpty: boolean = true;
  private _isCurrentLineEmpty: boolean = true;

  /**
   * Gets or sets the current indentation level.
   */
  public currentIndentLevel: number = 0;

  /**
   * Gets the options used by this instance.
   */
  public override get options(): SourceBuilderOptions {
    return this.__options;
  }

  /**
   * Initializes a new instance of the SourceBuilder class.
   * @param options The options to use for this instance.
   */
  constructor(options?: Partial<SourceBuilderOptions>) {
    super(options);
    this.__options = { ...defaultSourceBuilderOptions, ...options };
    this._emptyLineCharRegex = new RegExp(`[\\s${this.__options.charsTreatedAsEmptyLine.join('')}]`);
    this._indentString = this.__options.indent.type === 'tabs' ? '\t' : ' '.repeat(this.__options.indent.count);
  }

  /**
   * Creates a new instance of the SourceBuilder class from a string.
   * @param str The string to use as the initial content of the builder.
   * @param options The options to use for this instance.
   * @returns A new instance of the SourceBuilder class.
   */
  public static override fromString(str: string, options?: Partial<SourceBuilderOptions>): SourceBuilder {
    const builder = new SourceBuilder(options);
    builder.append(str);
    return builder;
  }

  /**
   * Builds a string using a callback function that receives a `SourceBuilder` instance.
   * @param buildAction The callback function that receives a `SourceBuilder` instance to build the string.
   * @param options The options to use for the `SourceBuilder` instance.
   * @returns The string built by the `SourceBuilder` instance.
   */
  public static override build(buildAction: BuilderFn<SourceBuilder>, options?: Partial<SourceBuilderOptions>): string {
    const builder = new SourceBuilder(options);
    buildAction(builder);
    return builder.toString();
  }

  /**
   * Appends one or more strings to the end of the current SourceBuilder.
   * @param value The string(s) to append.
   * @returns The current SourceBuilder.
   */
  public override append(...value: Nullable<TextOrBuilderFn<this>>[]): this {
    for (const str of value) {
      if (!str) continue;
      if (typeof str === 'function') {
        str(this);
        continue;
      }

      let lineStartIndex = 0;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === '\r') continue;

        if (str[i] === '\n') {
          let lineLength = i - lineStartIndex;
          for (let j = i; j > 0 && str[j - 1] === '\r'; j--) {
            lineLength--;
          }

          if (lineLength > 0) {
            if (!this._isLineIndented) {
              this.appendIndent();
            }
            super.append(str.substring(lineStartIndex, i).replace(/\r/g, ''));
          }

          this._isLastLineEmpty = this._isCurrentLineEmpty;
          super.append(this.__options.newLine);
          this._isCurrentLineEmpty = true;
          this._isLineIndented = false;

          lineStartIndex = i + 1;
        }

        if (!this._emptyLineCharRegex.test(str[i])) {
          this._isCurrentLineEmpty = false;
        }
      }

      if (!this._isLineIndented && lineStartIndex < str.length) {
        this.appendIndent();
        this._isLineIndented = true;
      }

      super.append(str.substring(lineStartIndex).replace(/\r/g, ''));
    }
    return this;
  }

  /**
   * Appends one or more strings to the end of the current SourceBuilder if the specified condition is true.
   * @param condition The condition to check before appending the specified value.
   * @param value The string(s) to append.
   * @returns The current SourceBuilder.
   */
  public appendIf(condition: Condition, ...value: Nullable<TextOrBuilderFn<this>>[]): this {
    return this.if(condition, (builder) => builder.append(...value));
  }

  /**
   * Appends one or more strings to the end of the current SourceBuilder, followed by a line terminator.
   * @param value The string(s) to append.
   * @returns The current SourceBuilder.
   */
  public override appendLine(...value: Nullable<TextOrBuilderFn<this>>[]): this {
    return this.append(...value, '\n');
  }

  /**
   * Appends one or more strings to the end of the current SourceBuilder, followed by a line terminator, if the specified condition is true.
   * @param condition The condition to check before appending the specified value.
   * @param value The string(s) to append.
   * @returns The current SourceBuilder.
   */
  public appendLineIf(condition: Condition, ...value: Nullable<TextOrBuilderFn<this>>[]): this {
    return this.if(condition, (builder) => builder.appendLine(...value));
  }

  /**
   * Appends the specified values to this source builder with the specified line prefix.
   * @param {string} prefix - The line prefix to use.
   * @param {...(string|null|undefined)} value - The values to append.
   * @returns {SourceBuilder} This source builder instance.
   */
  public appendWithLinePrefix(prefix: string, ...value: Nullable<TextOrBuilderFn<this>>[]): this {
    const previousLinePrefix = this._linePrefix;
    this._linePrefix += prefix;
    try {
      this.append(...value);
    } finally {
      this._linePrefix = previousLinePrefix;
    }

    return this;
  }

  /**
   * Appends the specified values to this source builder as a new line with the specified line prefix.
   * @param {string} prefix - The line prefix to use.
   * @param {...(string|null|undefined)} value - The values to append.
   * @returns {SourceBuilder} This source builder instance.
   */
  public appendLineWithLinePrefix(prefix: string, ...value: Nullable<TextOrBuilderFn<this>>[]): this {
    return this.appendWithLinePrefix(prefix, ...value, '\n');
  }

  /**
   * Prepends one or more strings to the beginning of the current SourceBuilder if the specified condition is true.
   * @param condition The condition to check before prepending the specified value.
   * @param value The string(s) to prepend.
   * @returns The current SourceBuilder.
   */
  public prependIf(condition: Condition, ...value: Nullable<TextOrBuilderFn<StringBuilder>>[]): this {
    return this.if(condition, (builder) => builder.prepend(...value));
  }

  /**
   * Prepends one or more strings to the beginning of the current SourceBuilder, followed by a line terminator, if the specified condition is true.
   * @param condition The condition to check before appending the specified value.
   * @param value The string(s) to prepend.
   * @returns The current SourceBuilder.
   */
  public prependLineIf(condition: Condition, ...value: Nullable<TextOrBuilderFn<StringBuilder>>[]): this {
    return this.if(condition, (builder) => builder.prependLine(...value));
  }

  /**
   * Ensures that the current line is empty or consists only of whitespace characters.
   * @returns A reference to this instance.
   */
  public ensurePreviousLineEmpty(): this {
    if (!this._isCurrentLineEmpty) {
      this.appendLine();
    }
    if (!this._isLastLineEmpty) {
      this.appendLine();
    }

    return this;
  }

  /**
   * Ensures that the current line is empty or consists only of whitespace characters.
   * @returns A reference to this instance.
   */
  public ensureCurrentLineEmpty(): this {
    if (!this._isCurrentLineEmpty) {
      this.appendLine();
    }

    return this;
  }

  /**
   * Inserts specified content if the specified condition is true.
   * @param condition The condition to check before inserting content.
   * @param builderFn The function to add content if the condition is true.
   * @param elseBuilderFn The function to add content if the condition is false.
   * @returns A reference to this instance.
   */
  public if(condition: Condition, builderFn: BuilderFn<this>, elseBuilderFn?: BuilderFn<this>): this {
    if (evalCondition(condition)) {
      builderFn(this);
    } else {
      elseBuilderFn?.(this);
    }

    return this;
  }

  /**
   * Adds one indentation level. If the current line already contains characters, only subsequent lines are affected.
   * @param builderFn The function to add indented content or the content itself.
   * @param condition The condition to check before adding indentation.
   * @returns A reference to this instance.
   */
  public indent(value: Nullable<TextOrBuilderFn<this>>): this {
    this.currentIndentLevel++;
    try {
      this.append(value);
    } finally {
      this.currentIndentLevel--;
    }

    return this;
  }

  /**
   * Adds one indentation level if the specified condition is true. If the current line already contains characters, only subsequent lines are affected.
   * @param builderFn The function to add indented content or the content itself.
   * @param condition The condition to check before adding indentation.
   * @returns A reference to this instance.
   */
  public indentIf(condition: Condition, value: Nullable<TextOrBuilderFn<this>>): this {
    return this.if(
      condition,
      (builder) => builder.indent(value),
      (builder) => builder.append(value)
    );
  }

  /**
   * Adds parentheses around the specified content.
   * @param brackets The brackets to use.
   * @param value The function to add content inside parentheses or one string that should be parenthesized.
   * @param options Options for the parentheses.
   * @returns A reference to this instance.
   */
  public parenthesize(
    brackets: Paratheses,
    value: Nullable<TextOrBuilderFn<this>>,
    options?: ParenthesizeOptions
  ): this {
    return this.if(
      options?.multiline ?? false,
      (b) => b.appendLine(brackets[0] ?? ''),
      (b) => b.append(brackets[0] ?? '')
    )
      .indentIf(options?.indent ?? true, value)
      .if(options?.multiline ?? false, (b) => b.ensureCurrentLineEmpty())
      .append(brackets[1] ?? '');
  }

  /**
   * Adds parentheses around the specified content if the specified condition is true.
   * @param condition The condition to check before adding parentheses.
   * @param brackets The brackets to use.
   * @param value The function to add content inside parentheses or one string that should be parenthesized.
   * @param options Options for the parentheses.
   * @returns A reference to this instance.
   */
  public parenthesizeIf(
    condition: Condition,
    brackets: Paratheses,
    value: TextOrBuilderFn<this>,
    options?: ParenthesizeOptions
  ): this {
    return this.if(
      condition,
      (builder) => builder.parenthesize(brackets, value, options),
      (builder) => builder.indentIf(options?.indent ?? true, value)
    );
  }

  /**
   * Adds content for each item in the specified array.
   * @param items The items to add content for.
   * @param builderFn The function to add content for each item.
   * @param options The options for the loop.
   * @returns A reference to this instance.
   */
  public forEach<T>(
    items: Iterable<T>,
    builderFn: (builder: this, item: T, index: number) => void,
    options?: ForEachOptions<this, T>
  ): this {
    const condition = options?.condition ?? true;
    if (options?.condition === false) return this;
    const seperator = options?.separator;
    let previousIndex: number = -1;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let previousItem: T = undefined!;
    let index = 0;
    for (const item of items) {
      if (evalCondition(condition, item)) {
        if (previousIndex >= 0 && seperator) {
          if (typeof seperator === 'string') {
            this.append(seperator);
          } else {
            seperator(this, previousItem, item, previousIndex, index);
          }
        }
        builderFn(this, item, index);
        previousIndex = index;
        previousItem = item;
      }
      index++;
    }
    return this;
  }

  public forEachIf<T>(
    items: Iterable<T>,
    condition: Condition,
    builderFn: (builder: this, item: T, index: number) => void,
    options?: ForEachOptions<this, T>
  ): this {
    return this.if(condition, (b) => b.forEach(items, builderFn, options));
  }

  private appendIndent(): void {
    super.append(this._indentString.repeat(this.currentIndentLevel));
    if (this._linePrefix) {
      super.append(this._linePrefix);
    }
  }
}
