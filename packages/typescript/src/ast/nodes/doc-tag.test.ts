import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsDocTag } from './doc-tag.ts';

describe('tsDocTag', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new TypeScriptFileBuilder(
      undefined,
      { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
    );
  });

  it('should write a custom tag', () => {
    builder
      .appendLine(tsDocTag('custom'))
      .appendLine(tsDocTag('custom', { type: 'number' }))
      .appendLine(tsDocTag('custom', { text: 'description' }))
      .append(tsDocTag('custom', { type: 'number', text: 'description' }));
    expect(builder.toString(false)).toBe(
      '@custom\n@custom {number}\n@custom description\n@custom {number} description',
    );
  });

  it('should render injections', () => {
    builder.append(tsDocTag('custom', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`before@customafter`);
  });

  it('should write author tag', () => {
    builder.appendLine(tsDocTag('author', 'John Doe')).append(tsDocTag('author', 'John Doe', 'john.doe@gmail.com'));
    expect(builder.toString(false)).toBe('@author John Doe\n@author John Doe <john.doe@gmail.com>');
  });

  it('should write access tag', () => {
    builder.append(tsDocTag('access', 'public'));
    expect(builder.toString(false)).toBe('@access public');
  });
});
