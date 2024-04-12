import { EOL } from 'os';

import { normalizeEOL } from 'test/utils/string.utils';

import { tsDecorator } from './decorator';
import { tsDoc } from './doc';
import { tsFunction } from './function';
import { tsGenericParameter } from './generic-parameter';
import { tsParameter } from './parameter';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsFunction', () => {
  it('should write the name of the function', () => {
    builder.append(tsFunction('X'));
    expect(builder.toString(false)).toBe('function X() {}' + EOL);
  });

  it('should write the generics if they exist', () => {
    builder.append(tsFunction('X', { generics: [tsGenericParameter('T'), tsGenericParameter('U')] }));
    expect(builder.toString(false)).toBe('function X<T, U>() {}' + EOL);
  });

  it('should write the parameters if they exist', () => {
    builder.append(tsFunction('X', { parameters: [tsParameter('y'), tsParameter('z')] }));
    expect(builder.toString(false)).toBe('function X(y, z) {}' + EOL);
  });

  it('should write the return type if it exists', () => {
    builder.append(tsFunction('X', { returnType: 'number' }));
    expect(builder.toString(false)).toBe('function X(): number {}' + EOL);
  });

  it('should write the body if it exists', () => {
    builder.append(tsFunction('X', { body: 'return 42;' }));
    expect(builder.toString(false)).toBe(`function X() {${EOL}  return 42;${EOL}}${EOL}`);
  });

  it('should write export keyword if configured', () => {
    builder.append(tsFunction('X', { export: true }));
    expect(builder.toString(false)).toBe('export function X() {}' + EOL);
  });

  it('should write documenation if it exists', () => {
    builder.append(tsFunction('X', { doc: tsDoc({ description: 'description' }) }));
    expect(builder.toString(false)).toBe(`/**${EOL} * description${EOL} */${EOL}function X() {}${EOL}`);
  });

  it('should write decorators if they exist', () => {
    builder.append(tsFunction('X', { decorators: [tsDecorator('decorator')] }));
    expect(builder.toString(false)).toBe(`@decorator${EOL}function X() {}${EOL}`);
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
      normalizeEOL(8)(
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
      normalizeEOL(8)(
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
