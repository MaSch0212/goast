/**
 * Represents a casing for a word.
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
export type WordCasing =
  | 'unchanged'
  | 'all-lower'
  | 'all-upper'
  | 'first-upper'
  | 'first-lower'
  | 'first-upper-then-lower'
  | 'first-lower-then-upper'
  | 'first-upper-alternating'
  | 'first-lower-alternating';

/**
 * Represents a casing for a string.
 * @example
 * toCase('fooBar', 'unchanged') // => 'fooBar'
 * toCase('fooBar', 'all-lower') // => 'foobar'
 * toCase('fooBar', 'all-upper') // => 'FOOBAR'
 * toCase('fooBar', 'first-upper') // => 'FooBar'
 * toCase('FooBar', 'first-lower') // => 'fooBar'
 * toCase('fooBar', 'first-upper-then-lower') // => 'Foobar'
 * toCase('FooBar', 'first-lower-then-upper') // => 'fOOBAR'
 * toCase('fooBar', 'first-upper-alternating') // => 'FoObAr'
 * toCase('FooBar', 'first-lower-alternating') // => 'fOoBaR'
 * toCase('fooBar', 'camel') // => 'fooBar'
 * toCase('fooBar', 'pascal') // => 'FooBar'
 * toCase('fooBar', 'kebab') // => 'foo-bar'
 * toCase('fooBar', 'snake') // => 'foo_bar'
 */
export type StringCasing = WordCasing | 'camel' | 'pascal' | 'kebab' | 'snake' | 'custom';

/**
 * Represents a casing together with the options that apply to it.
 * @template T The casing that determines which options are available.
 */
export type StringCasingWithOptions<T extends StringCasing = StringCasing> = {
  /**
   * The casing to apply.
   */
  casing: T;
} & CaseOptions<T>;

/**
 * Represents either a plain casing or a casing with options.
 * @see StringCasing
 * @see StringCasingWithOptions
 */
export type ExtendedStringCasing = StringCasing | StringCasingWithOptions;

/**
 * Resolves the options that a casing accepts. Casings without options resolve to `never`.
 * @template T The casing to resolve the options for.
 */
export type CaseOptions<T extends StringCasing> = T extends 'camel'
  ? Partial<CamelCaseOptions>
  : T extends 'pascal'
    ? Partial<PascalCaseOptions>
    : T extends 'kebab'
      ? Partial<KebabCaseOptions>
      : T extends 'snake'
        ? Partial<SnakeCaseOptions>
        : T extends 'custom'
          ? CustomCaseOptions
          : never;

/**
 * Options that are shared by all casings and add text around the converted string.
 */
export type BaseCaseOptions = {
  /**
   * Specifies a prefix to add to the string.
   * @default undefined
   * @example
   * toCase('foo', { prefix: 'bar' }) // => 'barfoo'
   */
  prefix?: string;
  /**
   * Specifies a suffix to add to the string.
   * @default undefined
   * @example
   * toCase('foo', { suffix: 'bar' }) // => 'foobar'
   */
  suffix?: string;
};

/**
 * Options for the camel casing.
 */
export type CamelCaseOptions = BaseCaseOptions & {
  /**
   * Controls the casing of all characters except the first one for each word.
   *
   * If true, all characters except the first one will remain unchanged; otherwise, all characters except the first one will be converted to lowercase.
   *
   * @default false
   * @example
   * toCamelCase('fooBAR') // => 'fooBar'
   * toCamelCase('fooBAR', { keepOriginalCase: false }) // => 'fooBar'
   * toCamelCase('fooBAR', { keepOriginalCase: true }) // => 'fooBAR'
   */
  keepOriginalCase: boolean;
};

/**
 * Options for the pascal casing.
 */
export type PascalCaseOptions = BaseCaseOptions & {
  /**
   * Controls the casing of all characters except the first one for each word.
   *
   * If true, all characters except the first one will remain unchanged; otherwise, all characters except the first one will be converted to lowercase.
   *
   * @default false
   * @example
   * toCamelCase('FooBAR') // => 'FooBar'
   * toCamelCase('FooBAR', { keepOriginalCase: false }) // => 'FooBar'
   * toCamelCase('FooBAR', { keepOriginalCase: true }) // => 'FooBAR'
   */
  keepOriginalCase: boolean;
};

/**
 * Options for the kebab casing, which joins the words with hyphens.
 */
export type KebabCaseOptions = BaseCaseOptions & {
  /**
   * Specifies the casing of words.
   * @default 'all-lower'
   * @example
   * toKebabCase('Foo bAR') // => 'foo-bar'
   * toKebabCase('Foo bAR', { wordCasing: 'all-upper' }) // => 'FOO-BAR'
   */
  wordCasing: WordCasing;
  /**
   * Specifies the casing of the first word. If undefined uses the casing option.
   * @default undefined
   * @example
   * toKebabCase('Foo bAR') // => 'foo-bar'
   * toKebabCase('Foo bAR', { firstWordCasing: 'all-upper' }) // => 'FOO-bar'
   * toKebabCase('Foo bAR', { wordCasing: 'all-upper', firstWordCasing: 'all-lower' }) // => 'foo-BAR'
   */
  firstWordCasing?: WordCasing;
};

/**
 * Options for the snake casing, which joins the words with underscores.
 */
export type SnakeCaseOptions = BaseCaseOptions & {
  /**
   * Specifies the casing of words.
   * @default 'all-upper'
   * @example
   * toSnakeCase('Foo bAR') // => 'FOO_BAR'
   * toSnakeCase('Foo bAR', { wordCasing: 'all-lower' }) // => 'foo_bar'
   */
  wordCasing: WordCasing;
  /**
   * Specifies the casing of the first word. If undefined uses the casing option.
   * @default undefined
   * @example
   * toSnakeCase('Foo bAR') // => 'FOO_BAR'
   * toSnakeCase('Foo bAR', { firstWordCasing: 'all-lower' }) // => 'foo_BAR'
   * toSnakeCase('Foo bAR', { wordCasing: 'all-lower', firstWordCasing: 'all-upper' }) // => 'FOO_bar'
   */
  firstWordCasing?: WordCasing;
};

/**
 * Options for the custom casing, which applies the word casing and joins the words with an optional separator.
 */
export type CustomCaseOptions = BaseCaseOptions & {
  /**
   * Specifies the separator between words.
   * @default undefined
   * @example
   * toCustomCase('Foo bAR', { wordCasing: 'first-upper-then-lower', wordSeparator: '~' }) // => 'Foo~Bar'
   */
  wordSeparator?: string;
} & (
    | {
        /**
         * Specifies the casing of words.
         * @example
         * toCustomCase('Foo bAR', { wordCasing: 'first-upper-then-lower' }) // => 'FooBar'
         */
        wordCasing: WordCasing;
        /**
         * Specifies the casing of the first word. If undefined uses the casing option.
         * @default undefined
         * @example
         * toCustomCase('Foo bAR', { wordCasing: 'first-upper-then-lower', firstWordCasing: 'all-upper' }) // => 'FOOBar'
         */
        firstWordCasing?: WordCasing;
      }
    | {
        /**
         * Specifies the casing of words.
         * @example
         * toCustomCase('Foo bAR baz', { wordCasing: (wordIndex) => (wordIndex % 2 === 0 ? 'all-upper' : 'all-lower') }) // => 'FOObarBAZ'
         */
        wordCasing: (wordIndex: number) => WordCasing;
      }
  );
