import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktObject } from './object.ts';

describe('ktObject', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  it('should write object', () => {
    builder.append(ktObject());
    expect(builder.toString(false)).toBe('object {}');
  });

  it('should write object with name', () => {
    builder.append(ktObject({ name: 'Foo' }));
    expect(builder.toString(false)).toBe('object Foo {}\n');
  });

  it('should write data object', () => {
    builder.append(ktObject({ name: 'Foo', data: true }));
    expect(builder.toString(false)).toBe('data object Foo {}\n');
  });

  it('should write base class', () => {
    builder.append(ktObject({ class: 'Bar' }));
    expect(builder.toString(false)).toBe('object : Bar() {}');
  });

  it('should write base class arguments', () => {
    builder.append(ktObject({ class: 'Bar', classArguments: ['1', '2'] }));
    expect(builder.toString(false)).toBe('object : Bar(1, 2) {}');
  });

  it('should write implemented interfaces', () => {
    builder.append(ktObject({ implements: ['Bar', 'Baz'] }));
    expect(builder.toString(false)).toBe('object : Bar, Baz {}');
  });

  it('should write object with members', () => {
    builder.append(
      ktObject({
        members: ['// Comment 1', '// Comment 2'],
      }),
    );
    expect(builder.toString(false)).toBe('object {\n    // Comment 1\n    // Comment 2\n}');
  });

  it('should write object with all options', () => {
    builder.append(
      ktObject({
        name: 'Foo',
        data: true,
        class: 'Bar',
        classArguments: ['1', '2'],
        implements: ['Bar', 'Baz'],
        members: ['// Comment 1', '// Comment 2'],
      }),
    );
    expect(builder.toString(false)).toBe(
      'data object Foo : Bar(1, 2), Bar, Baz {\n    // Comment 1\n    // Comment 2\n}\n',
    );
  });

  it('should render injections', () => {
    builder.append(
      ktObject({
        name: 'Foo',
        data: true,
        class: 'Bar',
        classArguments: ['1', '2'],
        implements: ['Bar', 'Baz'],
        members: ['// Comment 1', '// Comment 2'],
        inject: {
          before: '║b║',
          after: '║a║',
          beforeModifiers: '║bm║',
          afterModifiers: '║am║',
          beforeName: '║bn║',
          afterName: '║an║',
          beforeInheritList: '║bi║',
          afterInheritList: '║ai║',
          beforeBody: '║bb║',
          afterBody: '║ab║',
          beforeMembers: '║bm║',
          afterMembers: '║am║',
        },
      }),
    );
    expect(builder.toString(false)).toBe(
      '║b║║bm║data ║am║object ║bn║Foo║an║ : ║bi║Bar(1, 2), Bar, Baz║ai║ ║bb║{\n    ║bm║// Comment 1\n    // Comment 2\n    ║am║\n}║ab║\n║a║',
    );
  });
});
