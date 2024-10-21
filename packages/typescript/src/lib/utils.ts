import { dirname, relative } from 'node:path';

import type { Nullable } from '@goast/core';

export type ImportModuleTransformer =
  | 'omit-extension'
  | 'with-extension'
  | 'js-extension'
  | ((module: string) => string);

function doubleQuotedToSingleQuoted(value: string): string {
  return `'${value.slice(1, -1).replace(/'/g, "\\'")}'`;
}

export function toTypeScriptStringLiteral(value: string, useSingleQuotes: boolean): string {
  return useSingleQuotes ? doubleQuotedToSingleQuoted(JSON.stringify(value)) : JSON.stringify(value);
}

export function toTypeScriptPropertyName(value: string, useSingleQuotes: boolean): string {
  if (value.match(/^[a-zA-Z_$][a-zA-Z_$0-9]*$/)) {
    return value;
  }
  return useSingleQuotes ? doubleQuotedToSingleQuoted(JSON.stringify(value)) : JSON.stringify(value);
}

export function getModulePathRelativeToFile(from: string, to: string, transformer: ImportModuleTransformer): string {
  return transformModulePath(relative(dirname(from), to).replace(/\\/g, '/'), transformer);
}

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

export function modifyString<TArgs extends any[]>(
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
