import { type ApiComponent, getWords, type Nullable } from '@goast/core';
import path from 'node:path';
import process from 'node:process';

/** The keywords of the Go language, which cannot be used as identifiers. */
export const goKeywords: ReadonlySet<string> = new Set([
  'break',
  'case',
  'chan',
  'const',
  'continue',
  'default',
  'defer',
  'else',
  'fallthrough',
  'for',
  'func',
  'go',
  'goto',
  'if',
  'import',
  'interface',
  'map',
  'package',
  'range',
  'return',
  'select',
  'struct',
  'switch',
  'type',
  'var',
]);

/**
 * The `GOOS` values. A file named `*_<GOOS>.go` is only compiled for that operating system, see
 * https://pkg.go.dev/cmd/go#hdr-Build_constraints.
 */
const knownOS = new Set([
  'aix',
  'android',
  'darwin',
  'dragonfly',
  'freebsd',
  'hurd',
  'illumos',
  'ios',
  'js',
  'linux',
  'nacl',
  'netbsd',
  'openbsd',
  'plan9',
  'solaris',
  'wasip1',
  'windows',
  'zos',
]);

/** The `GOARCH` values. A file named `*_<GOARCH>.go` is only compiled for that architecture. */
const knownArch = new Set([
  '386',
  'amd64',
  'amd64p32',
  'arm',
  'armbe',
  'arm64',
  'arm64be',
  'loong64',
  'mips',
  'mipsle',
  'mips64',
  'mips64le',
  'mips64p32',
  'mips64p32le',
  'ppc',
  'ppc64',
  'ppc64le',
  'riscv',
  'riscv64',
  's390',
  's390x',
  'sparc',
  'sparc64',
  'wasm',
]);

/**
 * The options of `toGoIdentifier`.
 * @see toGoIdentifier
 */
export type GoIdentifierOptions = {
  /** Whether the identifier is exported, i.e. starts with an upper case letter. */
  exported: boolean;
  /** Words written in all caps, see `GoGeneratorConfig.initialisms`. Compared case-insensitively. */
  initialisms?: Iterable<string>;
  /** The identifier to use when the name contains no usable characters. Defaults to `Value`. */
  fallback?: string;
};

/**
 * Converts a name to a Go identifier: pascal case when exported, camel case otherwise, with initialisms in all caps
 * (`pet_id` becomes `PetID` or `petID`).
 *
 * The words are taken from `getWords` like everywhere else in gOAst, so leading digits and every non-alphanumeric
 * character are dropped. A name with no words left gets the `fallback`, and an unexported identifier that is a Go
 * keyword gets a trailing underscore.
 * @param name The name to convert, e.g. a schema name or a property name. `null` and `undefined` count as no words.
 * @param options The options of the identifier, see `GoIdentifierOptions`.
 * @returns The Go identifier.
 * @example
 * ```ts
 * toGoIdentifier('pet_id', { exported: true, initialisms: ['ID'] }); // => 'PetID'
 * toGoIdentifier('type', { exported: false }); // => 'type_'
 * ```
 */
export function toGoIdentifier(name: Nullable<string>, options: GoIdentifierOptions): string {
  const initialisms = new Set([...(options.initialisms ?? [])].map((x) => x.toUpperCase()));
  const words = getWords(name);
  if (words.length === 0) {
    return toGoIdentifier(options.fallback ?? 'Value', { ...options, fallback: 'Value' });
  }

  const result = words
    .map((word, index) => {
      const upper = word.toUpperCase();
      if (index === 0 && !options.exported) {
        return word.toLowerCase();
      }
      if (initialisms.has(upper)) {
        return upper;
      }
      return upper[0] + word.slice(1).toLowerCase();
    })
    .join('');

  return !options.exported && goKeywords.has(result) ? `${result}_` : result;
}

/**
 * Makes the names unique in declaration order by appending a counter to repeated ones (`Value`, `Value2`, ...).
 * Names in `reserved` are treated as already taken.
 * @param names The names to make unique.
 * @param reserved Names that are already taken, which the result must not use. Defaults to none.
 * @returns The unique names, in the same order as `names`.
 */
export function makeUniqueNames(names: readonly string[], reserved: Iterable<string> = []): string[] {
  const used = new Set(reserved);
  return names.map((name) => {
    let unique = name;
    for (let i = 2; used.has(unique); i++) unique = `${name}${i}`;
    used.add(unique);
    return unique;
  });
}

/**
 * The name of a generated file, in snake case and with the `.go` extension.
 *
 * Go treats some file names specially: a name ending in `_test` is a test file, a name ending in `_<GOOS>`,
 * `_<GOARCH>` or `_<GOOS>_<GOARCH>` is only compiled on that platform, and a name starting with `_` or `.` is ignored.
 * Such names get the `suffix` appended, so every generated file is part of every build.
 * @param name The name to convert, e.g. a schema name.
 * @param suffix The suffix for names that Go would treat specially, and the name of a file without any words. Defaults
 * to `gen`.
 * @returns The file name, including the `.go` extension.
 * @example
 * ```ts
 * toGoFileName('PetStore'); // => 'pet_store.go'
 * toGoFileName('pet_test'); // => 'pet_test_gen.go'
 * ```
 */
export function toGoFileName(name: Nullable<string>, suffix: string = 'gen'): string {
  let base = getWords(name)
    .map((x) => x.toLowerCase())
    .join('_');
  if (base.length === 0) {
    base = suffix;
  }

  const parts = base.split('_');
  const last = parts.at(-1)!;
  const secondLast = parts.at(-2);
  const isSpecial =
    parts.length > 1 &&
    (last === 'test' ||
      knownOS.has(last) ||
      knownArch.has(last) ||
      (secondLast !== undefined && knownOS.has(secondLast) && knownArch.has(last)));
  return `${isSpecial ? `${base}_${suffix}` : base}.go`;
}

