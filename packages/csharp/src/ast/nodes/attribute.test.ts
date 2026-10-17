import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csArgument } from './argument.ts';
import { csAttribute } from './attribute.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csReference } from './reference.ts';
import { csString } from './string.ts';

describe('csAttribute', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write an attribute without arguments', () => {
    builder.append(csAttribute('Required'));
    expect(builder.toString(false)).toBe('[Required]');
  });

  it('should write positional arguments', () => {
    builder.append(csAttribute('Range', ['1', csString('a')]));
    expect(builder.toString(false)).toBe('[Range(1, "a")]');
  });

  it('should write constructor arguments by name', () => {
    builder.append(csAttribute('Foo', [csArgument.named('value', '1')]));
    expect(builder.toString(false)).toBe('[Foo(value: 1)]');
  });

  it('should write named properties after positional arguments', () => {
    builder.append(csAttribute('StringLength', ['10'], { properties: { MinimumLength: '2' } }));
    expect(builder.toString(false)).toBe('[StringLength(10, MinimumLength = 2)]');
  });

  it('should write only named properties', () => {
    builder.append(
      csAttribute('JsonPolymorphic', null, { properties: { TypeDiscriminatorPropertyName: csString('type') } }),
    );
    expect(builder.toString(false)).toBe('[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]');
  });

  it('should skip nullish properties', () => {
    builder.append(csAttribute('Foo', null, { properties: { A: '1', B: null, C: undefined } }));
    expect(builder.toString(false)).toBe('[Foo(A = 1)]');
  });

  it('should write the target', () => {
    builder.append(csAttribute('JsonPropertyName', [csString('id')], { target: 'property' }));
    expect(builder.toString(false)).toBe('[property: JsonPropertyName("id")]');
  });

  it('should write a reference and register its using', () => {
    builder.append(csAttribute(csReference('Obsolete', 'System')));
    expect(builder.toString(false)).toBe('[Obsolete]');
    expect(builder.usings.usings).toEqual(['System']);
  });

  it('should write generic attributes', () => {
    builder.append(csAttribute(csReference('Produces', null, { generics: [csReference('Pet')] })));
    expect(builder.toString(false)).toBe('[Produces<Pet>]');
  });

  it('should render injections', () => {
    builder.append(csAttribute('Foo', ['1'], { inject: { beforeName: '/*a*/', afterArguments: '/*b*/' } }));
    expect(builder.toString(false)).toBe('[/*a*/Foo(1)/*b*/]');
  });

  describe('write', () => {
    it('should write attributes inline separated by spaces', () => {
      csAttribute.write(builder, [csAttribute('A'), csAttribute('B')]);
      expect(builder.toString(false)).toBe('[A] [B] ');
    });

    it('should write attributes on separate lines when multiline', () => {
      csAttribute.write(builder, [csAttribute('A'), csAttribute('B')], { multiline: true });
      expect(builder.toString(false)).toBe('[A]\n[B]\n');
    });
  });
});
