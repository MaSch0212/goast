import { StringBuilderOptions, defaultStringBuilderOptions } from './options';
import { AppendValue } from './utils';
import { isNullish } from '../common.utils';
import { Nullable, SingleOrMultiple } from '../type.utils';

export type BuilderFn<TBuilder extends StringBuilder> = (builder: TBuilder) => void;
export type Primitive = string | number | boolean;

export type AppendParam<TBuilder extends StringBuilder, TAdditionalAppends> = SingleOrMultiple<
  | Primitive
  | null
  | undefined
  | BuilderFn<TBuilder>
  // eslint-disable-next-line @typescript-eslint/ban-types
  | TAdditionalAppends
  | {
      __type: 'append-value-group';
      values: AppendParam<TBuilder, TAdditionalAppends>[];
      separator: string | null;
    }
>;

export const AdditionalAppendsSymbol = Symbol('AdditionalAppends');

/**
 * Allows for the creation of a builder function based on a template string.
 * This will also automatically remove leading identation based on the last line and removes the first line if it is empty.
 * @param template
 * @param substitutions
 * @returns
 */
export function builderTemplate<T extends StringBuilder>(
  template: readonly string[] | ArrayLike<string>,
  ...substitutions: AppendValue<T>[]
): BuilderFn<T> {
  return (b) => {
    let lastLine: string | undefined = undefined;
    for (let i = template.length - 1; i >= 0; i--) {
      if (template[i].includes('\n')) {
        lastLine = template[i];
        break;
      }
    }
    const indent = lastLine?.match(/\n( *).*$/)?.[1] ?? '';
    const regex = new RegExp(`\\n {0,${indent.length}}`, 'g');

    for (let i = 0; i < template.length; i++) {
      let str = template[i].replace(regex, '\n');
      if (i === 0) str = str.replace(/^\r?\n/, '');

      b.append(str);
      if (i < substitutions.length) b.append(substitutions[i]);
    }
  };
}

/**
 * Represents a mutable string of characters.
 */
export class StringBuilder<TAdditionalAppends = never> {
  private readonly _options: StringBuilderOptions;
  private _str: string = '';

  [AdditionalAppendsSymbol](_: TAdditionalAppends): void {
    throw new Error('This method should never be called.');
  }

  public get options(): StringBuilderOptions {
    return this._options;
  }

  /**
   * Initializes a new instance of the StringBuilder class.
   * @param options The options.
   */
  constructor(options?: Partial<StringBuilderOptions>) {
    this._options = { ...defaultStringBuilderOptions, ...options };
  }

  /**
   * Creates a new StringBuilder instance and appends the specified string to it.
   * @param str The string to append.
   * @param options The options.
   * @returns A new StringBuilder instance.
   */
  public static fromString(str: string, options?: Partial<StringBuilderOptions>): StringBuilder {
    const builder = new StringBuilder(options);
    builder.append(str);
    return builder;
  }

  /**
   * Builds a string using a StringBuilder build action.
   * @param buildAction The build action to perform on the StringBuilder instance.
   * @param options The options for the StringBuilder instance.
   * @returns The built string.
   */
  public static build(buildAction: AppendParam<StringBuilder, never>, options?: Partial<StringBuilderOptions>): string {
    const builder = new StringBuilder(options);
    builder.append(buildAction);
    return builder.toString();
  }

  protected appendSingle(value: AppendParam<this, TAdditionalAppends>) {
    if (isNullish(value)) return;
    if (Array.isArray(value)) {
      for (const part of value) {
        this.appendSingle(part);
      }
    } else if (typeof value === 'string') {
      this._str += value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      this._str += value.toString();
    } else if (typeof value === 'function') {
      (value as (builder: this) => void)(this);
    } else if (
      typeof value === 'object' &&
      value !== null &&
      '__type' in value &&
      value.__type === 'append-value-group'
    ) {
      let isFirst = true;
      for (const part of value.values) {
        if (!isFirst && value.separator) {
          this.append(value.separator);
        }
        this.appendSingle(part);
        isFirst = false;
      }
    }
  }

  /**
   * Appends one or more strings to the end of the current StringBuilder.
   * @param value The string(s) to append.
   * @returns The current StringBuilder.
   */
  public append(...value: AppendParam<this, TAdditionalAppends>[]): this {
    for (const part of value) {
      this.appendSingle(part);
    }
    return this;
  }

  /**
   * Appends one or more strings to the end of the current StringBuilder, followed by a line terminator.
   * @param value
   * @returns
   */
  public appendLine(...value: Nullable<AppendParam<this, TAdditionalAppends>>[]): this {
    return this.append(...value, '\n');
  }

  /**
   * Prepends one or more strings to the beginning of the current StringBuilder.
   * @param value The string(s) to prepend.
   * @returns The current StringBuilder.
   */
  public prepend(...value: AppendParam<StringBuilder, never>[]): this {
    for (const part of value.reverse()) {
      if (isNullish(part)) continue;
      if (typeof part === 'function') {
        const builder = new StringBuilder(this.options);
        part(builder);
        this._str = builder._str + this._str;
      } else if (typeof part === 'string') {
        this._str = part + this._str;
      } else {
        this._str = part.toString() + this._str;
      }
    }
    return this;
  }

  /**
   * Prepends one or more strings to the beginning of the current StringBuilder, followed by a line terminator.
   * @param value The string(s) to prepend.
   * @returns The current StringBuilder.
   */
  public prependLine(...value: AppendParam<StringBuilder, never>[]): this {
    return this.prepend(...value, '\n');
  }

  /**
   * Converts the value of this instance to a string.
   * @returns A string whose value is the same as this instance.
   */
  public toString(): string {
    return this._str.replace(/\r?\n/g, this._options.newLine);
  }

  /**
   * Removes all characters from the current StringBuilder.
   */
  public clear(): void {
    this._str = '';
  }
}
