import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { repoRootDir } from '../paths.ts';
import { rewriteStrings, serializeNormalized, serializeValue } from './serialize.ts';

describe('serializeValue', () => {
  it('passes strings through unchanged', () => {
    expect(serializeValue('already text')).toBe('already text');
  });

  it('sorts object keys so output is order-independent', () => {
    expect(serializeValue({ b: 1, a: 2 })).toBe(serializeValue({ a: 2, b: 1 }));
    expect(serializeValue({ b: 1, a: 2 })).toContain('a: 2');
  });

  it('descends deeply nested structures', () => {
    let nested: unknown = 'leaf';
    for (let i = 0; i < 20; i++) nested = { next: nested };
    expect(serializeValue(nested)).toContain('leaf');
  });
});

describe('rewriteStrings', () => {
  it('rewrites strings in nested objects and arrays in place', () => {
    const value = { a: 'x/1', b: [{ c: 'x/2' }], d: 3 };
    rewriteStrings(value, (text) => text.replace('x/', 'y/'));
    expect(value).toEqual({ a: 'y/1', b: [{ c: 'y/2' }], d: 3 });
  });

  it('rewrites map values and set entries', () => {
    const value = { map: new Map([['k', 'x/1']]), set: new Set(['x/2']) };
    rewriteStrings(value, (text) => text.replace('x/', 'y/'));
    expect(value.map.get('k')).toBe('y/1');
    expect([...value.set]).toEqual(['y/2']);
  });

  it('terminates on a cycle and keeps the circular marker', () => {
    const value: Record<string, unknown> = { path: 'x/1' };
    value.self = value;

    rewriteStrings(value, (text) => text.replace('x/', 'y/'));

    expect(value.path).toBe('y/1');
    expect(serializeValue(value)).toContain('[Circular');
  });

  it('keeps a class instance and its constructor name intact', () => {
    class Config {
      constructor(public dir: string) {}
    }
    const value = { config: new Config('x/dir') };

    rewriteStrings(value, (text) => text.replace('x/', 'y/'));

    expect(value.config).toBeInstanceOf(Config);
    expect(value.config.dir).toBe('y/dir');
    expect(serializeValue(value)).toContain('Config {');
  });

  it('leaves the prototype out of the walk', () => {
    class WithGetter {
      readonly plain = 'x/1';
      get derived(): string {
        return 'x/2';
      }
    }
    const value = new WithGetter();

    rewriteStrings(value, (text) => text.replace('x/', 'y/'));

    expect(value.plain).toBe('y/1');
    expect(value.derived).toBe('x/2');
  });
});

describe('serializeNormalized', () => {
  /** The shape of a real TypeScript generator state, which is where C1 bit. */
  const stateFor = (outputDir: string) => ({
    typescript: { indexFiles: { models: join(outputDir, 'models.ts') } },
  });

  /** Stands in for `verifyProfile`'s output-directory replacement, separator spelling and all. */
  const replaceOutputDir = (outputDir: string) => (text: string) =>
    text.replace(/\\/g, '/').split(outputDir.replace(/\\/g, '/')).join('<output>');

  // The direct regression test for the machine-dependent baseline: `util.inspect` decides whether to
  // break an object across lines from the *rendered* width of what it is handed, so a snapshot
  // normalized after serialization silently encodes the length of the machine's temp path — the
  // Windows form wraps where the Linux form collapses to one line.
  it('produces byte-identical output for a long and a short output directory', () => {
    const longDir = join('C:', 'Users', 'somebody', 'AppData', 'Local', 'Temp', 'goast-snapshot-abcdef');
    const shortDir = '/tmp/goast-snapshot-abcdef';

    const fromLong = serializeNormalized(stateFor(longDir), replaceOutputDir(longDir));
    const fromShort = serializeNormalized(stateFor(shortDir), replaceOutputDir(shortDir));

    expect(fromLong).toBe(fromShort);
    expect(fromLong).toContain('<output>/models.ts');
  });

  it('is width-independent for a real temp directory too', async () => {
    const outputDir = await Deno.makeTempDir({ prefix: 'goast-serialize-' });
    try {
      expect(serializeNormalized(stateFor(outputDir), replaceOutputDir(outputDir)))
        .toBe(serializeNormalized(stateFor('/t/x'), replaceOutputDir('/t/x')));
    } finally {
      await Deno.remove(outputDir, { recursive: true });
    }
  });

  it('normalizes repository paths without an extra replacement', () => {
    const value = { spec: join(repoRootDir, 'test', 'specs', 'v3', 'pets.yml') };
    expect(serializeNormalized(value)).toContain("spec: '<root>/test/specs/v3/pets.yml'");
  });

  it('normalizes a pre-rendered string as text', () => {
    const text = `source: ${join(repoRootDir, 'a.yml')}\n`;
    expect(serializeNormalized(text)).toBe('source: <root>/a.yml\n');
  });

  it('renders a cyclic value without hanging', () => {
    const value: Record<string, unknown> = { spec: join(repoRootDir, 'a.yml') };
    value.self = value;

    const text = serializeNormalized(value);

    expect(text).toContain('<root>/a.yml');
    expect(text).toContain('[Circular');
  });
});
