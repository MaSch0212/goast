import { EOL } from 'os';

import { normalizeEOL } from 'test/utils/string.utils';

import { tsDecorator } from './decorator';
import { tsDoc } from './doc';
import { tsGenericParameter } from './generic-parameter';
import { tsMethod } from './method';
import { tsParameter } from './parameter';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write the name of the method', () => {
  builder.append(tsMethod('x'));
  expect(builder.toString(false)).toBe('x();' + EOL);
});

it('should write the generics if they exist', () => {
  builder.append(tsMethod('x', { generics: [tsGenericParameter('T'), tsGenericParameter('U')] }));
  expect(builder.toString(false)).toBe('x<T, U>();' + EOL);
});

it('should write the parameters if they exist', () => {
  builder.append(tsMethod('x', { parameters: [tsParameter('y'), tsParameter('z')] }));
  expect(builder.toString(false)).toBe('x(y, z);' + EOL);
});

it('should write the return type if it exists', () => {
  builder.append(tsMethod('x', { returnType: 'number' }));
  expect(builder.toString(false)).toBe('x(): number;' + EOL);
});

it('should write the body if it exists', () => {
  builder.append(tsMethod('x', { body: 'return 42;' }));
  expect(builder.toString(false)).toBe(`x() {${EOL}  return 42;${EOL}}${EOL}`);
});

it('should write the accessibility if it exists', () => {
  builder.append(tsMethod('x', { accessModifier: 'public' }));
  expect(builder.toString(false)).toBe('public x();' + EOL);
});

it('should write the static keyword if the method is static', () => {
  builder.append(tsMethod('x', { static: true }));
  expect(builder.toString(false)).toBe('static x();' + EOL);
});

it('should write the abstract keyword if the method is abstract', () => {
  builder.append(tsMethod('x', { abstract: true }));
  expect(builder.toString(false)).toBe('abstract x();' + EOL);
});

it('should write the override keyword if the method is override', () => {
  builder.append(tsMethod('x', { override: true }));
  expect(builder.toString(false)).toBe('override x();' + EOL);
});

it('should write the optional symbol if the method is optional', () => {
  builder.append(tsMethod('x', { optional: true }));
  expect(builder.toString(false)).toBe('x?();' + EOL);
});

it('should write documenation if it exists', () => {
  builder.append(tsMethod('x', { doc: tsDoc({ description: 'description' }) }));
  expect(builder.toString(false)).toBe(`/**${EOL} * description${EOL} */${EOL}x();${EOL}`);
});

it('should write parameter documentation if it exists', () => {
  builder.append(
    tsMethod('x', {
      parameters: [tsParameter('y', { description: 'description' })],
    }),
  );
  expect(builder.toString(false)).toBe(`/**${EOL} * @param y description${EOL} */${EOL}x(y);${EOL}`);
});

it('should write generic parameter documentation if it exists', () => {
  builder.append(
    tsMethod('x', {
      generics: [tsGenericParameter('T', { description: 'description' })],
    }),
  );
  expect(builder.toString(false)).toBe(`/**${EOL} * @template T description${EOL} */${EOL}x<T>();${EOL}`);
});

it('should write decorators if they exist', () => {
  builder.append(tsMethod('x', { decorators: [tsDecorator('decorator')] }));
  expect(builder.toString(false)).toBe(`@decorator${EOL}x();${EOL}`);
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
    normalizeEOL(6)(
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
    normalizeEOL(6)(
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
