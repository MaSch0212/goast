import { isNullish } from './common.utils.ts';
import type {
  BaseCaseOptions,
  CamelCaseOptions,
  CaseOptions,
  CustomCaseOptions,
  KebabCaseOptions,
  PascalCaseOptions,
  SnakeCaseOptions,
  StringCasing,
  StringCasingWithOptions,
  WordCasing,
} from './string.utils.types.ts';
import type { Nullable } from './type.utils.ts';

/**
 * Applies overrides to a casing. If both arguments are plain casings, `b` is returned. Otherwise the result is an
 * object that combines the options of both arguments, where the properties of `b` take precedence.
 * @param a The base casing, either a plain casing or a casing with options.
 * @param b The casing or the options that override `a`.
 * @returns The adjusted casing.
 * @example
 * ```ts
 * adjustCasing('camel', 'pascal'); // => 'pascal'
 * adjustCasing('camel', { prefix: '_' }); // => { casing: 'camel', prefix: '_' }
 * adjustCasing({ casing: 'camel', prefix: '_' }, 'pascal'); // => { casing: 'pascal', prefix: '_' }
 * adjustCasing({ casing: 'camel', prefix: '_' }, { suffix: '_' }); // => { casing: 'camel', prefix: '_', suffix: '_' }
 * ```
 */
export function adjustCasing(a: StringCasing, b: StringCasing): StringCasing;
export function adjustCasing(
  a: StringCasing | StringCasingWithOptions,
  b: StringCasing | Partial<StringCasingWithOptions>,
): StringCasingWithOptions;
export function adjustCasing(
  a: StringCasing | StringCasingWithOptions,
  b: StringCasing | Partial<StringCasingWithOptions>,
): StringCasing | StringCasingWithOptions {
  if (typeof a === 'string') {
    if (typeof b === 'string') {
      return b;
    } else {
      return { casing: a, ...b };
    }
  } else if (typeof b === 'string') {
    return { ...a, casing: b };
  } else {
    return { ...a, ...b };
  }
}

/**
 * Converts all characters of a string to lower case.
 * @param str The string to convert.
 * @returns The lower case string.
 */
export function lowercase<T extends string>(str: T): Lowercase<T> {
  return str.toLowerCase() as Lowercase<T>;
}

/**
 * Converts all characters of a string to upper case.
 * @param str The string to convert.
 * @returns The upper case string.
 */
export function uppercase<T extends string>(str: T): Uppercase<T> {
  return str.toUpperCase() as Uppercase<T>;
}

/**
 * Converts the first character of a string to upper case and leaves the remaining characters unchanged.
 * An empty string is returned as is.
 * @param str The string to capitalize.
 * @returns The capitalized string.
 */
export function capitalize<T extends string>(str: T): Capitalize<T> {
  return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>;
}

/**
 * Converts the first character of a string to lower case and leaves the remaining characters unchanged.
 * An empty string is returned as is.
 * @param str The string to uncapitalize.
 * @returns The uncapitalized string.
 */
export function uncapitalize<T extends string>(str: T): Uncapitalize<T> {
  return (str.charAt(0).toLowerCase() + str.slice(1)) as Uncapitalize<T>;
}

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

/**
 * Converts a string to the specified casing. The `camel`, `pascal`, `kebab`, `snake` and `custom` casings are
 * delegated to their dedicated functions. All other casings are applied to the words of the string joined together,
 * so non-alphanumerical characters are removed.
 * @param str The string to convert. `null` and `undefined` are treated as an empty string. The `first-*` word casings
 * throw a `TypeError` for an empty string.
 * @param casing The casing to convert to, optionally with options for that casing.
 * @returns The converted string.
 * @example
 * ```ts
 * toCasing('foo bar', 'pascal'); // => 'FooBar'
 * toCasing('foo bar', 'first-upper'); // => 'Foobar'
 * toCasing('foo_bar', { casing: 'kebab', wordCasing: 'all-upper' }); // => 'FOO-BAR'
 * ```
 */
