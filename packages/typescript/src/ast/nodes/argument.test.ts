import { EOL } from 'node:os';

import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsArgument } from './argument.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
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
      expect(builder.toString(false)).toBe(`(${EOL}  42,${EOL}  true,${EOL}  false${EOL})`);
    });
  });
});