/**
 * Gets the name of a Go package: the last segment of its path, lower case and without separators. A segment that is a
 * Go keyword gets a trailing underscore, and a path without any letters or digits gives `generated`.
 * @param packagePath The path of the package, e.g. `api/v1` or a module path such as `example.com/generated`.
 * @returns The name of the package, to use in its `package` clause.
 */
export function toGoPackageName(packagePath: string): string {
  const segment = packagePath.split('/').filter(Boolean).at(-1) ?? '';
  const name = getWords(segment)
    .map((x) => x.toLowerCase())
    .join('');
  if (name.length === 0) return 'generated';
  return goKeywords.has(name) ? `${name}_` : name;
}

/**
 * A Go interpreted string literal (`"..."`) for the text.
 *
 * Printable characters, including non-ASCII ones, are written as they are, because Go source is UTF-8. A lone UTF-16
 * surrogate has no UTF-8 encoding and no valid Go escape, so it becomes the replacement character.
 * @param value The text to convert. A nullish value becomes an empty literal.
 * @returns The string literal, including its surrounding double quotes.
 * @example
 * ```ts
 * toGoStringLiteral('say "hi"'); // => "say \"hi\""
 * ```
 */
export function toGoStringLiteral(value: Nullable<string>): string {
  let result = '"';
  for (const char of value ?? '') {
    const code = char.codePointAt(0)!;
    switch (char) {
      case '"':
        result += '\\"';
        break;
      case '\\':
        result += '\\\\';
        break;
      case '\n':
        result += '\\n';
        break;
      case '\r':
        result += '\\r';
        break;
      case '\t':
        result += '\\t';
        break;
      default:
        if (code >= 0xd800 && code <= 0xdfff) {
          result += '\\uFFFD';
        } else if (code < 0x20 || code === 0x7f) {
          result += `\\x${code.toString(16).padStart(2, '0')}`;
        } else if (code >= 0x80 && code <= 0x9f) {
          result += `\\u${code.toString(16).padStart(4, '0')}`;
        } else {
          result += char;
        }
    }
  }
  return `${result}"`;
}

/**
 * A struct tag (e.g. `` `json:"name,omitempty"` ``) for the key/value pairs.
 *
 * Each value is quoted the way `reflect.StructTag.Get` unquotes it, which also escapes every control character. The
 * tag itself is a raw string literal, unless a value contains a backquote, which a raw string cannot hold.
 * @param entries The key/value pairs of the tag, in the order they are written. Keys are written as they are.
 * @returns The struct tag, including its surrounding backquotes, or a double-quoted literal if a value needs one.
 * @example
 * ```ts
 * toGoStructTag([['json', 'name,omitempty'], ['xml', 'name']]); // => `json:"name,omitempty" xml:"name"`
 * ```
 */
export function toGoStructTag(entries: readonly (readonly [key: string, value: string])[]): string {
  const tag = entries.map(([key, value]) => `${key}:${toGoStringLiteral(value)}`).join(' ');
  return tag.includes('`') ? toGoStringLiteral(tag) : `\`${tag}\``;
}

/**
 * Turns the text into a Go comment by prefixing every line with `//`. Line breaks are normalized to `\n`, trailing
 * whitespace is removed, and blank lines become a bare `//`.
 * @param text The text to turn into a comment, which can span several lines.
 * @returns The comment, one `//` line per line of the text.
 */
export function toGoComment(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => (line.trim().length === 0 ? '//' : `// ${line.trimEnd()}`))
    .join('\n');
}

/**
 * Modifies a string with a modifier. A string modifier replaces the value. A regular expression replaces the value with
 * its first match, or keeps the value when nothing matches. A function returns the new value. Without a modifier, the
 * value is returned unchanged.
 * @template TArgs The types of the extra arguments that are passed to a modifier function.
 * @param value The value to modify.
 * @param modifier The replacement string, the regular expression, or the function that computes the new value.
 * @param args The extra arguments that are passed to a modifier function.
 * @returns The modified string.
 */
export function modifyString<TArgs extends unknown[]>(
  value: string,
  modifier: string | RegExp | ((value: string, ...args: TArgs) => string) | undefined,
  ...args: TArgs
): string {
  if (typeof modifier === 'string') {
    return modifier;
  }
  if (modifier instanceof RegExp) {
    const match = value.match(modifier);
    return match?.[0] ?? value;
  }
  if (typeof modifier === 'function') {
    return modifier(value, ...args);
  }
  return value;
}

/**
 * Gets the documentation line that names where a component is defined in the OpenAPI document. The file is shown
 * relative to the current working directory, with forward slashes.
 * @template T The type of the component.
 * @param component The component to describe, such as a schema or an endpoint.
 * @returns The line in the form `Source: <file>:<line>:<column> (<path>)`.
 */
export function getSourceDocLine<T>(component: ApiComponent<T>): string {
  const file = path.relative(process.cwd(), component.$src.file).replace(/\\/g, '/');
  const { line, col } = component.$src.pos;
  return `Source: ${file}:${line}:${col} (${component.$src.path})`;
}

/**
 * Checks whether a media type carries JSON, e.g. `application/json` or `application/problem+json`. Parameters such as
 * `charset` are ignored, and the comparison is case-insensitive.
 * @param mediaType The media type to check, e.g. the key of a `content` entry. `null` and `undefined` are not JSON.
 * @returns `true` if the media type carries JSON, otherwise `false`.
 */
export function isJsonMediaType(mediaType: Nullable<string>): boolean {
  const type = mediaType?.split(';')[0].trim().toLowerCase() ?? '';
  return type === 'application/json' || type.endsWith('+json');
}
