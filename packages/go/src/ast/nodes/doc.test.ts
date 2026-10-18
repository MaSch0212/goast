import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import { goDoc } from './doc.ts';

function render(value: Parameters<GoFileBuilder['append']>[0]): string {
  // A fixed newLine keeps the expectations below host-independent.
  const builder = new GoFileBuilder('api', undefined, {
    ...defaultGoGeneratorConfig,
    newLine: '\n',
  } as GoGeneratorConfig);
  builder.append(value);
  return builder.toFragmentString().trimEnd();
}

const defaultDeprecation = 'Deprecated: This is deprecated by the API description.';

describe('goDoc', () => {
  it('writes the example of its documentation', () => {
    expect(render(goDoc('Returns the pet with the given id.', { deprecated: 'Use GetPetByID.' }))).toBe(
      ['// Returns the pet with the given id.', '//', '// Deprecated: Use GetPetByID.'].join('\n'),
    );
  });

  it('trims the surrounding whitespace of the text', () => {
    expect(render(goDoc('  Padded.  \n'))).toBe('// Padded.');
  });

  it('normalizes line breaks and removes trailing whitespace', () => {
    expect(render(goDoc('a\r\nb  \n\n\nc'))).toBe(['// a', '// b', '//', '//', '// c'].join('\n'));
  });

  it('keeps the indentation inside a line', () => {
    expect(render(goDoc('Example:\n  x := 1'))).toBe('// Example:\n//   x := 1');
  });

  it('writes a deprecation without an explanation as the default notice', () => {
    expect(render(goDoc(null, { deprecated: true }))).toBe(`// ${defaultDeprecation}`);
  });

  it('writes a deprecation after the text, separated by a blank line', () => {
    expect(render(goDoc('A pet.', { deprecated: true }))).toBe(
      ['// A pet.', '//', `// ${defaultDeprecation}`].join('\n'),
    );
  });

  it('trims the explanation of a deprecation', () => {
    expect(render(goDoc('A pet.', { deprecated: '  Use Animal.  ' }))).toBe(
      ['// A pet.', '//', '// Deprecated: Use Animal.'].join('\n'),
    );
  });

  it('uses the default notice for a blank explanation', () => {
    expect(render(goDoc('A pet.', { deprecated: '   ' }))).toBe(
      ['// A pet.', '//', `// ${defaultDeprecation}`].join('\n'),
    );
  });

  it('writes nothing when the deprecation is false', () => {
    expect(render(goDoc('A pet.', { deprecated: false }))).toBe('// A pet.');
  });

  it('writes nothing without text or deprecation', () => {
    expect(render(goDoc(null))).toBe('');
    expect(render(goDoc('   \n  '))).toBe('');
    expect(render(goDoc('A pet.', { deprecated: null }))).toBe('// A pet.');
  });

  it('starts on a new line when written after other content on the same line', () => {
    const builder = new GoFileBuilder('api', undefined, {
      ...defaultGoGeneratorConfig,
      newLine: '\n',
    } as GoGeneratorConfig);
    builder.append('x', goDoc('a'));

    expect(builder.toFragmentString()).toBe('x\n// a\n');
  });

  it('writes several doc comments through its write helper', () => {
    const builder = new GoFileBuilder('api', undefined, {
      ...defaultGoGeneratorConfig,
      newLine: '\n',
    } as GoGeneratorConfig);
    goDoc.write(builder, [goDoc('a'), goDoc('b')]);

    expect(builder.toFragmentString().trimEnd()).toBe('// a\n// b');
  });

  describe('toLines', () => {
    it('returns the comment lines, prefixed with //', () => {
      expect(goDoc('A pet.', { deprecated: 'Use Animal.' }).toLines()).toEqual([
        '// A pet.',
        '//',
        '// Deprecated: Use Animal.',
      ]);
    });

    it('returns null when there is nothing to write', () => {
      expect(goDoc(null).toLines()).toBeNull();
      expect(goDoc(' ').toLines()).toBeNull();
    });
  });
});
