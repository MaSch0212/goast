import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsArgument } from './argument.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  // A fixed newLine keeps the expectations below host-independent.
  builder = new TypeScriptFileBuilder(
    undefined,
    { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
  );
});

describe('tsArgument', () => {
  it('should write the argument value', () => {
    builder.append(tsArgument('42'));
    expect(builder.toString(false)).toBe('42');
  });

  it('should write injections', () => {
    builder.append(tsArgument('42', { inject: { before: '║b║', after: '║a║' } }));
    expect(builder.toString(false)).toBe(`║b║42║a║`);
  });

  describe('write', () => {
    it('should write parantheses even if there are no arguments', () => {
      tsArgument.write(builder, []);
      expect(builder.toString(false)).toBe('()');
    });

    it('should write the arguments', () => {
      tsArgument.write(builder, ['42', 'true']);
      expect(builder.toString(false)).toBe('(42, true)');
    });

    it('should write multiline if there are more than 2 arguments', () => {
      tsArgument.write(builder, ['42', 'true', 'false']);
      expect(builder.toString(false)).toBe('(\n  42,\n  true,\n  false\n)');
    });
  });
});
