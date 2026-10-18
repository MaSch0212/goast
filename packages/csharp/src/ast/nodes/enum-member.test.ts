import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csAttribute } from './attribute.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csDoc } from './doc.ts';
import { csEnumMember } from './enum-member.ts';

describe('csEnumMember', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write the name', () => {
    builder.append(csEnumMember('Red'));
    expect(builder.toString(false)).toBe('Red');
  });

  it('should write a value', () => {
    builder.append(csEnumMember('Red', { value: '2' }));
    expect(builder.toString(false)).toBe('Red = 2');
  });

  it('should write a value of zero', () => {
    builder.append(csEnumMember('None', { value: '0' }));
    expect(builder.toString(false)).toBe('None = 0');
  });

  it('should write attributes and documentation', () => {
    builder.append(csEnumMember('Red', { doc: csDoc('Red'), attributes: [csAttribute('Obsolete')] }));
    expect(builder.toString(false)).toBe('/// <summary>\n/// Red\n/// </summary>\n[Obsolete]\nRed');
  });

  it('should render injections', () => {
    builder.append(csEnumMember('Red', { inject: { beforeName: '/*n*/' } }));
    expect(builder.toString(false)).toBe('/*n*/Red');
  });

  describe('write', () => {
    it('should write members separated by commas', () => {
      csEnumMember.write(builder, [csEnumMember('A'), csEnumMember('B')]);
      expect(builder.toString(false)).toBe('A,\nB');
    });
  });
});
