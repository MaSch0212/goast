import { EOL } from 'node:os';

import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { normalizeEOL } from '@goast/test-utils';

import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktAnnotation } from './annotation.ts';
import { ktDoc } from './doc.ts';
import { ktGenericParameter } from './generic-parameter.ts';
import { ktInterface } from './interface.ts';
import { ktObject } from './object.ts';

describe('ktInterface', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write interface', () => {
    builder.append(ktInterface('Foo'));
    expect(builder.toString(false)).toBe(`interface Foo${EOL}`);
  });

  it('should write generics', () => {
    builder.append(ktInterface('Foo', { generics: [ktGenericParameter('T'), ktGenericParameter('U')] }));
    expect(builder.toString(false)).toBe(`interface Foo<T, U>${EOL}`);
  });

  it('should write members', () => {
    builder.append(
      ktInterface('Foo', {
        members: ['// Comment 1', '// Comment 2'],
      }),
    );
    expect(builder.toString(false)).toBe(`interface Foo {${EOL}    // Comment 1${EOL}    // Comment 2${EOL}}${EOL}`);
  });

  it('should write extended interfaces', () => {
    builder.append(ktInterface('Foo', { extends: ['Bar', 'Baz'] }));
    expect(builder.toString(false)).toBe(`interface Foo : Bar, Baz${EOL}`);
  });

  it('should write annotations', () => {
    builder.append(ktInterface('Foo', { annotations: [ktAnnotation('Deprecated')] }));
    expect(builder.toString(false)).toBe(`@Deprecated${EOL}interface Foo${EOL}`);
  });

  it('should write access modifiers', () => {
    builder.append(ktInterface('Foo', { accessModifier: 'private' }));
    expect(builder.toString(false)).toBe(`private interface Foo${EOL}`);
  });

  it('should write documenation', () => {
    builder.append(ktInterface('Foo', { doc: ktDoc('This is a foo') }));
    expect(builder.toString(false)).toBe(`/**${EOL} * This is a foo${EOL} */${EOL}interface Foo${EOL}`);
  });

  it('should write generic parameter description', () => {
    builder.append(ktInterface('Foo', { generics: [ktGenericParameter('T', { description: 'The type' })] }));
    expect(builder.toString(false)).toBe(`/**${EOL} * @param T The type${EOL} */${EOL}interface Foo<T>${EOL}`);
  });

  it('should write companion object', () => {
    builder.append(ktInterface('Foo', { companionObject: ktObject() }));
    expect(builder.toString(false)).toBe(`interface Foo {${EOL}    companion object {}${EOL}}${EOL}`);
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
      normalizeEOL(8)(
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
      normalizeEOL(8)(
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
