import { EOL } from 'os';

import { tsDecorator, writeTsDecorators } from './decorator';
import { TypeScriptFileBuilder } from '../../file-builder';

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
    builder.append(tsDecorator('decorator', ['arg1', 'arg2'], { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`before@decorator(arg1, arg2)after`);
  });
});

describe('multiple', () => {
  it('should write decorators across multiple lines', () => {
    writeTsDecorators(builder, [tsDecorator('decorator1'), tsDecorator('decorator2')], true);
    expect(builder.toString(false)).toBe(`@decorator1${EOL}@decorator2${EOL}`);
  });

  it('should write decorators on the same line', () => {
    writeTsDecorators(builder, [tsDecorator('decorator1'), tsDecorator('decorator2')], false);
    expect(builder.toString(false)).toBe(`@decorator1 @decorator2 `);
  });
});