export function toCasing<T extends StringCasing>(
  str: Nullable<string>,
  casing: T | StringCasingWithOptions<T>,
): string {
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
        : wordToCasing(word, opts.keepOriginalCase ? 'first-upper' : 'first-upper-then-lower'),
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
    .map((word) => wordToCasing(word, opts.keepOriginalCase ? 'first-upper' : 'first-upper-then-lower'))
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
      index === 0 ? wordToCasing(word, opts.firstWordCasing ?? opts.wordCasing) : wordToCasing(word, opts.wordCasing),
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
      index === 0 ? wordToCasing(word, opts.firstWordCasing ?? opts.wordCasing) : wordToCasing(word, opts.wordCasing),
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
 * Compares two strings for sorting, case-insensitively, without any dependency on the host locale.
 *
 * Deliberately not `String.prototype.localeCompare`: its collation depends on the host locale and ICU
 * version, so the same input would sort differently on different machines — which would make
 * generated output non-reproducible. `toLowerCase` is Unicode default case conversion and carries no
 * locale dependency.
 *
 * Comparison is case-insensitive so that, for example, `awaitBody` sorts alphabetically beside
 * `WebClient` rather than after every capitalized name. Strings differing only in case fall back to a
 * case-sensitive comparison, so their relative order is still stable. Non-ASCII characters order by
 * code point rather than alphabetically — `Ähre` sorts after `Zebra` — which is less pretty than
 * locale collation but entirely reproducible.
 *
 * @param a The first string.
 * @param b The second string.
 * @returns A negative number if `a` sorts first, a positive number if `b` does, otherwise 0.
 */
export function compareString(a: string, b: string): number {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  if (lowerA !== lowerB) return lowerA < lowerB ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Removes characters from a string and, if necessary, inserts new characters in their place, returning the spliced string.
 * @param str The string to splice.
 * @param start The index at which to start changing the string.
 * @param deleteCount The number of characters to remove.
 * @param insert The string to insert.
 * @returns The spliced string.
 */
export function spliceString(str: string, start: number, deleteCount: number, insert: string): string {
  return str.slice(0, start) + insert + str.slice(start + deleteCount);
}

/**
 * Removes leading indentation based on the last line. Also removes the first line if it is empty.
 * @param str The string to trim.
 */
export function trimIndent(str: string): string {
  const indent = str.match(/\n( *).*$/)?.[1] ?? '';
  if (indent.length === 0) return str;
  return str.replace(/^\r?\n/, '').replace(new RegExp(`^ {0,${indent.length}}`, 'gm'), '');
}

function isNonLineBreakWhitespaceChar(char: string): boolean {
  return (
    char === ' ' ||
    char === '\t' ||
    char === '\f' ||
    char === '\v' ||
    char === '\u00a0' ||
    char === '\u1680' ||
    char === '\u2000' ||
    char === '\u2001' ||
    char === '\u2002' ||
    char === '\u2003' ||
    char === '\u2004' ||
    char === '\u2005' ||
    char === '\u2006' ||
    char === '\u2007' ||
    char === '\u2008' ||
    char === '\u2009' ||
    char === '\u200a' ||
    char === '\u2028' ||
    char === '\u2029' ||
    char === '\u202f' ||
    char === '\u205f' ||
    char === '\u3000' ||
    char === '\ufeff'
  );
}
/**
 * Removes trailing whitespace from a string.
 * @param str The string to trim.
 * @param includeNewLine Whether to also remove trailing line breaks. Defaults to `true`. If `false`, only whitespace
 * characters other than line breaks are removed.
 * @returns The trimmed string.
 */
export function trimEnd(str: string, includeNewLine: boolean = true): string {
  if (includeNewLine) return str.trimEnd();
  let i = str.length;
  for (; isNonLineBreakWhitespaceChar(str[i - 1]); i--);
  return str.substring(0, i);
}
/**
 * Removes leading whitespace from a string.
 * @param str The string to trim.
 * @param includeNewLine Whether to also remove leading line breaks. Defaults to `true`. If `false`, only whitespace
 * characters other than line breaks are removed.
 * @returns The trimmed string.
 */
export function trimStart(str: string, includeNewLine: boolean = true): string {
  if (includeNewLine) return str.trimStart();
  let i = 0;
  for (; isNonLineBreakWhitespaceChar(str[i]); i++);
  return str.substring(i);
}
/**
 * Removes leading and trailing whitespace from a string.
 * @param str The string to trim.
 * @param includeNewLine Whether to also remove leading and trailing line breaks. Defaults to `true`. If `false`, only
 * whitespace characters other than line breaks are removed.
 * @returns The trimmed string.
 */
export function trim(str: string, includeNewLine: boolean = true): string {
  if (includeNewLine) return str.trim();
  let s = 0;
  for (; isNonLineBreakWhitespaceChar(str[s]); s++);
  let e = str.length;
  for (; isNonLineBreakWhitespaceChar(str[e - 1]); e--);
  return str.substring(s, e);
}

/**
 * Removes all occurrences of a substring from a string. The substring is matched literally, not as a regex.
 * @param str The string to remove the substring from.
 * @param rem The substring to remove. Must not be empty, because the search would never advance.
 * @returns The string without the occurrences of `rem`, or `str` itself if `rem` does not occur in it.
 */
export function removeStr(str: string, rem: string): string {
  let i = str.indexOf(rem);
  if (i === -1) return str;
  let result = '';
  let s = 0;
  while (i !== -1) {
    result += str.substring(s, i);
    s = i + rem.length;
    i = str.indexOf(rem, s);
  }
  return result + str.substring(s);
}
