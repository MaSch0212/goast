import { EOL } from 'os';
import {
  WordCasing,
  StringCasing,
  CaseOptions,
  CamelCaseOptions,
  PascalCaseOptions,
  KebabCaseOptions,
  SnakeCaseOptions,
  CustomCaseOptions,
  BaseCaseOptions,
  StringCasingWithOptions,
} from './string.utils.types.js';
import { Nullable } from '../type.utils.js';
import { isNullish } from '../helpers.js';

/**
 * Gets the words from a string. Words are separated by capital letters. Leading numbers are removed. Non-alphanumerical characters are removed and interpreted as word seperators. Multiple uppercase letters are interpreted as one word.
 * @param str The string to get the words from.
 * @returns The words.
 * @example
 * getWords('fooBar') // => ['foo', 'Bar']
 * getWords('fooBarBaz') // => ['foo', 'Bar', 'Baz']
 * getWords('fooBarBaz123') // => ['foo', 'Bar', 'Baz', '123']
 * getWords('123Foo###Bar###') // => ['Foo', 'Bar']
 * getWords('fooBARBaz') // => ['foo', 'BAR', 'Baz']
 */
export function getWords(str: Nullable<string>): string[] {
  if (isNullish(str)) return [];

  // Remove non-alphanumerical characters
  str = str.replace(/[^a-zA-Z0-9]+/g, '-');
  str = str.replace(/^[0-9-]+/, '');

  // Split into words
  return str.match(/[A-Z]{2,}(?=[A-Z0-9-]|$)|[a-zA-Z][a-z]*|[0-9]+/g) ?? [];
}

/**
 * Converts a word to a given casing.
 * @param str The word to convert.
 * @param casing The casing to convert to.
 * @returns The converted word.
 * @example
 * toCasing('fooBar', 'unchanged') // => 'fooBar'
 * toCasing('fooBar', 'all-lower') // => 'foobar'
 * toCasing('fooBar', 'all-upper') // => 'FOOBAR'
 * toCasing('fooBar', 'first-upper') // => 'FooBar'
 * toCasing('FooBar', 'first-lower') // => 'fooBar'
 * toCasing('fooBar', 'first-upper-then-lower') // => 'Foobar'
 * toCasing('FooBar', 'first-lower-then-upper') // => 'fOOBAR'
 * toCasing('fooBar', 'first-upper-alternating') // => 'FoObAr'
 * toCasing('FooBar', 'first-lower-alternating') // => 'fOoBaR'
 */
export function wordToCasing(str: Nullable<string>, casing: WordCasing): string {
  str ??= '';
  switch (casing) {
    case 'unchanged':
      return str;
    case 'all-lower':
      return str.toLowerCase();
    case 'all-upper':
      return str.toUpperCase();
    case 'first-upper':
      return str[0].toUpperCase() + str.slice(1);
    case 'first-lower':
      return str[0].toLowerCase() + str.slice(1);
    case 'first-upper-then-lower':
      return str[0].toUpperCase() + str.slice(1).toLowerCase();
    case 'first-lower-then-upper':
      return str[0].toLowerCase() + str.slice(1).toUpperCase();
    case 'first-upper-alternating':
      return str
        .split('')
        .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
        .join('');
    case 'first-lower-alternating':
      return str
        .split('')
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join('');
  }
}

export function toCasing<T extends StringCasing>(
  str: Nullable<string>,
  casing: T | StringCasingWithOptions<T>
) {
  let options: CaseOptions<T> | undefined;
  let casingType: StringCasing;
  if (typeof casing === 'string') {
    casingType = casing;
  } else {
    options = casing;
    casingType = casing.casing;
  }

  switch (casingType) {
    case 'camel':
      return toCamelCase(str, options as CaseOptions<'camel'>);
    case 'pascal':
      return toPascalCase(str, options as CaseOptions<'pascal'>);
    case 'kebab':
      return toKebabCase(str, options as CaseOptions<'kebab'>);
    case 'snake':
      return toSnakeCase(str, options as CaseOptions<'snake'>);
    case 'custom':
      return toCustomCase(str, options as CaseOptions<'custom'>);
    default:
      return wordToCasing(getWords(str).join(''), casingType);
  }
}

