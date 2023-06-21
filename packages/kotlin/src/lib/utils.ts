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
