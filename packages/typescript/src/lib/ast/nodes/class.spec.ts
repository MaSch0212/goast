import { EOL } from 'os';

import { normalizeEOL } from 'test/utils/string.utils';

import { tsClass } from './class';
import { tsConstructor } from './constructor';
import { tsDecorator } from './decorator';
import { tsDoc } from './doc';
import { tsGenericParameter } from './generic-parameter';
import { tsMethod } from './method';
import { tsProperty } from './property';
import { tsReference } from './reference';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsClass', () => {
  it('should write the name of the class', () => {
    builder.append(tsClass('X'));
    expect(builder.toString(false)).toBe('class X {}' + EOL);
  });

  it('should write documenation if it exists', () => {
    builder.append(tsClass('X', { doc: tsDoc({ description: 'description' }) }));
    expect(builder.toString(false)).toBe('/**' + EOL + ' * description' + EOL + ' */' + EOL + 'class X {}' + EOL);
  });

  it('should write decorators if they exist', () => {
    builder.append(tsClass('X', { decorators: [tsDecorator('decorator')] }));
    expect(builder.toString(false)).toBe('@decorator' + EOL + 'class X {}' + EOL);
  });

  it('should write the generics if they exist', () => {
    builder.append(tsClass('X', { generics: ['T', 'U'] }));
    expect(builder.toString(false)).toBe('class X<T, U> {}' + EOL);
  });

  it('should write the descriptions of the generics if they exist', () => {
    builder.append(
      tsClass('X', {
        generics: [tsGenericParameter('T', { description: 'description' }), 'U'],
      }),
    );
    expect(builder.toString(false)).toBe(
      '/**' + EOL + ' * @template T description' + EOL + ' */' + EOL + 'class X<T, U> {}' + EOL,
    );
  });

  it('should write the extends if it exists', () => {
    builder.append(tsClass('X', { extends: 'Y' }));
    expect(builder.toString(false)).toBe('class X extends Y {}' + EOL);
  });

  it('should write the implements if it exists', () => {
    builder.append(tsClass('X', { implements: ['Y', 'Z'] }));
    expect(builder.toString(false)).toBe('class X implements Y, Z {}' + EOL);
  });

  it('should write the properties if they exist', () => {
    builder.append(tsClass('X', { members: [tsProperty('x'), tsProperty('y')] }));
    expect(builder.toString(false)).toBe('class X {' + EOL + '  x;' + EOL + '  y;' + EOL + '}' + EOL);
  });

  it('should write the methods if they exist', () => {
    builder.append(tsClass('X', { members: [tsMethod('x'), tsMethod('y')] }));
    expect(builder.toString(false)).toBe('class X {' + EOL + '  x();' + EOL + '  y();' + EOL + '}' + EOL);
  });

  it('should write the constructor if it exists', () => {
    builder.append(tsClass('X', { members: [tsConstructor()] }));
    expect(builder.toString(false)).toBe('class X {' + EOL + '  constructor() {}' + EOL + '}' + EOL);
  });

  it('should write export keyword if configured', () => {
    builder.append(tsClass('X', { export: true }));
    expect(builder.toString(false)).toBe('export class X {}' + EOL);
  });

  it('should write the abstract keyword if configured', () => {
    builder.append(tsClass('X', { abstract: true }));
    expect(builder.toString(false)).toBe('abstract class X {}' + EOL);
  });

  it('should write all the parts of the class', () => {
    builder.append(
      tsClass('X', {
        doc: tsDoc({ description: 'description' }),
        decorators: [tsDecorator('decorator')],
        generics: [tsGenericParameter('T', { description: 'description for T' }), tsGenericParameter('U')],
        extends: tsReference('Y'),
        implements: [tsReference('Z')],
        members: [tsProperty('x'), tsProperty('y'), tsConstructor(), tsMethod('x'), tsMethod('y')],
        export: true,
        abstract: true,
      }),
    );
    expect(builder.toString(false)).toBe(
      normalizeEOL(8)(
        `/**
         * description
         *
         * @template T description for T
         */
        @decorator
        export abstract class X<T, U> extends Y implements Z {
          x;
          y;

          constructor() {}

          x();
          y();
        }
        `.trimStart(),
      ),
    );
  });

  it('should render injections', () => {
    builder.append(
      tsClass('X', {
        doc: tsDoc({ description: 'description' }),
        decorators: [tsDecorator('decorator')],
        generics: [tsGenericParameter('T', { description: 'description for T' }), tsGenericParameter('U')],
        extends: tsReference('Y'),
        implements: [tsReference('Z')],
        members: [tsProperty('x'), tsProperty('y'), tsConstructor(), tsMethod('x'), tsMethod('y')],
        export: true,
        abstract: true,
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
          beforeExtends: '║be║',
          afterExtends: '║ae║',
          beforeImplements: '║bi║',
          afterImplements: '║ai║',
          beforeBody: '║bb║',
          afterBody: '║ab║',
          beforeMembers: '║bmb║',
          afterMembers: '║amb║',
        },
      }),
    );
    expect(builder.toString(false)).toBe(
      normalizeEOL(8)(
        `║b║║bd║
        /**
         * description
         *
         * @template T description for T
         */
        ║ad║║bds║@decorator
        ║ads║║bm║export abstract ║am║class ║bn║X║an║║bg║<T, U>║ag║ extends ║be║Y║ae║ implements ║bi║Z║ai║ ║bb║{
          ║bmb║x;
          y;

          constructor() {}

          x();
          y();
          ║amb║
        }║ab║
        ║a║`.trimStart(),
      ),
    );
  });
});