function addPrefixAndSuffix(str: string, { prefix, suffix }: BaseCaseOptions): string {
  if (prefix) {
    str = prefix + str;
  }
  if (suffix) {
    str = str + suffix;
  }
  return str;
}

/**
 * Converts a string to camel case.
 * @param str The string to convert.
 * @param options The options.
 * @returns The converted string.
 * @example
 * toCamelCase('Foo bAR') // => 'fooBar'
 * toCamelCase('Foo bAR', { keepOriginalCase: true }) // => 'fooBAR'
 * toCamelCase('Foo bAR', { keepOriginalCase: false }) // => 'fooBar'
 * toCamelCase('Foo bAR', { prefix: 'bar' }) // => 'barfooBar'
 * toCamelCase('Foo bAR', { suffix: 'bar' }) // => 'fooBarbar'
 */
export function toCamelCase(str: Nullable<string>, options?: Partial<CamelCaseOptions>): string {
  const opts: CamelCaseOptions = { keepOriginalCase: false, ...options };
  const words = getWords(str);
  const camelCase = words
    .map((word, index) =>
      index === 0
        ? wordToCasing(word, opts.keepOriginalCase ? 'first-lower' : 'all-lower')
        : wordToCasing(word, opts.keepOriginalCase ? 'first-upper' : 'first-upper-then-lower')
    )
    .join('');
  return addPrefixAndSuffix(camelCase, opts);
}

/**
 * Converts a string to pascal case.
 * @param str The string to convert.
 * @param options The options.
 * @returns The converted string.
 * @example
 * toPascalCase('foo bAR') // => 'FooBar'
 * toPascalCase('foo bAR', { keepOriginalCase: true }) // => 'FooBAR'
 * toPascalCase('foo bAR', { keepOriginalCase: false }) // => 'FooBar'
 * toPascalCase('foo bAR', { prefix: 'bar' }) // => 'barFooBar'
 * toPascalCase('foo bAR', { suffix: 'bar' }) // => 'FooBarbar'
 */
export function toPascalCase(str: Nullable<string>, options?: Partial<PascalCaseOptions>): string {
  const opts: PascalCaseOptions = { keepOriginalCase: false, ...options };
  const words = getWords(str);
  const pascalCase = words
    .map((word) =>
      wordToCasing(word, opts.keepOriginalCase ? 'first-upper' : 'first-upper-then-lower')
    )
    .join('');
  return addPrefixAndSuffix(pascalCase, opts);
}

/**
 * Converts a string to kebab case.
 * @param str The string to convert.
 * @param options The options.
 * @returns The converted string.
 * @example
 * toKebabCase('Foo bAR') // => 'foo-bar'
 * toKebabCase('Foo bAR', { wordCasing: 'all-upper' }) // => 'FOO-BAR'
 * toKebabCase('Foo bAR', { firstWordCasing: 'all-upper' }) // => 'FOO-bar'
 * toKebabCase('Foo bAR', { casing: 'all-upper', firstWordCasing: 'all-lower' }) // => 'foo-BAR'
 * toKebabCase('Foo bAR', { prefix: 'bar' }) // => 'barfoo-bar'
 * toKebabCase('Foo bAR', { suffix: 'bar' }) // => 'foo-barbar'
 */
export function toKebabCase(str: Nullable<string>, options?: Partial<KebabCaseOptions>): string {
  const opts: KebabCaseOptions = { wordCasing: 'all-lower', ...options };
  const words = getWords(str);
  const kebabCase = words
    .map((word, index) =>
      index === 0
        ? wordToCasing(word, opts.firstWordCasing ?? opts.wordCasing)
        : wordToCasing(word, opts.wordCasing)
    )
    .join('-');
  return addPrefixAndSuffix(kebabCase, opts);
}

