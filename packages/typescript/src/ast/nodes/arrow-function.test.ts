import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsArrowFunction } from './arrow-function.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  // A fixed newLine keeps the expectations below host-independent.
  builder = new TypeScriptFileBuilder(
    undefined,
    { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
  );
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
    expect(builder.toString(false)).toBe('() => {\n  return 42;\n}');
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
    expect(builder.toString(false)).toBe('<T, U>(x, y): number => {\n  return 42;\n}');
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
      '║b║║bg║<T, U>║ag║║bp║(x, y)║ap║: ║brt║number║art║ => ║bb║{\n  return 42;\n}║ab║║a║',
    );
  });
});
