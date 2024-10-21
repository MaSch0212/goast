import { tsString } from './string.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsString', () => {
  it('should write the string', () => {
    builder.append(tsString('X'));
    expect(builder.toString(false)).toBe(`'X'`);
  });

  it('should use double quotes if configured', () => {
    builder.options.useSingleQuotes = false;
    builder.append(tsString('X'));
    expect(builder.toString(false)).toBe(`"X"`);
  });

  it('should write the string as template string if configured', () => {
    builder.append(tsString('X', { template: true }));
    expect(builder.toString(false)).toBe('`X`');
  });

  it('should write the injections', () => {
    builder.append(tsString('X', { inject: { before: '║b║', after: '║a║' } }));
    expect(builder.toString(false)).toBe(`║b║'X'║a║`);
  });
});
