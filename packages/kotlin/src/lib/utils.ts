import { Nullable } from '@goast/core';

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

export function toKotlinPropertyName(value: string): string {
  if (value.match(/^[a-zA-Z_$][a-zA-Z_$0-9]*$/)) {
    return value;
  }
  return `\`${value}\``;
}

export function modifyString<TArgs extends any[]>(
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
