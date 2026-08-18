import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { repoRootDir } from '../paths.ts';
import { formatDiagnostics, normalizeMessageUrls } from './diagnostics.ts';
import type { Diagnostic } from './types.ts';

const d = (file: string, line: number | null, column: number | null, message: string): Diagnostic => ({
  file,
  line,
  column,
  message,
});

describe('formatDiagnostics', () => {
  it('renders one diagnostic per line as file:line:col message', () => {
    expect(formatDiagnostics([d('models/pet.ts', 3, 7, 'Type error')]))
      .toBe('models/pet.ts:3:7 Type error\n');
  });

  it('sorts by file, then line, then column, then message', () => {
    const text = formatDiagnostics([
      d('b.ts', 1, 1, 'second file'),
      d('a.ts', 2, 1, 'later line'),
      d('a.ts', 1, 2, 'later column'),
      d('a.ts', 1, 1, 'zzz'),
      d('a.ts', 1, 1, 'aaa'),
    ]);

    expect(text).toBe(
      'a.ts:1:1 aaa\na.ts:1:1 zzz\na.ts:1:2 later column\na.ts:2:1 later line\nb.ts:1:1 second file\n',
    );
  });

  it('dedupes identical diagnostics, which a parallel build can report twice', () => {
    expect(formatDiagnostics([d('a.ts', 1, 1, 'same'), d('a.ts', 1, 1, 'same')]))
      .toBe('a.ts:1:1 same\n');
  });

  it('omits position when the compiler gave none, and renders a missing file as <no file>', () => {
    expect(formatDiagnostics([d('a.kt', null, null, 'no position'), d('', null, null, 'no file')]))
      .toBe('<no file> no file\na.kt no position\n');
  });

  it('orders file-less diagnostics numerically too, not by string', () => {
    expect(formatDiagnostics([d('', 10, 1, 'ten'), d('', 9, 1, 'nine')]))
      .toBe('<no file>:9:1 nine\n<no file>:10:1 ten\n');
  });

  it('sorts a position-less diagnostic before a positioned one in the same file', () => {
    expect(formatDiagnostics([d('a.kt', 5, 1, 'positioned'), d('a.kt', null, null, 'bare')]))
      .toBe('a.kt bare\na.kt:5:1 positioned\n');
  });

  it('collapses a multi-line message onto one line so a diagnostic is always one snapshot line', () => {
    expect(formatDiagnostics([d('a.kt', 1, 1, 'first\n  second\n\n  third')]))
      .toBe('a.kt:1:1 first second third\n');
  });

  it('returns the empty string for no diagnostics', () => {
    expect(formatDiagnostics([])).toBe('');
  });
});

describe('normalizeMessageUrls', () => {
  // The property that matters — see the doc comment on `decodeFileUrl` in diagnostics.ts — is that a
  // Windows-drive URL and a POSIX URL naming the *same* logical location both normalize to identical
  // text, in one test process, regardless of which OS actually runs the test. Each pair below is
  // internally consistent (a Windows tree/root/URL trio, and a separately-constructed POSIX trio), and
  // both trios describe "a file two levels below the unit's tree root" — so both must produce the same
  // relative form.

  it('rewrites a Windows-drive URL inside the unit tree to its unit-relative form', () => {
    const treeDir = String.raw`C:\repo\test\output\typescript\models\v3\unit`;
    const message =
      `Import "<output>/models/.ts" not a dependency and not in import map from "file:///C:/repo/test/output/typescript/models/v3/unit/models.ts"`;

    expect(normalizeMessageUrls(message, treeDir)).toBe(
      `Import "<output>/models/.ts" not a dependency and not in import map from "models.ts"`,
    );
  });

  it('rewrites a POSIX URL inside the unit tree to the identical unit-relative form', () => {
    const treeDir = '/repo/test/output/typescript/models/v3/unit';
    const message =
      `Import "<output>/models/.ts" not a dependency and not in import map from "file:///repo/test/output/typescript/models/v3/unit/models.ts"`;

    expect(normalizeMessageUrls(message, treeDir)).toBe(
      `Import "<output>/models/.ts" not a dependency and not in import map from "models.ts"`,
    );
  });

  it('rewrites a URL nested inside the unit tree to a forward-slashed relative path', () => {
    const treeDir = String.raw`C:\repo\test\output\typescript\models\v3\unit`;
    const message = `at file:///C:/repo/test/output/typescript/models/v3/unit/models/pet.ts:3:13`;

    expect(normalizeMessageUrls(message, treeDir)).toBe('at models/pet.ts:3:13');
  });

  // These two exercise the repo-root fallback and the "give up" path, both of which compare against
  // the *real* `repoRootDir` — unlike the pairs above, there is only one flavor to test here, because
  // the constant itself is fixed to whichever host runs the suite. `pathToFileURL` (host-native, like
  // `repoRootDir` itself) builds a URL guaranteed to match that host's own flavor.
  it('falls back to a <root>/-prefixed repo-relative path for a URL outside the unit but inside the repo', () => {
    const treeDir = join(repoRootDir, 'test', 'output', 'typescript', 'models', 'v3', 'unit');
    const url = pathToFileURL(join(repoRootDir, 'test', 'specs', 'v3', 'pets.yml')).href;

    expect(normalizeMessageUrls(`from "${url}"`, treeDir)).toBe('from "<root>/test/specs/v3/pets.yml"');
  });

  it('leaves a URL outside the repository untouched', () => {
    const treeDir = join(repoRootDir, 'test', 'output', 'typescript', 'models', 'v3', 'unit');
    // A sibling of the repo root, in the host's own native flavor (like `repoRootDir` itself) rather
    // than a hand-written POSIX path — the latter would decode to the *other* `path` implementation on
    // a Windows host, comparing it against a Windows-native `repoRootDir` under `posix.relative`, which
    // is not a comparison either implementation is meant to answer.
    const url = pathToFileURL(join(repoRootDir, '..', 'definitely-not-this-repo', 'entirely.ts')).href;
    const message = `from "${url}"`;

    expect(normalizeMessageUrls(message, treeDir)).toBe(message);
  });

  it('leaves a URL on a different Windows drive than the checkout untouched', () => {
    const treeDir = String.raw`C:\repo\test\output\typescript\models\v3\unit`;
    const message = 'from "file:///D:/elsewhere/thing.ts"';

    expect(normalizeMessageUrls(message, treeDir)).toBe(message);
  });

  it('leaves non-file text untouched, including a message with no URL at all', () => {
    const message = `Type alias 'X' circularly references itself.`;
    expect(normalizeMessageUrls(message, 'C:\\repo\\unit')).toBe(message);
  });

  it('rewrites every occurrence when a message embeds more than one URL', () => {
    const treeDir = String.raw`C:\repo\test\output\typescript\models\v3\unit`;
    const message =
      'from "file:///C:/repo/test/output/typescript/models/v3/unit/a.ts" and "file:///C:/repo/test/output/typescript/models/v3/unit/b.ts"';

    expect(normalizeMessageUrls(message, treeDir)).toBe('from "a.ts" and "b.ts"');
  });
});
