import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { dedent } from '@goast/test-harness';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktAnnotation } from './annotation.ts';
import { ktDoc } from './doc.ts';
import { ktEnumValue } from './enum-value.ts';

describe('ktEnumValue', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  it('should write enum value', () => {
    builder.append(ktEnumValue('FOO'));
    expect(builder.toString(false)).toBe('FOO');
  });

  it('should write enum value with arguments', () => {
    builder.append(ktEnumValue('FOO', { arguments: ['x', 'y'] }));
    expect(builder.toString(false)).toBe('FOO(x, y)');
  });

  it('should write enum value with documenation', () => {
    builder.append(ktEnumValue('FOO', { doc: ktDoc('This is a foo') }));
    expect(builder.toString(false)).toBe('/**\n * This is a foo\n */\nFOO');
  });

  it('should write enum value with annotations', () => {
    builder.append(ktEnumValue('FOO', { annotations: [ktAnnotation('Deprecated')] }));
    expect(builder.toString(false)).toBe('@Deprecated\nFOO');
  });

  it('should write enum value with members', () => {
    builder.append(
      ktEnumValue('FOO', {
        members: ['// Comment 1', '// Comment 2'],
      }),
    );
    expect(builder.toString(false)).toBe('FOO {\n    // Comment 1\n    // Comment 2\n}');
  });

  it('should write enum value with all options', () => {
    builder.append(
      ktEnumValue('FOO', {
        doc: ktDoc('This is a foo'),
        annotations: [ktAnnotation('Deprecated')],
        arguments: ['x', 'y'],
        members: ['// Comment 1', '// Comment 2'],
      }),
    );
    expect(builder.toString(false)).toBe(
      dedent(8)(
        `/**
         * This is a foo
         */
        @Deprecated
        FOO(x, y) {
            // Comment 1
            // Comment 2
        }`,
      ),
    );
  });

  it('should render injections', () => {
    builder.append(
      ktEnumValue('FOO', {
        doc: ktDoc('This is a foo'),
        annotations: [ktAnnotation('Deprecated')],
        arguments: ['x', 'y'],
        members: ['// Comment 1', '// Comment 2'],
        inject: {
          before: '║b║',
          after: '║a║',
          beforeDoc: '║bd║',
          afterDoc: '║ad║',
          beforeAnnotations: '║ba║',
          afterAnnotations: '║aa║',
          beforeName: '║bn║',
          afterName: '║an║',
          beforeArguments: '║ba║',
          afterArguments: '║aa║',
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
        ║aa║║bn║FOO║an║║ba║(x, y)║aa║ ║bb║{
            ║bm║// Comment 1
            // Comment 2
            ║am║
        }║ab║║a║`,
      ),
    );
  });
});

describe('writeKtEnumValues', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  it('should write enum values in single line', () => {
    ktEnumValue.write(builder, [ktEnumValue('FOO'), ktEnumValue('BAR')]);
    expect(builder.toString(false)).toBe('FOO, BAR');
  });

  it('should write enum values in multiline', () => {
    ktEnumValue.write(builder, [
      ktEnumValue('FOO'),
      ktEnumValue('BAR'),
      ktEnumValue('BAZ'),
      ktEnumValue('QUX'),
      ktEnumValue('QUUX'),
    ]);
    expect(builder.toString(false)).toBe('FOO,\nBAR,\nBAZ,\nQUX,\nQUUX');
  });

  it('should write enum values with space between', () => {
    ktEnumValue.write(builder, [
      ktEnumValue('FOO'),
      ktEnumValue('BAR', { annotations: [ktAnnotation('Deprecated')] }),
      ktEnumValue('BAZ'),
    ]);
    expect(builder.toString(false)).toBe('FOO,\n\n@Deprecated\nBAR,\n\nBAZ');
  });
});