/**
 * Converts a string to snake case.
 * @param str The string to convert.
 * @param options The options.
 * @returns The converted string.
 * @example
 * toSnakeCase('Foo bAR') // => 'FOO_BAR'
 * toSnakeCase('Foo bAR', { wordCasing: 'all-lower' }) // => 'foo_bar'
 * toSnakeCase('Foo bAR', { firstWordCasing: 'all-lower' }) // => 'foo_BAR'
 * toSnakeCase('Foo bAR', { casing: 'all-lower', firstWordCasing: 'all-upper' }) // => 'FOO_bar'
 * toSnakeCase('Foo bAR', { prefix: 'bar' }) // => 'barFOO_BAR'
 * toSnakeCase('Foo bAR', { suffix: 'bar' }) // => 'FOO_BARbar'
 */
export function toSnakeCase(str: Nullable<string>, options?: Partial<SnakeCaseOptions>): string {
  const opts: SnakeCaseOptions = { wordCasing: 'all-upper', ...options };
  const words = getWords(str);
  const snakeCase = words
    .map((word, index) =>
      index === 0
        ? wordToCasing(word, opts.firstWordCasing ?? opts.wordCasing)
        : wordToCasing(word, opts.wordCasing)
    )
    .join('_');
  return addPrefixAndSuffix(snakeCase, opts);
}

/**
 * Converts a string to a custom case.
 * @param str The string to convert.
 * @param options The options.
 * @returns The converted string.
 * @example
 * toCustomCase('Foo bAR', { wordCasing: 'first-upper-then-lower' }) // => 'FooBar'
 * toCustomCase('Foo bAR', { wordCasing: 'first-upper-then-lower', wordSeparator: '~' }) // => 'Foo~Bar'
 * toCustomCase('Foo bAR', { wordCasing: 'first-upper-then-lower', wordSeparator: '~', prefix: 'bar' }) // => 'barFoo~Bar'
 * toCustomCase('Foo bAR', { wordCasing: 'first-upper-then-lower', wordSeparator: '~', suffix: 'bar' }) // => 'Foo~Barbar'
 * toCustomCase('Foo bAR', { wordCasing: 'all-upper', firstWordCasing: 'all-lower' }) // => 'fooBAR'
 * toCustomCase('Foo bAR baz', { wordCasing: (wordIndex) => (wordIndex % 2 === 0 ? 'all-upper' : 'all-lower') }) // => 'FOObarBAZ'
 */
export function toCustomCase(str: Nullable<string>, options: CustomCaseOptions): string {
  const words = getWords(str);
  const wordMapFn: (word: string, index: number) => string =
    typeof options.wordCasing === 'function'
      ? (word, index) => wordToCasing(word, options.wordCasing(index))
      : (word, index) =>
          index === 0
            ? wordToCasing(word, options.firstWordCasing ?? options.wordCasing)
            : wordToCasing(word, options.wordCasing);
  const customCase = words.map(wordMapFn).join(options.wordSeparator ?? '');
  return addPrefixAndSuffix(customCase, options);
}

/**
 * Escapes a string to be used in a regular expression.
 * @param str The string to escape.
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Options for the StringBuilder class.
 * @default newLine = os.EOL
 */
export type StringBuilderOptions = {
  readonly newLine: string;
};

const defaultStringBuilderOptions: StringBuilderOptions = {
  newLine: EOL,
};

/**
 * Represents a mutable string of characters.
 */
export class StringBuilder {
  private readonly _options: StringBuilderOptions;
  private _str: string = '';

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
   * Appends one or more strings to the end of the current StringBuilder.
   * @param value The string(s) to append.
   * @returns The current StringBuilder.
   */
  public append(...value: Nullable<string>[]): this {
    for (const part of value) {
      if (isNullish(part) || part.length === 0) continue;
      this._str += part;
    }
    return this;
  }

  /**
   * Appends one or more strings to the end of the current StringBuilder, followed by a line terminator.
   * @param value
   * @returns
   */
  public appendLine(...value: Nullable<string>[]): this {
    return this.append(...value, this._options.newLine);
  }

  /**
   * Converts the value of this instance to a string.
   * @returns A string whose value is the same as this instance.
   */
  public toString(): string {
    return this._str;
  }
}
