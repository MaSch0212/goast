import { EOL } from 'os';

import { Condition, evalCondition } from './condition.js';
import { StringBuilder, StringBuilderOptions } from './string.utils';
import { Nullable } from '../type.utils.js';

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
 * Represents an in-memory source file.
 */
export class SourceBuilder extends StringBuilder {
  private readonly __options: SourceBuilderOptions;
  private readonly _emptyLineCharRegex: RegExp;
  private readonly _indentString: string;
  private readonly _state: Record<string, unknown> = {};

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
  public static override build(
    buildAction: (builder: SourceBuilder) => void,
    options?: Partial<SourceBuilderOptions>
  ): string {
    const builder = new SourceBuilder(options);
    buildAction(builder);
    return builder.toString();
  }

  /**
   * Appends one or more strings to the end of the current SourceBuilder.
   * @param value The string(s) to append.
   * @returns The current SourceBuilder.
   */
  public override append(...value: Nullable<string>[]): this {
    if (value.length === 0 || !value.some((v) => v && v.length > 0)) {
      return this;
    }

    const str = value.join('');

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
    return this;
  }

  /**
   * Appends one or more strings to the end of the current SourceBuilder, followed by a line terminator.
   * @param value The string(s) to append.
   * @returns The current SourceBuilder.
   */
  public override appendLine(...value: Nullable<string>[]): this {
    return this.append(...value, '\n');
  }

  /**
   * Appends one or more strings to the end of the current SourceBuilder if the specified condition is true.
   * @param condition The condition to check before appending the specified value.
   * @param value The string(s) to append.
   * @returns The current SourceBuilder.
   */
  public appendIf(condition: Condition, ...value: Nullable<string>[]): this {
    return evalCondition(condition) ? this.append(...value) : this;
  }

  /**
   * Appends one or more strings to the end of the current SourceBuilder, followed by a line terminator, if the specified condition is true.
   * @param condition The condition to check before appending the specified value.
   * @param value The string(s) to append.
   * @returns The current SourceBuilder.
   */
  public appendLineIf(condition: Condition, ...value: Nullable<string>[]): this {
    return evalCondition(condition) ? this.appendLine(...value) : this;
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
   * @param builderFn The function to add content.
   * @returns A reference to this instance.
   */
  public if(condition: Condition, builderFn: (builder: this) => void): this {
    if (evalCondition(condition)) {
      builderFn(this);
    }

    return this;
  }

  /**
   * Inserts specified content depending on the specified condition.
   * @param condition The condition to check before inserting content.
   * @param builderFn The function to add content if the condition is true.
   * @param elseBuilderFn The function to add content if the condition is false.
   * @returns A reference to this instance.
   */
  public ifElse(
    condition: Condition,
    builderFn: (builder: this) => void,
    elseBuilderFn: (builder: this) => void
  ): this {
    if (evalCondition(condition)) {
      builderFn(this);
    } else {
      elseBuilderFn(this);
    }

    return this;
  }

  /**
   * Adds one indentation level. If the current line already contains characters, only subsequent lines are affected.
   * @param builderFn The function to add indented content.
   * @param condition The condition to check before adding indentation.
   * @returns A reference to this instance.
   */
  public indent(builderFn: (builder: this) => void, condition: Condition = true): this {
    const shouldIndent = evalCondition(condition);
    if (shouldIndent) {
      this.currentIndentLevel++;
    }
    try {
      builderFn(this);
    } finally {
      if (shouldIndent) {
        this.currentIndentLevel--;
      }
    }

    return this;
  }

  /**
   * Adds parentheses around the specified content and adds one indentation level.
   * @param brackets The brackets to use.
   * @param builderFn The function to add content inside parentheses.
   * @param indent Whether to indent the content inside parentheses. Defaults to `true`.
   * @returns A reference to this instance.
   */
  public parenthesize(brackets: Paratheses, builderFn: (builder: this) => void, indent: boolean = true): this {
    this.append(brackets[0] ?? '');
    this.indent(builderFn, indent);
    this.append(brackets[1] ?? '');

    return this;
  }

  /**
   * Adds parentheses around the specified content if the specified condition is true.
   * @param condition The condition to check before adding parentheses.
   * @param brackets The brackets to use.
   * @param builderFn The function to add content inside parentheses.
   * @param indent Whether to indent the content inside parentheses. Defaults to `true`.
   * @returns A reference to this instance.
   */
  public parenthesizeIf(
    condition: Condition,
    brackets: Paratheses,
    builderFn: (builder: this) => void,
    indent?: boolean
  ): this {
    if (evalCondition(condition)) {
      this.parenthesize(brackets, builderFn, indent ?? true);
    } else {
      this.indent(builderFn, indent ?? false);
    }

    return this;
  }

  /**
   * Adds content for each item in the specified array.
   * @param items The items to add content for.
   * @param builderFn The function to add content for each item.
   * @returns A reference to this instance.
   */
  public forEach<T>(items: Iterable<T>, builderFn: (builder: this, item: T, index: number) => void): this {
    return this.forEachImpl(items, builderFn);
  }

  /**
   * Adds content for each item in the specified array.
   * @param items The items to add content for.
   * @param condition The condition to check before adding content.
   * @param builderFn The function to add content for each item.
   * @returns A reference to this instance.
   */
  public forEachIf<T>(
    items: Iterable<T>,
    condition: Condition,
    builderFn: (builder: this, item: T, index: number) => void
  ): this {
    return evalCondition(condition) ? this.forEachImpl(items, builderFn) : this;
  }

  /**
   * Adds content for each item in the specified array.
   * @param items The items to add content for.
   * @param condition The condition to check before adding content for each item.
   * @param builderFn The function to add content for each item.
   * @returns A reference to this instance.
   */
  public forEachMatching<T>(
    items: Iterable<T>,
    condition: Condition<T>,
    builderFn: (builder: this, item: T, index: number) => void
  ): this {
    return this.forEachImpl(items, builderFn, undefined, condition);
  }

  /**
   * Adds content for each item in the specified array.
   * @param items The items to add content for.
   * @param seperator The seperator to add between items.
   * @param builderFn The function to add content for each item.
   * @returns A reference to this instance.
   */
  public forEachSeparated<T>(
    items: Iterable<T>,
    seperator: Separator<this, T>,
    builderFn: (builder: this, item: T, index: number) => void
  ): this {
    return this.forEachImpl(items, builderFn, seperator);
  }

  /**
   * Adds content for each item in the specified array.
   * @param items The items to add content for.
   * @param condition The condition to check before adding content for each item.
   * @param seperator The seperator to add between items.
   * @param builderFn The function to add content for each item.
   * @returns A reference to this instance.
   */
  public forEachMatchingSeparated<T>(
    items: Iterable<T>,
    condition: Condition<T>,
    seperator: Separator<this, T>,
    builderFn: (builder: this, item: T, index: number) => void
  ): this {
    return this.forEachImpl(items, builderFn, seperator, condition);
  }

  private forEachImpl<T>(
    items: Iterable<T>,
    builderFn: (builder: this, item: T, index: number) => void,
    seperator?: Separator<this, T>,
    condition: Condition<T> = true
  ): this {
    if (condition === false) return this;
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

  private appendIndent(): void {
    super.append(this._indentString.repeat(this.currentIndentLevel));
  }
}
