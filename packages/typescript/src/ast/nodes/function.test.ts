import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { dedent } from '@goast/test-harness';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsDecorator } from './decorator.ts';
import { tsDoc } from './doc.ts';
import { tsFunction } from './function.ts';
import { tsGenericParameter } from './generic-parameter.ts';
import { tsParameter } from './parameter.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  // A fixed newLine keeps the expectations below host-independent.
  builder = new TypeScriptFileBuilder(
    undefined,
    { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
  );
});

describe('tsFunction', () => {
  it('should write the name of the function', () => {
    builder.append(tsFunction('X'));
    expect(builder.toString(false)).toBe('function X() {}\n');
  });

  it('should write the generics if they exist', () => {
    builder.append(tsFunction('X', { generics: [tsGenericParameter('T'), tsGenericParameter('U')] }));
    expect(builder.toString(false)).toBe('function X<T, U>() {}\n');
  });

  it('should write the parameters if they exist', () => {
    builder.append(tsFunction('X', { parameters: [tsParameter('y'), tsParameter('z')] }));
    expect(builder.toString(false)).toBe('function X(y, z) {}\n');
  });

  it('should write the return type if it exists', () => {
    builder.append(tsFunction('X', { returnType: 'number' }));
    expect(builder.toString(false)).toBe('function X(): number {}\n');
  });

  it('should write the body if it exists', () => {
    builder.append(tsFunction('X', { body: 'return 42;' }));
    expect(builder.toString(false)).toBe('function X() {\n  return 42;\n}\n');
  });

  it('should write export keyword if configured', () => {
    builder.append(tsFunction('X', { export: true }));
    expect(builder.toString(false)).toBe('export function X() {}\n');
  });

  it('should write documenation if it exists', () => {
    builder.append(tsFunction('X', { doc: tsDoc({ description: 'description' }) }));
    expect(builder.toString(false)).toBe('/**\n * description\n */\nfunction X() {}\n');
  });

  it('should write decorators if they exist', () => {
    builder.append(tsFunction('X', { decorators: [tsDecorator('decorator')] }));
    expect(builder.toString(false)).toBe('@decorator\nfunction X() {}\n');
  });

  it('should write all the parts of the function', () => {
    builder.append(
      tsFunction('X', {
        doc: tsDoc({ description: 'description' }),
        decorators: [tsDecorator('decorator')],
        generics: [tsGenericParameter('T'), tsGenericParameter('U')],
        parameters: [tsParameter('y'), tsParameter('z')],
        returnType: 'number',
        body: 'return 42;',
        export: true,
      }),
    );
    expect(builder.toString(false)).toBe(
      dedent(8)(
        `/**
         * description
         */
        @decorator
        export function X<T, U>(y, z): number {
          return 42;
        }
        `,
      ),
    );
  });

  it('should render injections', () => {
    builder.append(
      tsFunction('X', {
        doc: tsDoc({ description: 'description' }),
        decorators: [tsDecorator('decorator')],
        generics: [tsGenericParameter('T'), tsGenericParameter('U')],
        parameters: [tsParameter('y'), tsParameter('z')],
        returnType: 'number',
        body: 'return 42;',
        export: true,
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
         */
        ║ad║║bds║@decorator
        ║ads║║bm║export ║am║function ║bn║X║an║║bg║<T, U>║ag║║bp║(y, z)║ap║: ║brt║number║art║ ║bb║{
          return 42;
        }║ab║
        ║a║`,
      ),
    );
  });
});
