import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { repoRootDir } from '../paths.ts';
import { normalizeFileTree, normalizePaths, normalizePathsUnderRoot } from './normalize.ts';

const encode = (text: string) => new TextEncoder().encode(text);
const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

describe('normalizePaths', () => {
  it('should rewrite an absolute repo path to a <root> path', () => {
    const absolute = join(repoRootDir, 'test', 'specs', 'v3', 'pets.yml');
    expect(normalizePaths(`source: ${absolute}`)).toBe('source: <root>/test/specs/v3/pets.yml');
  });

  it('should rewrite the escaped spelling util.inspect emits inside a string literal', () => {
    // On Windows `util.inspect` doubles every separator; on POSIX there is nothing to double, so this
    // is the platform-native spelling either way — which is what makes the assertion portable.
    const absolute = join(repoRootDir, 'test', 'specs', 'v3', 'pets.yml').replace(/\\/g, '\\\\');
    expect(normalizePaths(`file: '${absolute}'`)).toBe("file: '<root>/test/specs/v3/pets.yml'");
  });

  it('should rewrite a forward-slash spelling of the root', () => {
    const absolute = join(repoRootDir, 'test', 'specs', 'v3', 'pets.yml').replace(/\\/g, '/');
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

describe('normalizePathsUnderRoot', () => {
  // A checkout at `/w`, `/app` or `C:\goast` is short enough that the root occurs inside ordinary
  // content. Unanchored, it corrupted a JSON pointer ending in `/properties/w` into
  // `…properties<root>/` — silently, with every test still green.
  it('leaves a short root alone where it appears mid-token', () => {
    const text = "path: '/ObjectWithPropertiesAllOfAndAnyOf/anyOf/0/properties/w'";
    expect(normalizePathsUnderRoot(text, '/w')).toBe(text);
  });

  it('does not treat a longer sibling of the root as the root', () => {
    expect(normalizePathsUnderRoot('p: /wibble/x.yml', '/w')).toBe('p: /wibble/x.yml');
  });

  it('normalizes the root path itself without inventing a child', () => {
    expect(normalizePathsUnderRoot('root: /w', '/w')).toBe('root: <root>');
  });

  it('still normalizes real paths under a short root', () => {
    expect(normalizePathsUnderRoot('p: /w/test/x.yml', '/w')).toBe('p: <root>/test/x.yml');
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

  it('should preserve carriage returns in a file with no repo paths', () => {
    const tree = normalizeFileTree(new Map([['doc.ts', encode('one\r\ntwo')]]));
    expect(decode(tree.get('doc.ts')!)).toBe('one\r\ntwo');
  });

  it('should preserve carriage returns in a file that gets rewritten', () => {
    const absolute = join(repoRootDir, 'a.yml');
    const tree = normalizeFileTree(new Map([['doc.ts', encode(`one\r\n// from ${absolute}\r\ntwo`)]]));
    expect(decode(tree.get('doc.ts')!)).toBe('one\r\n// from <root>/a.yml\r\ntwo');
  });
});
