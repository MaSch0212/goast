import { EOL } from 'node:os';

import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsDecorator } from './decorator.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('single', () => {
  it('should write a static decorator', () => {
    builder.append(tsDecorator('decorator'));
    expect(builder.toString(false)).toBe(`@decorator`);
  });

  it('should write a decorator without arguments', () => {
    builder.append(tsDecorator('decorator', []));
    expect(builder.toString(false)).toBe(`@decorator()`);
  });

  it('should write a decorator with arguments', () => {
    builder.append(tsDecorator('decorator', ['arg1', 'arg2']));
    expect(builder.toString(false)).toBe(`@decorator(arg1, arg2)`);
  });

  it('should render injections', () => {
    builder.append(
      tsDecorator('decorator', ['arg1', 'arg2'], {
        inject: {
          before: '║b║',
          after: '║a║',
          beforeFunction: '║bf║',
          afterFunction: '║af║',
          beforeArguments: '║ba║',
          afterArguments: '║aa║',
        },
      }),
    );
    expect(builder.toString(false)).toBe(`║b║@║bf║decorator║af║║ba║(arg1, arg2)║aa║║a║`);
  });
});

describe('multiple', () => {
  it('should write decorators across multiple lines', () => {
    tsDecorator.write(builder, [tsDecorator('decorator1'), tsDecorator('decorator2')], { multiline: true });
    expect(builder.toString(false)).toBe(`@decorator1${EOL}@decorator2${EOL}`);
  });

  it('should write decorators on the same line', () => {
    tsDecorator.write(builder, [tsDecorator('decorator1'), tsDecorator('decorator2')], { multiline: false });
    expect(builder.toString(false)).toBe(`@decorator1 @decorator2 `);
  });
});
