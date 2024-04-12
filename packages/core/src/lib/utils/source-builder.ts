import { EOL } from 'os';

import { isNullish } from './common.utils';
import { Condition, evalCondition } from './condition';
import { AppendParam, AppendValue, StringBuilder, StringBuilderOptions } from './string-builder';
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
export type Paratheses<TBuilder extends StringBuilder> =
  | KnownParatheses
  | Omit<string, KnownParatheses>
  | [open: Nullable<AppendValue<TBuilder>>, close: Nullable<AppendValue<TBuilder>>];

export type SeparatorBuidlerFn<TBuilder, TItem> = (
  builder: TBuilder,
  previousItem: TItem,
  nextItem: TItem,
  previousItemIndex: number,
  nextItemIndex: number,
) => void;
export type Separator<TBuilder, TItem> = string | SeparatorBuidlerFn<TBuilder, TItem>;

/**
 * Options for the `parenthesize` methods of the `SourceBuilder`.
 * @see SourceBuilder.parenthesize
 * @see SourceBuilder.parenthesizeIf
 */
export type ParenthesizeOptions = {
  /**
   * Whether to add line breaks after start and before end of the parentheses.
   * @default false
   */
  readonly multiline?: boolean;
  /**
   * Whether to indent the content inside parentheses.
   * @default true
   */
  readonly indent?: boolean;
  /**
   * Whether to pretend that the current line and the one before is empty or consists only of whitespace characters.
   * This is useful when the parentheses are used as a block and `ensurePreviousLineEmpty` is used.
   * @default true
   */
  readonly pretendEmpty?: boolean;
};

/**
 * Options for the `forEach` methods of the `SourceBuilder`.
 * @see SourceBuilder.forEach
 * @see SourceBuilder.forEachIf
 */
export type ForEachOptions<TBuilder, TItem> = {
  /**
   * The condition to check before adding content for each item. Defaults to `true`.
   */
  readonly condition?: Condition<TItem>;
  /**
   * The seperator to add between items. Default to `undefined`.
   */
  readonly separator?: Separator<TBuilder, TItem>;
};

type SwitchCase<TValue, TBuilder extends StringBuilder> = {
  case: TValue;
  value: AppendValue<TBuilder>;
};

type LinePrefixNode = {
  kind: 'indent' | 'prefix';
  chars: string;
};

/**
 * Represents an in-memory source file.
 */
export class SourceBuilder<TAdditionalAppends = never> extends StringBuilder<TAdditionalAppends> {
  private readonly __options: SourceBuilderOptions;
  private readonly _emptyLineCharRegex: RegExp;
  private readonly _indentString: string;

