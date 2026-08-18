import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { repoRootDir } from '../paths.ts';
import { normalizeFileTree, normalizePaths, normalizePathsUnderRoot, replaceOutputDir } from './normalize.ts';

const encode = (text: string) => new TextEncoder().encode(text);
const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

// A stand-in "temp output dir" for tests that don't care about output-dir normalization at all — an
// arbitrary path unrelated to `repoRootDir` and never itself a substring of any path these tests
// build, so it is a no-op for them while still satisfying `normalizeFileTree`'s now-required parameter.
const unusedOutputDir = 'C:\\Users\\nobody\\AppData\\Local\\Temp\\goast-snapshot-unused';

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
    const tree = normalizeFileTree(new Map([['doc.ts', encode(`// from ${absolute}\n`)]]), unusedOutputDir);
    expect(decode(tree.get('doc.ts')!)).toBe('// from <root>/a.yml\n');
  });

  it('should leave binary files byte-identical', () => {
    const binary = new Uint8Array([0, 1, 2, 0]);
    const tree = normalizeFileTree(new Map([['logo.png', binary]]), unusedOutputDir);
    expect(tree.get('logo.png')).toEqual(binary);
  });

  it('should preserve carriage returns in a file with no repo paths', () => {
    const tree = normalizeFileTree(new Map([['doc.ts', encode('one\r\ntwo')]]), unusedOutputDir);
    expect(decode(tree.get('doc.ts')!)).toBe('one\r\ntwo');
  });

  it('should preserve carriage returns in a file that gets rewritten', () => {
    const absolute = join(repoRootDir, 'a.yml');
    const tree = normalizeFileTree(new Map([['doc.ts', encode(`one\r\n// from ${absolute}\r\ntwo`)]]), unusedOutputDir);
    expect(decode(tree.get('doc.ts')!)).toBe('one\r\n// from <root>/a.yml\r\ntwo');
  });

  // This is the defect the harness fix closes: a generator bug (a schema whose normalized name is
  // empty misclassifies its own file as a bare module specifier — see
  // packages/typescript/src/import-collection.ts's getImportKind — and leaks its absolute output
  // path into generated source) used to reach a committed snapshot verbatim, because
  // `verifyGeneratedTree` normalized tree content with `normalizePaths` (repo root only) and never
  // with `replaceOutputDir` (output dir), even though `replaceOutputDir` already existed for
  // `state.txt` and generation-error text. These pin that tree content is now neutralized the same
  // way.
  it('should rewrite an output-dir path inside tree file content to <output> with forward slashes', () => {
    const outputDir = 'C:\\Users\\someone\\AppData\\Local\\Temp\\goast-snapshot-abc123';
    const leaked = `${outputDir}\\models\\.ts`;
    const tree = normalizeFileTree(new Map([['models.ts', encode(`export type {  } from '${leaked}';\n`)]]), outputDir);
    expect(decode(tree.get('models.ts')!)).toBe("export type {  } from '<output>/models/.ts';\n");
  });

  it('should normalize a native and a doubled-backslash spelling of the output dir to identical text', () => {
    // This is the property that makes the snapshot identical on a Windows checkout and on Linux CI:
    // whichever spelling a generator happened to render, the committed text must come out the same.
    const outputDir = 'C:\\Users\\someone\\AppData\\Local\\Temp\\goast-snapshot-abc123';
    const nativeSpelling = `${outputDir}\\models\\a.ts`;
    const doubledSpelling = nativeSpelling.replace(/\\/g, '\\\\');

    const native = normalizeFileTree(new Map([['x.ts', encode(`from '${nativeSpelling}'`)]]), outputDir);
    const doubled = normalizeFileTree(new Map([['x.ts', encode(`from '${doubledSpelling}'`)]]), outputDir);

    expect(decode(native.get('x.ts')!)).toBe("from '<output>/models/a.ts'");
    expect(decode(doubled.get('x.ts')!)).toEqual(decode(native.get('x.ts')!));
  });

  it('should still apply repo-root normalization alongside output-dir normalization', () => {
    const outputDir = 'C:\\Users\\someone\\AppData\\Local\\Temp\\goast-snapshot-abc123';
    const repoPath = join(repoRootDir, 'test', 'specs', 'v3', 'pets.yml');
    const text = `// source: ${repoPath}\nexport type {  } from '${outputDir}\\models\\.ts';\n`;

    const tree = normalizeFileTree(new Map([['doc.ts', encode(text)]]), outputDir);

    expect(decode(tree.get('doc.ts')!)).toBe(
      "// source: <root>/test/specs/v3/pets.yml\nexport type {  } from '<output>/models/.ts';\n",
    );
  });

  // The case that was actually broken: nothing stops TMPDIR/TEMP from pointing inside the checkout,
  // so `outputDir` can itself sit under `repoRootDir`. With `normalizePaths` applied first, it would
  // consume the `repoRootDir` prefix of the leaked path and leave the random per-run directory name —
  // `goast-snapshot-abc123` here — sitting in the committed snapshot as `<root>/tmp/goast-snapshot-
  // abc123/models/.ts`: still machine- and run-dependent, the exact hole this whole change closes.
  // Running `replaceOutputDir` first (see `normalizeFileTree`'s doc comment) avoids this by consuming
  // the leaked path down to `<output>` before `normalizePaths` ever sees it.
  it('should neutralize a leaked path even when the output dir sits inside the repo root', () => {
    const outputDir = join(repoRootDir, 'tmp', 'goast-snapshot-abc123');
    const text = `export type {  } from '${join(outputDir, 'models', '.ts')}';\n`;

    const tree = normalizeFileTree(new Map([['models.ts', encode(text)]]), outputDir);

    expect(decode(tree.get('models.ts')!)).toBe("export type {  } from '<output>/models/.ts';\n");
  });
});

