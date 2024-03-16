import { EOL } from 'os';

export function normalizeEOL(str: string): string {
  return str.replace(/\r/g, '').replace(/\n/g, EOL);
}