  private _isLineIndented: boolean = false;
  private _isLastLineEmpty: boolean = true;
  private _isCurrentLineEmpty: boolean = true;
  private _linePrefixNodes: LinePrefixNode[] = [];

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
    buildAction: AppendParam<SourceBuilder, never>,
    options?: Partial<SourceBuilderOptions>,
  ): string {
    const builder = new SourceBuilder(options);
    builder.append(buildAction);
    return builder.toString();
  }

  protected override appendSingle(value: AppendParam<this, TAdditionalAppends>) {
    if (isNullish(value)) return;
    if (Array.isArray(value)) {
      for (const part of value) {
        this.appendSingle(part);
      }
      return;
    }
    if (typeof value === 'function') {
      (value as (builder: this) => void)(this);
      return;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      value = value.toString();
    }
    if (typeof value === 'object' && value !== null && '__type' in value && value.__type === 'append-value-group') {
      this.forEach(value.values, (builder, part) => builder.append(part), { separator: value.separator ?? undefined });
      return;
    }
    if (typeof value !== 'string') {
      return;
    }

    let lineStartIndex = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === '\r') continue;

      if (value[i] === '\n') {
        let lineLength = i - lineStartIndex;
        for (let j = i; j > 0 && value[j - 1] === '\r'; j--) {
          lineLength--;
        }

        if (lineLength > 0) {
          if (!this._isLineIndented) {
            this.appendIndent();
          }
          super.appendSingle(value.substring(lineStartIndex, i).replace(/\r/g, ''));
        }

        this._isLastLineEmpty = this._isCurrentLineEmpty;
        if (this._isCurrentLineEmpty && this._linePrefixNodes.some((x) => x.kind !== 'indent')) {
          this.appendIndent(true);
        }
        super.appendSingle(this.__options.newLine);
        this._isLineIndented = false;
        this._isCurrentLineEmpty = true;

        lineStartIndex = i + 1;
      }

      if (!this._emptyLineCharRegex.test(value[i])) {
        this._isCurrentLineEmpty = false;
      }
    }

    if (!this._isLineIndented && lineStartIndex < value.length) {
      this.appendIndent();
      this._isLineIndented = true;
    }

    super.appendSingle(value.substring(lineStartIndex).replace(/\r/g, ''));
  }

  /**
   * Appends one or more strings to the end of the current SourceBuilder if the specified condition is true.
   * @param condition The condition to check before appending the specified value.
   * @param value The string(s) to append.
   * @returns The current SourceBuilder.
   */
  public appendIf(condition: Condition, ...value: AppendParam<this, TAdditionalAppends>[]): this {
    if (evalCondition(condition)) {
      return this.append(...value);
    }
    return this;
  }

  /**
   * Appends one or more strings to the end of the current SourceBuilder, followed by a line terminator.
   * @param value The string(s) to append.
   * @returns The current SourceBuilder.
   */
  public override appendLine(...value: AppendParam<this, TAdditionalAppends>[]): this {
    return this.append(...value, '\n');
  }

  /**
   * Appends one or more strings to the end of the current SourceBuilder, followed by a line terminator, if the specified condition is true.
   * @param condition The condition to check before appending the specified value.
   * @param value The string(s) to append.
   * @returns The current SourceBuilder.
   */
  public appendLineIf(condition: Condition, ...value: AppendParam<this, TAdditionalAppends>[]): this {
    if (evalCondition(condition)) {
      return this.appendLine(...value);
    }
    return this;
  }

  /**
   * Appends the specified values to this source builder with the specified line prefix.
   * @param {string} prefix - The line prefix to use.
   * @param {...(string|null|undefined)} value - The values to append.
   * @returns {SourceBuilder} This source builder instance.
   */
  public appendWithLinePrefix(prefix: string, ...value: AppendParam<this, TAdditionalAppends>[]): this {
    this._linePrefixNodes.push({ chars: prefix, kind: 'prefix' });
    try {
      this.append(...value);
    } finally {
      this._linePrefixNodes.pop();
    }

    return this;
  }

  /**
   * Appends the specified values to this source builder as a new line with the specified line prefix.
   * @param {string} prefix - The line prefix to use.
   * @param {...(string|null|undefined)} value - The values to append.
   * @returns {SourceBuilder} This source builder instance.
   */
  public appendLineWithLinePrefix(prefix: string, ...value: AppendParam<this, TAdditionalAppends>[]): this {
    return this.appendWithLinePrefix(prefix, ...value, '\n');
  }

  /**
   * Prepends one or more strings to the beginning of the current SourceBuilder if the specified condition is true.
   * @param condition The condition to check before prepending the specified value.
   * @param value The string(s) to prepend.
   * @returns The current SourceBuilder.
   */
  public prependIf(condition: Condition, ...value: AppendParam<StringBuilder, never>[]): this {
    if (evalCondition(condition)) {
      this.prepend(...value);
    }
    return this;
  }

  /**
   * Prepends one or more strings to the beginning of the current SourceBuilder, followed by a line terminator, if the specified condition is true.
   * @param condition The condition to check before appending the specified value.
   * @param value The string(s) to prepend.
   * @returns The current SourceBuilder.
   */
  public prependLineIf(condition: Condition, ...value: AppendParam<StringBuilder, never>[]): this {
    if (evalCondition(condition)) {
      this.prependLine(...value);
    }
    return this;
  }

  /**
   * Ensures that the current line and the one before is empty or consists only of whitespace characters.
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
   * Pretends that the current line and the one before is empty or consists only of whitespace characters.
   * @returns A reference to this instance.
   */
  public pretendPreviousLineEmpty(): this {
    this._isLastLineEmpty = true;
    this._isCurrentLineEmpty = true;
    return this;
  }

  /**
   * Pretends that the current line is empty or consists only of whitespace characters.
   * @returns A reference to this instance.
   */
  public pretendCurrentLineEmpty(): this {
    this._isCurrentLineEmpty = true;
    return this;
  }

  /**
   * Inserts specified content if the specified condition is true.
   * @param condition The condition to check before inserting content.
   * @param builderFn The function to add content if the condition is true.
   * @param elseBuilderFn The function to add content if the condition is false.
   * @returns A reference to this instance.
   */
  public if(
    condition: Condition,
    builderFn: AppendParam<this, TAdditionalAppends>,
    elseBuilderFn?: AppendParam<this, TAdditionalAppends>,
  ): this {
    return evalCondition(condition) ? this.append(builderFn) : this.append(elseBuilderFn);
  }

  public switch<T extends string | number>(
    value: T,
    cases: Record<T, AppendParam<this, TAdditionalAppends>>,
    defaultBuilderFn?: AppendParam<this, TAdditionalAppends>,
  ): this;
  public switch<T>(
    value: T,
    cases: SwitchCase<T, this>[],
    defaultBuilderFn?: AppendParam<this, TAdditionalAppends>,
    equals?: (a: T, b: T) => boolean,
  ): this;
  public switch<T>(
    value: T,
    cases: Record<string | number, AppendParam<this, TAdditionalAppends>> | SwitchCase<T, this>[],
    defaultBuilderFn?: AppendParam<this, TAdditionalAppends>,
    equals?: (a: T, b: T) => boolean,
  ): this {
    if ((typeof value === 'string' || typeof value === 'number') && !Array.isArray(cases)) {
      return this.append(cases[value] ?? defaultBuilderFn);
    } else if (Array.isArray(cases)) {
      for (const c of cases) {
        if (equals ? equals(value, c.case) : value === c.case) {
          return this.append(c.value);
        }
      }
      return this.append(defaultBuilderFn);
    }

    return this;
  }

  /**
   * Adds one indentation level. If the current line already contains characters, only subsequent lines are affected.
   * @param builderFn The function to add indented content or the content itself.
   * @param condition The condition to check before adding indentation.
   * @returns A reference to this instance.
   */
  public indent(value: AppendParam<this, TAdditionalAppends>): this {
    this._linePrefixNodes.push({ chars: this._indentString, kind: 'indent' });
    try {
      this.append(value);
    } finally {
      this._linePrefixNodes.pop();
    }

    return this;
  }

  /**
   * Adds one indentation level if the specified condition is true. If the current line already contains characters, only subsequent lines are affected.
   * @param builderFn The function to add indented content or the content itself.
   * @param condition The condition to check before adding indentation.
   * @returns A reference to this instance.
   */
  public indentIf(condition: Condition, value: AppendParam<this, TAdditionalAppends>): this {
    return evalCondition(condition) ? this.indent(value) : this.append(value);
  }

  /**
   * Adds parentheses around the specified content.
   * @param brackets The brackets to use.
   * @param value The function to add content inside parentheses or one string that should be parenthesized.
   * @param options Options for the parentheses.
   * @returns A reference to this instance.
   */
  public parenthesize(
    brackets: Paratheses<this>,
    value: AppendParam<this, TAdditionalAppends>,
    options?: ParenthesizeOptions,
  ): this {
    const multiline = options?.multiline ?? false;
    const indent = options?.indent ?? true;
    const pretendEmpty = options?.pretendEmpty ?? true;

    if (multiline) {
      this.appendLine(brackets[0] ?? '');
    } else {
      this.append(brackets[0] ?? '');
    }

    if (pretendEmpty) this.pretendPreviousLineEmpty();

    if (indent !== false) {
      this.indent(value);
    } else {
      this.append(value);
    }

    if (multiline) this.ensureCurrentLineEmpty();
    this.append(brackets[1] ?? '');

    return this;
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
    brackets: Paratheses<this>,
    value: AppendParam<this, TAdditionalAppends>,
    options?: ParenthesizeOptions,
  ): this {
    if (evalCondition(condition)) {
      return this.parenthesize(brackets, value, options);
    } else if (options?.indent) {
      return this.indent(value);
    } else {
      return this.append(value);
    }
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
    options?: ForEachOptions<this, T>,
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
    condition: Condition,
    items: Iterable<T>,
    builderFn: (builder: this, item: T, index: number) => void,
    options?: ForEachOptions<this, T>,
  ): this {
    if (evalCondition(condition)) {
      return this.forEach(items, builderFn, options);
    }
    return this;
  }

  public appendSeparated(items: Iterable<AppendParam<this, TAdditionalAppends>>, separator: string): this {
    return this.forEach(items, (builder, item) => builder.append(item), { separator });
  }

  public appendSeparatedIf(
    condition: Condition,
    items: Iterable<AppendParam<this, TAdditionalAppends>>,
    separator: string,
  ): this {
    if (evalCondition(condition)) {
      return this.appendSeparated(items, separator);
    }
    return this;
  }

  private appendIndent(trimEnd?: boolean): void {
    let prefix = this._linePrefixNodes.map((n) => n.chars).join('');
    if (trimEnd) {
      prefix = prefix.trimEnd();
    }
    super.appendSingle(prefix);
  }
}
