import path, { dirname, relative } from 'node:path';

import type { ApiComponent, Nullable } from '@goast/core';
import process from 'node:process';

/**
 * Describes how the module path of an import from a generated file into a project file is written. The path is always
 * relative to the importing file and starts with `./` or `../`.
 * - `'omit-extension'` removes the file extension.
 * - `'with-extension'` keeps the file extension.
 * - `'js-extension'` replaces the file extension with `.js`.
 * - A function receives the relative path and returns the module path to write.
 * @example
 * ```ts
 * // Importing `src/models/user.ts` from `src/services/api.ts` produces:
 * // 'omit-extension': '../models/user'
 * // 'with-extension': '../models/user.ts'
 * // 'js-extension': '../models/user.js'
 * ```
 */
export type ImportModuleTransformer =
  | 'omit-extension'
  | 'with-extension'
  | 'js-extension'
  | ((module: string) => string);

function doubleQuotedToSingleQuoted(value: string): string {
  return `'${value.slice(1, -1).replace(/'/g, "\\'")}'`;
}

/**
 * Converts a string into a TypeScript string literal. The value is escaped the way JSON escapes it, and the literal is
 * quoted with single quotes if `useSingleQuotes` is set, or with double quotes otherwise.
 * @param value The string to convert.
 * @param useSingleQuotes Whether to quote the literal with single quotes.
 * @returns The string literal, including its quotes.
 */
export function toTypeScriptStringLiteral(value: string, useSingleQuotes: boolean): string {
  return useSingleQuotes ? doubleQuotedToSingleQuoted(JSON.stringify(value)) : JSON.stringify(value);
}

/**
 * Converts a name into a TypeScript object property name. A name that is a plain identifier is written as it is, and
 * any other name is written as a string literal.
 * @param value The property name to convert.
 * @param useSingleQuotes Whether a string literal is quoted with single quotes.
 * @returns The property name, quoted if it is not a plain identifier.
 */
export function toTypeScriptPropertyName(value: string, useSingleQuotes: boolean): string {
  if (value.match(/^[a-zA-Z_$][a-zA-Z_$0-9]*$/)) {
    return value;
  }
  return useSingleQuotes ? doubleQuotedToSingleQuoted(JSON.stringify(value)) : JSON.stringify(value);
}

/**
 * Gets the module path that a file at `from` uses to import the file at `to`. The path is relative to the directory of
 * `from`, uses forward slashes, and is transformed with `transformer`.
 * @param from The path of the importing file.
 * @param to The path of the imported file.
 * @param transformer The transformer that writes the module path.
 * @returns The module path, such as `./user` or `../models/user`.
 */
export function getModulePathRelativeToFile(from: string, to: string, transformer: ImportModuleTransformer): string {
  return transformModulePath(relative(dirname(from), to).replace(/\\/g, '/'), transformer);
}

/**
 * Gets the module path that imports the file at `to` from the directory `from`. The path is relative to `from`, uses
 * forward slashes, and is transformed with `transformer`.
 * @param from The directory that the import is written in.
 * @param to The path of the imported file.
 * @param transformer The transformer that writes the module path.
 * @returns The module path, such as `./user` or `../models/user`.
 */
export function getModulePathRelativeToDirectory(
  from: string,
  to: string,
  transformer: ImportModuleTransformer,
): string {
  return transformModulePath(relative(from, to).replace(/\\/g, '/'), transformer);
}

function transformModulePath(modulePath: string, transformer: ImportModuleTransformer) {
  if (!modulePath.startsWith('.')) {
    modulePath = `./${modulePath}`;
  }

  if (transformer === 'omit-extension') {
    return modulePath.replace(/\.[^/.]+$/, '');
  } else if (transformer === 'with-extension') {
    return modulePath;
  } else if (transformer === 'js-extension') {
    return modulePath.replace(/\.[^/.]+$/, '.js');
  } else if (typeof transformer === 'function') {
    return transformer(modulePath);
  }

  return modulePath;
}

/**
 * Applies a modifier to a string. A string modifier replaces the value entirely. A RegExp keeps only the part of the
 * value that it matches, or leaves the value as it is if it does not match. A function returns its own result for the
 * value and the extra arguments. A nullish modifier leaves the value as it is.
 * @template TArgs The types of the extra arguments that are passed to a function modifier.
 * @param value The string to modify.
 * @param modifier The modifier to apply.
 * @param args The extra arguments that are passed to a function modifier.
 * @returns The modified string.
 */
export function modifyString<TArgs extends unknown[]>(
  value: string,
  modifier: Nullable<string | RegExp | ((value: string, ...args: TArgs) => string)>,
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
 * Gets a documentation line that names the source location of a component in its OpenAPI document. The file path is
 * relative to the current working directory and uses forward slashes.
 * @template T The type of the value of the component.
 * @param component The component to get the source location for.
 * @returns A line that starts with `Source:` and names the file, the line, the column and the path of the component.
 */
export function getSourceDocLine<T>(component: ApiComponent<T>): string {
  const file = path.relative(process.cwd(), component.$src.file).replace(/\\/g, '/');
  const { line, col } = component.$src.pos;
  return `Source: ${file}:${line}:${col} (${component.$src.path})`;
}
