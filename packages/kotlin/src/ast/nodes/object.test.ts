import { EOL } from 'node:os';

import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktObject } from './object.ts';

describe('ktObject', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write object', () => {
    builder.append(ktObject());
    expect(builder.toString(false)).toBe(`object {}`);
  });

  it('should write object with name', () => {
    builder.append(ktObject({ name: 'Foo' }));
    expect(builder.toString(false)).toBe(`object Foo {}${EOL}`);
  });

  it('should write data object', () => {
    builder.append(ktObject({ name: 'Foo', data: true }));
    expect(builder.toString(false)).toBe(`data object Foo {}${EOL}`);
  });

  it('should write base class', () => {
    builder.append(ktObject({ class: 'Bar' }));
    expect(builder.toString(false)).toBe(`object : Bar() {}`);
  });

  it('should write base class arguments', () => {
    builder.append(ktObject({ class: 'Bar', classArguments: ['1', '2'] }));
    expect(builder.toString(false)).toBe(`object : Bar(1, 2) {}`);
  });

  it('should write implemented interfaces', () => {
    builder.append(ktObject({ implements: ['Bar', 'Baz'] }));
    expect(builder.toString(false)).toBe(`object : Bar, Baz {}`);
  });

  it('should write object with members', () => {
    builder.append(
      ktObject({
        members: ['// Comment 1', '// Comment 2'],
      }),
    );
    expect(builder.toString(false)).toBe(`object {${EOL}    // Comment 1${EOL}    // Comment 2${EOL}}`);
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
      `data object Foo : Bar(1, 2), Bar, Baz {${EOL}    // Comment 1${EOL}    // Comment 2${EOL}}${EOL}`,
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
      `║b║║bm║data ║am║object ║bn║Foo║an║ : ║bi║Bar(1, 2), Bar, Baz║ai║ ║bb║{${EOL}    ║bm║// Comment 1${EOL}    // Comment 2${EOL}    ║am║${EOL}}║ab║${EOL}║a║`,
    );
  });
});
