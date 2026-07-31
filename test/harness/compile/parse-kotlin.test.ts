import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { parseKotlinDiagnostics } from './parse-kotlin.ts';

describe('parseKotlinDiagnostics', () => {
  it('extracts file, position, and message from an error line', () => {
    expect(parseKotlinDiagnostics('e: file:///output/kotlin/m/v3/a/Pet.kt:6:12 Expecting an element'))
      .toEqual([{ file: '/output/kotlin/m/v3/a/Pet.kt', line: 6, column: 12, message: 'Expecting an element' }]);
  });

  it('ignores warnings', () => {
    expect(parseKotlinDiagnostics('w: file:///output/a.kt:1:1 unused parameter\n')).toEqual([]);
  });

  it('ignores Gradle noise', () => {
    const output = [
      '> Task :u0001:compileKotlin FAILED',
      'FAILURE: Build completed with 1 failure.',
      'BUILD FAILED in 12s',
      '',
    ].join('\n');
    expect(parseKotlinDiagnostics(output)).toEqual([]);
  });

  it('keeps an error with no position', () => {
    expect(parseKotlinDiagnostics('e: Could not find declaration\n'))
      .toEqual([{ file: '', line: null, column: null, message: 'Could not find declaration' }]);
  });

  it('parses the captured fixture, so a Kotlin upgrade that changes the format fails here first', async () => {
    const fixture = await Deno.readTextFile(new URL('../fixtures/kotlin-errors.txt', import.meta.url));
    expect(parseKotlinDiagnostics(fixture).length).toBeGreaterThan(0);
  });
});
