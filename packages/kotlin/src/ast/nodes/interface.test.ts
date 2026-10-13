import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { dedent } from '@goast/test-harness';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktAnnotation } from './annotation.ts';
import { ktDoc } from './doc.ts';
import { ktGenericParameter } from './generic-parameter.ts';
import { ktInterface } from './interface.ts';
import { ktObject } from './object.ts';

describe('ktInterface', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  it('should write interface', () => {
    builder.append(ktInterface('Foo'));
    expect(builder.toString(false)).toBe('interface Foo\n');
  });

  it('should write generics', () => {
    builder.append(ktInterface('Foo', { generics: [ktGenericParameter('T'), ktGenericParameter('U')] }));
    expect(builder.toString(false)).toBe('interface Foo<T, U>\n');
  });

  it('should write members', () => {
    builder.append(
      ktInterface('Foo', {
        members: ['// Comment 1', '// Comment 2'],
      }),
    );
    expect(builder.toString(false)).toBe('interface Foo {\n    // Comment 1\n    // Comment 2\n}\n');
  });

  it('should write extended interfaces', () => {
    builder.append(ktInterface('Foo', { extends: ['Bar', 'Baz'] }));
    expect(builder.toString(false)).toBe('interface Foo : Bar, Baz\n');
  });

  it('should write annotations', () => {
    builder.append(ktInterface('Foo', { annotations: [ktAnnotation('Deprecated')] }));
    expect(builder.toString(false)).toBe('@Deprecated\ninterface Foo\n');
  });

  it('should write access modifiers', () => {
    builder.append(ktInterface('Foo', { accessModifier: 'private' }));
    expect(builder.toString(false)).toBe('private interface Foo\n');
  });

  it('should write documenation', () => {
    builder.append(ktInterface('Foo', { doc: ktDoc('This is a foo') }));
    expect(builder.toString(false)).toBe('/**\n * This is a foo\n */\ninterface Foo\n');
  });

  it('should write generic parameter description', () => {
    builder.append(ktInterface('Foo', { generics: [ktGenericParameter('T', { description: 'The type' })] }));
    expect(builder.toString(false)).toBe('/**\n * @param T The type\n */\ninterface Foo<T>\n');
  });

  it('should write companion object', () => {
    builder.append(ktInterface('Foo', { companionObject: ktObject() }));
    expect(builder.toString(false)).toBe('interface Foo {\n    companion object {}\n}\n');
  });

  it('should write all options', () => {
    builder.append(
      ktInterface('Foo', {
        doc: ktDoc('This is a foo'),
        annotations: [ktAnnotation('Deprecated')],
        accessModifier: 'private',
        extends: ['Bar', 'Baz'],
        generics: [ktGenericParameter('T')],
        members: ['// Comment 1', '// Comment 2'],
        companionObject: ktObject(),
      }),
    );
    expect(builder.toString(false)).toBe(
      dedent(8)(
        `/**
         * This is a foo
         */
        @Deprecated
        private interface Foo<T> : Bar, Baz {
            companion object {}

            // Comment 1
            // Comment 2
        }
        `,
      ),
    );
  });

  it('should render injections', () => {
    builder.append(
      ktInterface('Foo', {
        doc: ktDoc('This is a foo'),
        annotations: [ktAnnotation('Deprecated')],
        accessModifier: 'private',
        extends: ['Bar', 'Baz'],
        generics: [ktGenericParameter('T')],
        members: ['// Comment 1', '// Comment 2'],
        companionObject: ktObject(),
        inject: {
          before: '║b║',
          after: '║a║',
          beforeDoc: '║bd║',
          afterDoc: '║ad║',
          beforeAnnotations: '║ba║',
          afterAnnotations: '║aa║',
          beforeModifiers: '║bm║',
          afterModifiers: '║am║',
          beforeName: '║bn║',
          afterName: '║an║',
          beforeGenerics: '║bg║',
          afterGenerics: '║ag║',
          beforeExtends: '║be║',
          afterExtends: '║ae║',
          beforeBody: '║bb║',
          afterBody: '║ab║',
          beforeMembers: '║bm║',
          afterMembers: '║am║',
        },
      }),
    );
    expect(builder.toString(false)).toBe(
      dedent(8)(
        `║b║║bd║
        /**
         * This is a foo
         */
        ║ad║║ba║@Deprecated
        ║aa║║bm║private ║am║interface ║bn║Foo║an║║bg║<T>║ag║ : ║be║Bar, Baz║ae║ ║bb║{
            ║bm║companion object {}

            // Comment 1
            // Comment 2
            ║am║
        }║ab║
        ║a║`,
      ),
    );
  });
});
