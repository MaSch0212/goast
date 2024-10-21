import { EOL } from 'node:os';

import { tsUnionType } from './union-type.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsUnionType', () => {
  it('should write type "never" if no types are provided', () => {
    builder.append(tsUnionType([]));
    expect(builder.toString(false)).toBe('never');
  });

  it('should write the type if only one type is provided', () => {
    builder.append(tsUnionType(['string']));
    expect(builder.toString(false)).toBe('string');
  });

  it('should write the types', () => {
    builder.append(tsUnionType(['string', 'number']));
    expect(builder.toString(false)).toBe('(string) | (number)');
  });

  it('should write the types on separate lines if there are more than 3', () => {
    builder.append(tsUnionType(['string', 'number', 'boolean', 'unknown']));
    expect(builder.toString(false)).toBe(`${EOL}| (string)${EOL}| (number)${EOL}| (boolean)${EOL}| (unknown)`);
  });

  it('should collapse nested union types', () => {
    builder.append(tsUnionType([tsUnionType(['string', 'number']), tsUnionType(['boolean', 'unknown'])]));
    expect(builder.toString(false)).toBe(`${EOL}| (string)${EOL}| (number)${EOL}| (boolean)${EOL}| (unknown)`);
  });

  it('should render injections', () => {
    builder.append(
      tsUnionType(['string', 'number'], {
        inject: { before: '║b║', after: '║a║' },
      }),
    );
    expect(builder.toString(false)).toBe('║b║(string) | (number)║a║');
  });
});
