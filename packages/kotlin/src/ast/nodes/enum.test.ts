import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { dedent } from '@goast/test-harness';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktAnnotation } from './annotation.ts';
import { ktConstructor } from './constructor.ts';
import { ktDoc } from './doc.ts';
import { ktEnumValue } from './enum-value.ts';
import { ktEnum } from './enum.ts';
import { ktObject } from './object.ts';
import { ktParameter } from './parameter.ts';

describe('ktEnum', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  it('should write enum', () => {
    builder.append(ktEnum('Foo'));
    expect(builder.toString(false)).toBe('enum class Foo\n');
  });

  it('should write enum with values', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR'), ktEnumValue('BAZ')]));
    expect(builder.toString(false)).toBe('enum class Foo {\n    BAR, BAZ\n}\n');
  });

  it('should write documenation', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { doc: ktDoc('This is a foo') }));
    expect(builder.toString(false)).toBe(
      '/**\n * This is a foo\n */\nenum class Foo {\n    BAR\n}\n',
    );
  });

  it('should write annotations', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { annotations: [ktAnnotation('Deprecated')] }));
    expect(builder.toString(false)).toBe('@Deprecated\nenum class Foo {\n    BAR\n}\n');
  });

  it('should write access modifiers', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { accessModifier: 'private' }));
    expect(builder.toString(false)).toBe('private enum class Foo {\n    BAR\n}\n');
  });

  it('should write primary constructor', () => {
    builder.append(
      ktEnum('Foo', [ktEnumValue('BAR', { arguments: ['0', '1'] })], {
        primaryConstructor: ktConstructor([ktParameter('x', 'Int'), ktParameter('y', 'Int')]),
      }),
    );
    expect(builder.toString(false)).toBe('enum class Foo(x: Int, y: Int) {\n    BAR(0, 1)\n}\n');
  });

  it('should write members', () => {
    builder.append(
      ktEnum('Foo', [ktEnumValue('BAR'), ktEnumValue('BAZ')], { members: ['// Comment 1', '// Comment 2'] }),
    );
    expect(builder.toString(false)).toBe(
      'enum class Foo {\n    BAR, BAZ;\n\n    // Comment 1\n    // Comment 2\n}\n',
    );
  });

  it('should write implemented interfaces', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { implements: ['Bar', 'Baz'] }));
    expect(builder.toString(false)).toBe('enum class Foo : Bar, Baz {\n    BAR\n}\n');
  });

  it('should write companion object', () => {
    builder.append(ktEnum('Foo', [ktEnumValue('BAR')], { companionObject: ktObject() }));
    expect(builder.toString(false)).toBe(
      'enum class Foo {\n    BAR;\n\n    companion object {}\n}\n',
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
      dedent(8)(
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
      dedent(8)(
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
