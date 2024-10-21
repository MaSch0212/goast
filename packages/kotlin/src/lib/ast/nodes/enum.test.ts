import { EOL } from 'node:os';

import { normalizeEOL } from '@goast/test-utils';

import { ktAnnotation } from './annotation.ts';
import { ktConstructor } from './constructor.ts';
import { ktDoc } from './doc.ts';
import { ktEnum } from './enum.ts';
import { ktEnumValue } from './enum-value.ts';
import { ktObject } from './object.ts';
import { ktParameter } from './parameter.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

describe('ktEnum', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should write enum', () => {
    builder.append(ktEnum('Foo'));
    expect(builder.toString(false)).toBe(`enum class Foo${EOL}`);
  });

  it('should write enum with values', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR'), ktEnumValue('BAZ')]));
    expect(builder.toString(false)).toBe(`enum class Foo {${EOL}    BAR, BAZ${EOL}}${EOL}`);
  });

  it('should write documenation', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { doc: ktDoc('This is a foo') }));
    expect(builder.toString(false)).toBe(
      `/**${EOL} * This is a foo${EOL} */${EOL}enum class Foo {${EOL}    BAR${EOL}}${EOL}`,
    );
  });

  it('should write annotations', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { annotations: [ktAnnotation('Deprecated')] }));
    expect(builder.toString(false)).toBe(`@Deprecated${EOL}enum class Foo {${EOL}    BAR${EOL}}${EOL}`);
  });

  it('should write access modifiers', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { accessModifier: 'private' }));
    expect(builder.toString(false)).toBe(`private enum class Foo {${EOL}    BAR${EOL}}${EOL}`);
  });

  it('should write primary constructor', () => {
    builder.append(
      ktEnum('Foo', [ktEnumValue('BAR', { arguments: ['0', '1'] })], {
        primaryConstructor: ktConstructor([ktParameter('x', 'Int'), ktParameter('y', 'Int')]),
      }),
    );
    expect(builder.toString(false)).toBe(`enum class Foo(x: Int, y: Int) {${EOL}    BAR(0, 1)${EOL}}${EOL}`);
  });

  it('should write members', () => {
    builder.append(
      ktEnum('Foo', [ktEnumValue('BAR'), ktEnumValue('BAZ')], { members: ['// Comment 1', '// Comment 2'] }),
    );
    expect(builder.toString(false)).toBe(
      `enum class Foo {${EOL}    BAR, BAZ;${EOL}${EOL}    // Comment 1${EOL}    // Comment 2${EOL}}${EOL}`,
    );
  });

  it('should write implemented interfaces', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { implements: ['Bar', 'Baz'] }));
    expect(builder.toString(false)).toBe(`enum class Foo : Bar, Baz {${EOL}    BAR${EOL}}${EOL}`);
  });

  it('should write companion object', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { companionObject: ktObject() }));
    expect(builder.toString(false)).toBe(
      `enum class Foo {${EOL}    BAR;${EOL}${EOL}    companion object {}${EOL}}${EOL}`,
    );
  });

  it('should write all options', () => {
    builder.append(
      ktEnum('Foo', [ktEnumValue('BAR', { arguments: ['0', '1'] })], {
        doc: ktDoc('This is a foo'),
        annotations: [ktAnnotation('Deprecated')],
        accessModifier: 'private',
        primaryConstructor: ktConstructor([ktParameter('x', 'Int'), ktParameter('y', 'Int')]),
        implements: ['Bar', 'Baz'],
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
        private enum class Foo(x: Int, y: Int) : Bar, Baz {
            BAR(0, 1);

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
      ktEnum('Foo', [ktEnumValue('BAR', { arguments: ['0', '1'] })], {
        doc: ktDoc('This is a foo'),
        annotations: [ktAnnotation('Deprecated')],
        accessModifier: 'private',
        primaryConstructor: ktConstructor([ktParameter('x', 'Int'), ktParameter('y', 'Int')]),
        implements: ['Bar', 'Baz'],
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
          beforePrimaryConstructor: '║bpc║',
          afterPrimaryConstructor: '║apc║',
          beforeImplements: '║bi║',
          afterImplements: '║ai║',
          beforeBody: '║bb║',
          afterBody: '║ab║',
          beforeValues: '║bv║',
          afterValues: '║av║',
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
        ║aa║║bm║private ║am║enum class ║bn║Foo║an║║bpc║(x: Int, y: Int)║apc║ : ║bi║Bar, Baz║ai║ ║bb║{
            ║bv║BAR(0, 1);

            ║av║║bm║companion object {}

            // Comment 1
            // Comment 2
            ║am║
        }║ab║
        ║a║`,
      ),
    );
  });
});
