import { EOL } from 'os';
import { StringBuilder, StringBuilderOptions } from './string.utils.js';
import { Nullable } from '../type.utils.js';

export type IndentOptions =
  | { readonly type: 'tabs' }
  | { readonly type: 'spaces'; readonly count: number };

export type SourceBuilderOptions = StringBuilderOptions & {
  readonly indent: IndentOptions;
  readonly charsTreatedAsEmptyLine: string[];
};

const defaultOptions: SourceBuilderOptions = {
  indent: { type: 'spaces', count: 2 },
  newLine: EOL,
  charsTreatedAsEmptyLine: ['{'],
};

/**
 * Represents an in-memory source file.
 */
export class SourceBuilder extends StringBuilder {
  private readonly __options: SourceBuilderOptions;
  private readonly _emptyLineCharRegex: RegExp;
  private readonly _indentString: string;

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
    this.__options = { ...defaultOptions, ...options };
    this._emptyLineCharRegex = new RegExp(
      `[\\s${this.__options.charsTreatedAsEmptyLine.join('')}]`
    );
    this._indentString =
      this.__options.indent.type === 'tabs' ? '\t' : ' '.repeat(this.__options.indent.count);
  }

  /**
   * Appends one or more strings to the end of the current StringBuilder.
   * @param value The string(s) to append.
   * @returns The current StringBuilder.
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
          super.append(str.substring(lineStartIndex, i - 1));
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

    super.append(str.substring(lineStartIndex));
    return this;
  }

  /**
   * Ensures that the current line is empty or consists only of whitespace characters.
   * @returns A reference to this instance.
   */
  public ensurePreviousLineEmpty(): this {
    if (this._isLineIndented) {
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
    if (this._isLineIndented) {
      this.appendLine();
    }

    return this;
  }

  /**
   * Adds one indentation level. If the current line already contains characters, only subsequent lines are affected.
   * @param builderFn The function to add indented content.
   * @returns A reference to this instance.
   */
  public indent(builderFn: (builder: SourceBuilder) => void): this {
    this.currentIndentLevel++;
    try {
      builderFn(this);
    } finally {
      this.currentIndentLevel--;
    }

    return this;
  }

  private appendIndent(): void {
    super.append(this._indentString.repeat(this.currentIndentLevel));
  }
}
