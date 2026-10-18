import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csAttribute } from './attribute.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csDoc } from './doc.ts';
import { csEnumMember } from './enum-member.ts';
import { csEnum } from './enum.ts';
import { csReference } from './reference.ts';
import { csString } from './string.ts';

describe('csEnum', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write an empty enum', () => {
    builder.append(csEnum('Color', { accessModifier: 'public' }));
    expect(builder.toString(false)).toBe('public enum Color\n{\n}\n');
  });

  it('should write members separated by commas', () => {
    builder.append(csEnum('Color', { members: [csEnumMember('Red'), csEnumMember('Green'), csEnumMember('Blue')] }));
    expect(builder.toString(false)).toBe('enum Color\n{\n    Red,\n    Green,\n    Blue\n}\n');
  });

  it('should write member values', () => {
    builder.append(
      csEnum('Color', { members: [csEnumMember('Red', { value: '1' }), csEnumMember('Green', { value: '1 << 1' })] }),
    );
    expect(builder.toString(false)).toBe('enum Color\n{\n    Red = 1,\n    Green = 1 << 1\n}\n');
  });

  it('should write the underlying type', () => {
    builder.append(csEnum('Color', { underlyingType: csReference('byte'), members: [csEnumMember('Red')] }));
    expect(builder.toString(false)).toBe('enum Color : byte\n{\n    Red\n}\n');
  });

  it('should separate members with attributes or documentation by blank lines', () => {
    builder.append(
      csEnum('Color', {
        attributes: [csAttribute('JsonConverter', ['typeof(JsonStringEnumConverter<Color>)'])],
        members: [
          csEnumMember('Red', { attributes: [csAttribute('JsonStringEnumMemberName', [csString('red')])] }),
          csEnumMember('Green', {
            doc: csDoc('Green color'),
            attributes: [csAttribute('JsonStringEnumMemberName', [csString('green')])],
          }),
        ],
      }),
    );
    expect(builder.toString(false)).toBe(
      [
        '[JsonConverter(typeof(JsonStringEnumConverter<Color>))]',
        'enum Color',
        '{',
        '    [JsonStringEnumMemberName("red")]',
        '    Red,',
        '',
        '    /// <summary>',
        '    /// Green color',
        '    /// </summary>',
        '    [JsonStringEnumMemberName("green")]',
        '    Green',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('should write documentation', () => {
    builder.append(csEnum('Color', { doc: csDoc('The colors') }));
    expect(builder.toString(false)).toBe('/// <summary>\n/// The colors\n/// </summary>\nenum Color\n{\n}\n');
  });

  it('should render injections', () => {
    builder.append(csEnum('Color', { inject: { beforeName: '/*n*/' } }));
    expect(builder.toString(false)).toBe('enum /*n*/Color\n{\n}\n');
  });
});
