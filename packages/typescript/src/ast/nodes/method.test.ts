import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { dedent } from '@goast/test-harness';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsDecorator } from './decorator.ts';
import { tsDoc } from './doc.ts';
import { tsGenericParameter } from './generic-parameter.ts';
import { tsMethod } from './method.ts';
import { tsParameter } from './parameter.ts';

describe('tsMethod', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new TypeScriptFileBuilder(
      undefined,
      { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
    );
  });

  it('should write the name of the method', () => {
    builder.append(tsMethod('x'));
    expect(builder.toString(false)).toBe('x();\n');
  });

  it('should write the generics if they exist', () => {
    builder.append(tsMethod('x', { generics: [tsGenericParameter('T'), tsGenericParameter('U')] }));
    expect(builder.toString(false)).toBe('x<T, U>();\n');
  });

  it('should write the parameters if they exist', () => {
    builder.append(tsMethod('x', { parameters: [tsParameter('y'), tsParameter('z')] }));
    expect(builder.toString(false)).toBe('x(y, z);\n');
  });

  it('should write the return type if it exists', () => {
    builder.append(tsMethod('x', { returnType: 'number' }));
    expect(builder.toString(false)).toBe('x(): number;\n');
  });

  it('should write the body if it exists', () => {
    builder.append(tsMethod('x', { body: 'return 42;' }));
    expect(builder.toString(false)).toBe('x() {\n  return 42;\n}\n');
  });

  it('should write the accessibility if it exists', () => {
    builder.append(tsMethod('x', { accessModifier: 'public' }));
    expect(builder.toString(false)).toBe('public x();\n');
  });

  it('should write the static keyword if the method is static', () => {
    builder.append(tsMethod('x', { static: true }));
    expect(builder.toString(false)).toBe('static x();\n');
  });

  it('should write the abstract keyword if the method is abstract', () => {
    builder.append(tsMethod('x', { abstract: true }));
    expect(builder.toString(false)).toBe('abstract x();\n');
  });

  it('should write the override keyword if the method is override', () => {
    builder.append(tsMethod('x', { override: true }));
    expect(builder.toString(false)).toBe('override x();\n');
  });

  it('should write the optional symbol if the method is optional', () => {
    builder.append(tsMethod('x', { optional: true }));
    expect(builder.toString(false)).toBe('x?();\n');
  });

  it('should write documenation if it exists', () => {
    builder.append(tsMethod('x', { doc: tsDoc({ description: 'description' }) }));
    expect(builder.toString(false)).toBe('/**\n * description\n */\nx();\n');
  });

  it('should write parameter documentation if it exists', () => {
    builder.append(
      tsMethod('x', {
        parameters: [tsParameter('y', { description: 'description' })],
      }),
    );
    expect(builder.toString(false)).toBe('/**\n * @param y description\n */\nx(y);\n');
  });

  it('should write generic parameter documentation if it exists', () => {
    builder.append(
      tsMethod('x', {
        generics: [tsGenericParameter('T', { description: 'description' })],
      }),
    );
    expect(builder.toString(false)).toBe('/**\n * @template T description\n */\nx<T>();\n');
  });

  it('should write decorators if they exist', () => {
    builder.append(tsMethod('x', { decorators: [tsDecorator('decorator')] }));
    expect(builder.toString(false)).toBe('@decorator\nx();\n');
  });

  it('should write all the parts of the method', () => {
    builder.append(
      tsMethod('x', {
        doc: tsDoc({ description: 'description' }),
        decorators: [tsDecorator('decorator')],
        generics: [tsGenericParameter('T'), tsGenericParameter('U', { description: 'description for U' })],
        parameters: [tsParameter('y'), tsParameter('z', { description: 'description for z' })],
        returnType: 'number',
        body: 'return 42;',
        accessModifier: 'public',
        static: true,
        abstract: true,
        override: true,
        optional: true,
      }),
    );
    expect(builder.toString(false)).toBe(
      dedent(8)(
        `/**
         * description
         *
         * @template U description for U
         * @param z description for z
         */
        @decorator
        public static abstract override x?<T, U>(y, z): number {
          return 42;
        }
        `,
      ),
    );
  });

  it('should render injections', () => {
    builder.append(
      tsMethod('x', {
        doc: tsDoc({ description: 'description' }),
        decorators: [tsDecorator('decorator')],
        generics: [tsGenericParameter('T'), tsGenericParameter('U', { description: 'description for U' })],
        parameters: [tsParameter('y'), tsParameter('z', { description: 'description for z' })],
        returnType: 'number',
        body: 'return 42;',
        accessModifier: 'public',
        static: true,
        abstract: true,
        override: true,
        optional: true,
        inject: {
          before: '║b║',
          after: '║a║',
          beforeDoc: '║bd║',
          afterDoc: '║ad║',
          beforeDecorators: '║bds║',
          afterDecorators: '║ads║',
          beforeModifiers: '║bm║',
          afterModifiers: '║am║',
          beforeName: '║bn║',
          afterName: '║an║',
          beforeGenerics: '║bg║',
          afterGenerics: '║ag║',
          beforeParams: '║bp║',
          afterParams: '║ap║',
          beforeReturnType: '║brt║',
          afterReturnType: '║art║',
          beforeBody: '║bb║',
          afterBody: '║ab║',
        },
      }),
    );
    expect(builder.toString(false)).toBe(
      dedent(8)(
        `║b║║bd║
        /**
         * description
         *
         * @template U description for U
         * @param z description for z
         */
        ║ad║║bds║@decorator
        ║ads║║bm║public static abstract override ║am║║bn║x║an║?║bg║<T, U>║ag║║bp║(y, z)║ap║: ║brt║number║art║ ║bb║{
          return 42;
        }║ab║
        ║a║`,
      ),
    );
  });
});
