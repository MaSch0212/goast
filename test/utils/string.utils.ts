import { EOL } from 'os';

function _normalizeEOL(str: string, indentCharCount?: number): string {
  let result = str.replace(/\r/gm, '').replace(/\n/g, EOL);
  if (indentCharCount !== undefined) {
    result = result.replace(new RegExp(`^ {${indentCharCount}}`, 'gm'), '');
  }
  return result;
}

export function normalizeEOL(str: string): string;
export function normalizeEOL(indentCharCount: number): (str: string) => string;
export function normalizeEOL(arg1: string | number): string | ((str: string) => string) {
  if (typeof arg1 === 'string') {
    return _normalizeEOL(arg1);
  }
  return (str: string) => _normalizeEOL(str, arg1);
}
