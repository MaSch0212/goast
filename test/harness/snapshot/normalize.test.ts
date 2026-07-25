import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { repoRootDir } from '../paths.ts';
import { normalizeFileTree, normalizePaths } from './normalize.ts';

const encode = (text: string) => new TextEncoder().encode(text);
const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

describe('normalizePaths', () => {
  it('should rewrite an absolute repo path to a <root> path', () => {
    const absolute = join(repoRootDir, 'test', 'specs', 'v3', 'pets.yml');
    expect(normalizePaths(`source: ${absolute}`)).toBe('source: <root>/test/specs/v3/pets.yml');
  });

  it('should rewrite backslash-separated paths to forward slashes', () => {
    const absolute = `${repoRootDir}\\test\\specs\\v3\\pets.yml`;
    expect(normalizePaths(`source: ${absolute}`)).toBe('source: <root>/test/specs/v3/pets.yml');
  });

  it('should rewrite every occurrence in a multi-line string', () => {
    const absolute = join(repoRootDir, 'a.yml');
    const result = normalizePaths(`one: ${absolute}\ntwo: ${absolute}`);
    expect(result).toBe('one: <root>/a.yml\ntwo: <root>/a.yml');
  });

  it('should leave text without repo paths untouched', () => {
    expect(normalizePaths('export const a = 1;\n')).toBe('export const a = 1;\n');
  });
});

describe('normalizeFileTree', () => {
  it('should normalize text file contents', () => {
    const absolute = join(repoRootDir, 'a.yml');
    const tree = normalizeFileTree(new Map([['doc.ts', encode(`// from ${absolute}\n`)]]));
    expect(decode(tree.get('doc.ts')!)).toBe('// from <root>/a.yml\n');
  });

  it('should leave binary files byte-identical', () => {
    const binary = new Uint8Array([0, 1, 2, 0]);
    const tree = normalizeFileTree(new Map([['logo.png', binary]]));
    expect(tree.get('logo.png')).toEqual(binary);
  });
});
