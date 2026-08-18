import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { dedent } from '@goast/test-harness';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsConstructorParameter } from './constructor-parameter.ts';
import { tsConstructor } from './constructor.ts';
import { tsDecorator } from './decorator.ts';
import { tsDocTag } from './doc-tag.ts';
import { tsDoc } from './doc.ts';

describe('tsConstructor', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new TypeScriptFileBuilder(
      undefined,
      { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
    );
  });

  it('should write empty constructor', () => {
    builder.append(tsConstructor());
    expect(builder.toString(false)).toBe('constructor() {}\n');
  });

  it('should write documentation if it exists', () => {
    builder.append(tsConstructor({ doc: tsDoc({ description: 'description' }) }));
    expect(builder.toString(false)).toBe('/**\n * description\n */\nconstructor() {}\n');
  });

  it('should write decorators if they exist', () => {
    builder.append(tsConstructor({ decorators: [tsDecorator('decorator')] }));
    expect(builder.toString(false)).toBe('@decorator\nconstructor() {}\n');
  });

  it('should write the parameters', () => {
    builder.append(
      tsConstructor({
        parameters: ['x', 'y'],
      }),
    );
    expect(builder.toString(false)).toBe('constructor(x, y) {}\n');
  });

  it('should write the description of the parameters when no documentation is provided', () => {
    builder.append(
      tsConstructor({
        parameters: [tsConstructorParameter('x', { description: 'description' }), 'y'],
      }),
    );
    expect(builder.toString(false)).toBe('/**\n * @param x description\n */\nconstructor(x, y) {}\n');
  });

  it('should write the body', () => {
    builder.append(tsConstructor({ body: 'this.x = x;' }));
    expect(builder.toString(false)).toBe('constructor() {\n  this.x = x;\n}\n');
  });

  it('should write the description of the parameter when documentation is provided', () => {
    builder.append(
      tsConstructor({
        doc: tsDoc({
          description: 'description',
          tags: [tsDocTag('param', 'y', 'y-description'), tsDocTag('returns', 'r-description')],
        }),
        decorators: [tsDecorator('decorator')],
        parameters: [tsConstructorParameter('x', { description: 'x-description' }), 'y'],
        body: 'this.x = x;',
      }),
    );
    expect(builder.toString(false)).toBe(
      dedent(8)(
        `/**
         * description
         *
         * @param x x-description
         * @param y y-description
         * @returns r-description
         */
        @decorator
        constructor(x, y) {
          this.x = x;
        }
        `,
      ),
    );
  });

  it('should render injections', () => {
    builder.append(
      tsConstructor({
        doc: tsDoc({
          description: 'description',
          tags: [tsDocTag('param', 'y', 'y-description'), tsDocTag('returns', 'r-description')],
        }),
        decorators: [tsDecorator('decorator')],
        parameters: [tsConstructorParameter('x', { description: 'x-description' }), 'y'],
        body: 'this.x = x;',
        inject: {
          before: '║b║',
          after: '║a║',
          beforeParams: '║bp║',
          afterParams: '║ap║',
          beforeDoc: '║bd║',
          afterDoc: '║ad║',
          beforeDecorators: '║bds║',
          afterDecorators: '║ads║',
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
         * @param x x-description
         * @param y y-description
         * @returns r-description
         */
        ║ad║║bds║@decorator
        ║ads║constructor║bp║(x, y)║ap║ ║bb║{
          this.x = x;
        }║ab║
        ║a║`,
      ),
    );
  });
});
