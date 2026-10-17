import type { ApiComponent, ApiSchema, Nullable } from '@goast/core';
import path from 'node:path';
import process from 'node:process';

/**
 * Converts a string to a Kotlin string literal. Double quotes, backslashes and dollar signs are escaped, and line
 * breaks and tabs are written as escape sequences. A nullish or empty value becomes `""`.
 * @param value The string to convert.
 * @returns The string literal, including its surrounding double quotes.
 * @example
 * ```ts
 * toKotlinStringLiteral('say "hi" $x'); // => "say \"hi\" \$x"
 * ```
 */
export function toKotlinStringLiteral(value: Nullable<string>): string {
  if (!value) {
    return '""';
  }

  const escaped = value
    .replace(/(["\\$])/g, '\\$1')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

/**
 * Gets a name that can be used as a Kotlin property name. A name that consists only of letters, digits, `_` and `$`,
 * and does not start with a digit, is returned unchanged. Any other name is wrapped in backticks. Reserved words are
 * not detected.
 * @param value The name to convert.
 * @returns The name, wrapped in backticks if it contains other characters.
 * @example
 * ```ts
 * toKotlinPropertyName('firstName'); // => firstName
 * toKotlinPropertyName('first-name'); // => `first-name`
 * ```
 */
export function toKotlinPropertyName(value: string): string {
  if (value.match(/^[a-zA-Z_$][a-zA-Z_$0-9]*$/)) {
    return value;
  }
  return `\`${value}\``;
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
 * Gets a documentation line that names the OpenAPI source of a component, such as
 * `Source: openapi/pet.yaml:12:3 (#/components/schemas/Pet)`. The file path is relative to the working directory and
 * uses forward slashes.
 * @template T The OpenAPI object type the component was transformed from.
 * @param component The component whose source is named.
 * @returns The source line.
 */
export function getSourceDocLine<T>(component: ApiComponent<T>): string {
  const file = path.relative(process.cwd(), component.$src.file).replace(/\\/g, '/');
  const { line, col } = component.$src.pos;
  return `Source: ${file}:${line}:${col} (${component.$src.path})`;
}

/**
 * Gets a schema if it is a string schema with at least one enum value.
 * @param schema The schema to check.
 * @returns The schema, or `undefined` if it is not a string schema with enum values.
 */
export function getStringEnumSchema(schema: Nullable<ApiSchema>): ApiSchema<'string'> | undefined {
  return schema?.kind === 'string' && schema.enum?.length ? schema : undefined;
}

/**
 * Gets the string enum schema of the items of an array schema.
 * @param schema The schema to check.
 * @returns The enum schema of the array items, or `undefined` if the schema is not an array whose items are a string
 * enum.
 * @see getStringEnumSchema
 */
export function getArrayItemStringEnumSchema(schema: Nullable<ApiSchema>): ApiSchema<'string'> | undefined {
  return schema?.kind === 'array' ? getStringEnumSchema(schema.items) : undefined;
}
