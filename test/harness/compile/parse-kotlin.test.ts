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
    // Asserts the full parsed array, not just its length: a length-only check would still pass if a
    // format drift silently dropped one diagnostic's position or corrupted its message while another
    // still parsed, which is exactly the kind of partial breakage a format change could cause.
    expect(parseKotlinDiagnostics(fixture)).toEqual([
      {
        file: '/output/kotlin/models@sb3/v3/extreme-names/com/openapi/generated/model/.kt',
        line: 6,
        column: 11,
        message: 'Syntax error: Name expected.',
      },
      {
        file: '/output/kotlin/models@sb3/v3/extreme-names/com/openapi/generated/model/A.kt',
        line: 6,
        column: 12,
        message: 'Redeclaration:',
      },
      {
        file: '/output/kotlin/models@sb3/v3/extreme-names/com/openapi/generated/model/A_1.kt',
        line: 6,
        column: 12,
        message: 'Redeclaration:',
      },
      {
        file: '/output/kotlin/models@sb3/v3/extreme-names/com/openapi/generated/model/ObjectWithExtremeProperties.kt',
        line: 20,
        column: 8,
        message: 'Syntax error: Parameter name expected.',
      },
    ]);
  });
});
