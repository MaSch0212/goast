import { EOL } from 'node:os';

import { tsArrowFunction } from './arrow-function.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { beforeEach, describe, it } from '@std/testing/bdd';
import { expect } from '@std/expect';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsArrowFunction', () => {
  it('should write empty function', () => {
    builder.append(tsArrowFunction());
    expect(builder.toString(false)).toBe('() => {}');
  });

  it('should write the parameters', () => {
    builder.append(tsArrowFunction({ parameters: ['x', 'y'] }));
    expect(builder.toString(false)).toBe('(x, y) => {}');
  });

  it('should write the return type', () => {
    builder.append(tsArrowFunction({ returnType: 'number' }));
    expect(builder.toString(false)).toBe('(): number => {}');
  });

  it('should write the body', () => {
    builder.append(tsArrowFunction({ body: 'return 42;' }));
    expect(builder.toString(false)).toBe('() => {' + EOL + '  return 42;' + EOL + '}');
  });

  it('should write the generics if they exist', () => {
    builder.append(tsArrowFunction({ generics: ['T', 'U'] }));
    expect(builder.toString(false)).toBe('<T, U>() => {}');
  });

  it('should write all the parts of the arrow function', () => {
    builder.append(
      tsArrowFunction({
        generics: ['T', 'U'],
        parameters: ['x', 'y'],
        returnType: 'number',
        body: 'return 42;',
      }),
    );
    expect(builder.toString(false)).toBe('<T, U>(x, y): number => {' + EOL + '  return 42;' + EOL + '}');
  });

  it('should render injections', () => {
    builder.append(
      tsArrowFunction({
        generics: ['T', 'U'],
        parameters: ['x', 'y'],
        returnType: 'number',
        body: 'return 42;',
        inject: {
          before: '║b║',
          after: '║a║',
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
      '║b║║bg║<T, U>║ag║║bp║(x, y)║ap║: ║brt║number║art║ => ║bb║{' + EOL + '  return 42;' + EOL + '}║ab║║a║',
    );
  });
});
