import type { ApiComponent, ApiSchema, Nullable } from '@goast/core';
import path from 'node:path';
import process from 'node:process';

/** The reserved keywords of C#. Contextual keywords (`var`, `async`, `record`, ...) are valid identifiers. */
const csharpKeywords = new Set(
  (
    'abstract as base bool break byte case catch char checked class const continue decimal default delegate do ' +
    'double else enum event explicit extern false finally fixed float for foreach goto if implicit in int ' +
    'interface internal is lock long namespace new null object operator out override params private protected ' +
    'public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true ' +
    'try typeof uint ulong unchecked unsafe ushort using virtual void volatile while'
  ).split(' '),
);

export function isCSharpKeyword(value: string): boolean {
  return csharpKeywords.has(value);
}

/** Prefixes `value` with `@` if it is a reserved C# keyword (`class` -> `@class`). */
export function escapeCSharpKeyword(value: string): string {
  return csharpKeywords.has(value) ? `@${value}` : value;
}

const simpleEscapes: Record<string, string> = {
  '\\': '\\\\',
  '"': '\\"',
  '\0': '\\0',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\v': '\\v',
  '\f': '\\f',
  '\b': '\\b',
  '\x07': '\\a',
};

/** Escapes the characters of `value` that cannot appear as-is in a regular (`"..."`) C# string literal. */
export function escapeCSharpString(value: string): string {
  return Array.from(value, (c) => {
    const simple = simpleEscapes[c];
    if (simple !== undefined) return simple;
    const code = c.charCodeAt(0);
    // Remaining control characters and the Unicode line/paragraph separators would break the literal.
    const needsEscape = code < 0x20 || code === 0x7f || code === 0x2028 || code === 0x2029;
    return needsEscape ? `\\u${code.toString(16).padStart(4, '0')}` : c;
  }).join('');
}

export function toCSharpStringLiteral(value: Nullable<string>): string {
  if (!value) {
    return '""';
  }
  return `"${escapeCSharpString(value)}"`;
}

/**
 * Turns an (already cased) name into a valid C# identifier: a leading digit gets a `_` prefix and reserved keywords
 * are escaped with `@`.
 */
export function toCSharpPropertyName(value: string): string {
  if (/^[0-9]/.test(value)) {
    return `_${value}`;
  }
  return escapeCSharpKeyword(value);
}

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

export function getSourceDocLine<T>(component: ApiComponent<T>): string {
  const file = path.relative(process.cwd(), component.$src.file).replace(/\\/g, '/');
  const { line, col } = component.$src.pos;
  return `Source: ${file}:${line}:${col} (${component.$src.path})`;
}

export function getStringEnumSchema(schema: Nullable<ApiSchema>): ApiSchema<'string'> | undefined {
  return schema?.kind === 'string' && schema.enum?.length ? schema : undefined;
}

export function getArrayItemStringEnumSchema(schema: Nullable<ApiSchema>): ApiSchema<'string'> | undefined {
  return schema?.kind === 'array' ? getStringEnumSchema(schema.items) : undefined;
}
