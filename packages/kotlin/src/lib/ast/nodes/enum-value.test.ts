import { EOL } from 'node:os';

import { normalizeEOL } from '@goast/test-utils';

import { ktAnnotation } from './annotation.ts';
import { ktDoc } from './doc.ts';
import { ktEnumValue } from './enum-value.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

describe('ktEnumValue', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
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
    expect(builder.toString(false)).toBe(`/**${EOL} * This is a foo${EOL} */${EOL}FOO`);
  });

  it('should write enum value with annotations', () => {
    builder.append(ktEnumValue('FOO', { annotations: [ktAnnotation('Deprecated')] }));
    expect(builder.toString(false)).toBe(`@Deprecated${EOL}FOO`);
  });

  it('should write enum value with members', () => {
    builder.append(
      ktEnumValue('FOO', {
        members: ['// Comment 1', '// Comment 2'],
      }),
    );
    expect(builder.toString(false)).toBe(`FOO {${EOL}    // Comment 1${EOL}    // Comment 2${EOL}}`);
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
      normalizeEOL(8)(
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
      normalizeEOL(8)(
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
    builder = new KotlinFileBuilder();
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
    expect(builder.toString(false)).toBe(`FOO,${EOL}BAR,${EOL}BAZ,${EOL}QUX,${EOL}QUUX`);
  });

  it('should write enum values with space between', () => {
    ktEnumValue.write(builder, [
      ktEnumValue('FOO'),
      ktEnumValue('BAR', { annotations: [ktAnnotation('Deprecated')] }),
      ktEnumValue('BAZ'),
    ]);
    expect(builder.toString(false)).toBe(`FOO,${EOL}${EOL}@Deprecated${EOL}BAR,${EOL}${EOL}BAZ`);
  });
});