describe('replaceOutputDir', () => {
  it('should rewrite the native spelling of the output dir', () => {
    const outputDir = 'C:\\Users\\someone\\AppData\\Local\\Temp\\goast-snapshot-abc123';
    expect(replaceOutputDir(`File already exists: ${outputDir}\\models\\a.ts`, outputDir)).toBe(
      'File already exists: <output>/models/a.ts',
    );
  });

  it('should rewrite a forward-slash spelling of the output dir', () => {
    const outputDir = 'C:\\Users\\someone\\AppData\\Local\\Temp\\goast-snapshot-abc123';
    const forwardSlash = outputDir.replace(/\\/g, '/');
    expect(replaceOutputDir(`from '${forwardSlash}/models/a.ts'`, outputDir)).toBe("from '<output>/models/a.ts'");
  });

  it('should rewrite the doubled-backslash spelling of the output dir', () => {
    const outputDir = 'C:\\Users\\someone\\AppData\\Local\\Temp\\goast-snapshot-abc123';
    const doubled = outputDir.replace(/\\/g, '\\\\');
    expect(replaceOutputDir(`from '${doubled}\\\\models\\\\a.ts'`, outputDir)).toBe("from '<output>/models/a.ts'");
  });

  it('should leave text without the output dir untouched', () => {
    const outputDir = 'C:\\Users\\someone\\AppData\\Local\\Temp\\goast-snapshot-abc123';
    expect(replaceOutputDir('export const a = 1;\n', outputDir)).toBe('export const a = 1;\n');
  });

  // The trailing-path pass exists to clean up *after* a replacement this function just made; it must
  // not also rewrite a literal `<output>` that was already in the input for an unrelated reason (this
  // function is now applied to every text file of every generated tree, not just util.inspect dumps
  // and error text, so an unrelated `<output>` substring is now a real possibility). Before this was
  // guarded, `const s = "<output>\n\t";` came out as `const s = "<output>/n/t";` even though the output
  // dir never appeared anywhere in the text.
  it('should not touch a literal <output> already in the text when the output dir never appears', () => {
    const outputDir = 'C:\\Users\\someone\\AppData\\Local\\Temp\\goast-snapshot-abc123';
    const text = 'const s = "<output>\\n\\t";';
    expect(replaceOutputDir(text, outputDir)).toBe(text);
  });
});
