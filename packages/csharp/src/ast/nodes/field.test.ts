import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csAttribute } from './attribute.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csDoc } from './doc.ts';
import { csField } from './field.ts';
import { csString } from './string.ts';

describe('csField', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write a field', () => {
    builder.append(csField('_count', { type: 'int', accessModifier: 'private' }));
    expect(builder.toString(false)).toBe('private int _count;\n');
  });

  it('should write a readonly field with an initializer', () => {
    builder.append(
      csField('_options', { type: 'Options', accessModifier: 'private', readonly: true, initializer: 'new()' }),
    );
    expect(builder.toString(false)).toBe('private readonly Options _options = new();\n');
  });

  it('should write a static readonly field', () => {
    builder.append(csField('Default', { type: 'Foo', accessModifier: 'public', static: true, readonly: true }));
    expect(builder.toString(false)).toBe('public static readonly Foo Default;\n');
  });

  it('should write a constant', () => {
    builder.append(
      csField('Name', { type: 'string', accessModifier: 'public', const: true, initializer: csString('x') }),
    );
    expect(builder.toString(false)).toBe('public const string Name = "x";\n');
  });

  it('should write attributes and documentation', () => {
    builder.append(csField('_x', { type: 'int', doc: csDoc('The x'), attributes: [csAttribute('NonSerialized')] }));
    expect(builder.toString(false)).toBe('/// <summary>\n/// The x\n/// </summary>\n[NonSerialized]\nint _x;\n');
  });

  it('should render injections', () => {
    builder.append(csField('_x', { type: 'int', inject: { beforeName: '/*n*/' } }));
    expect(builder.toString(false)).toBe('int /*n*/_x;\n');
  });
});
