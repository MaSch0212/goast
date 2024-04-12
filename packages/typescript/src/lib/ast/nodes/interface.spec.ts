import { EOL } from 'os';

import { normalizeEOL } from 'test/utils/string.utils';

import { tsDecorator } from './decorator';
import { tsDoc } from './doc';
import { tsGenericParameter } from './generic-parameter';
import { tsInterface } from './interface';
import { tsMethod } from './method';
import { tsProperty } from './property';
import { tsReference } from './reference';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsInterface', () => {
  it('should write the name of the interface', () => {
    builder.append(tsInterface('X'));
    expect(builder.toString(false)).toBe(`interface X {}${EOL}`);
  });

  it('should write the generics if they exist', () => {
    builder.append(tsInterface('X', { generics: [tsGenericParameter('T'), tsGenericParameter('U')] }));
    expect(builder.toString(false)).toBe(`interface X<T, U> {}${EOL}`);
  });

  it('should write the extends if it exists', () => {
    builder.append(tsInterface('X', { extends: [tsReference('Y'), tsReference('Z')] }));
    expect(builder.toString(false)).toBe(`interface X extends Y, Z {}${EOL}`);
  });

  it('should write the properties if they exist', () => {
    builder.append(tsInterface('X', { members: [tsProperty('x'), tsProperty('y')] }));
    expect(builder.toString(false)).toBe(`interface X {${EOL}  x;${EOL}  y;${EOL}}${EOL}`);
  });

  it('should write the methods if they exist', () => {
    builder.append(tsInterface('X', { members: [tsMethod('x'), tsMethod('y')] }));
    expect(builder.toString(false)).toBe(`interface X {${EOL}  x();${EOL}  y();${EOL}}${EOL}`);
  });

  it('should write export keyword if configured', () => {
    builder.append(tsInterface('X', { export: true }));
    expect(builder.toString(false)).toBe(`export interface X {}${EOL}`);
  });

  it('should write the doc if it exists', () => {
    builder.append(tsInterface('X', { doc: tsDoc({ description: 'description' }) }));
    expect(builder.toString(false)).toBe(`/**${EOL} * description${EOL} */${EOL}interface X {}${EOL}`);
  });

  it('should write the decorators if they exist', () => {
    builder.append(tsInterface('X', { decorators: [tsDecorator('decorator')] }));
    expect(builder.toString(false)).toBe(`@decorator${EOL}interface X {}${EOL}`);
  });

  it('should write all the parts of the interface', () => {
    builder.append(
      tsInterface('X', {
        doc: tsDoc({ description: 'description' }),
        decorators: [tsDecorator('decorator')],
        generics: [tsGenericParameter('T'), tsGenericParameter('U')],
        extends: [tsReference('Y'), tsReference('Z')],
        members: [tsProperty('x'), tsProperty('y'), tsMethod('x'), tsMethod('y')],
        export: true,
      }),
    );
    expect(builder.toString(false)).toBe(
      normalizeEOL(8)(
        `/**
         * description
         */
        @decorator
        export interface X<T, U> extends Y, Z {
          x;
          y;
          x();
          y();
        }
        `,
      ),
    );
  });

  it('should render injections', () => {
    builder.append(
      tsInterface('X', {
        doc: tsDoc({ description: 'description' }),
        decorators: [tsDecorator('decorator')],
        generics: [tsGenericParameter('T'), tsGenericParameter('U')],
        extends: [tsReference('Y'), tsReference('Z')],
        members: [tsProperty('x'), tsProperty('y'), tsMethod('x'), tsMethod('y')],
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
          beforeExtends: '║be║',
          afterExtends: '║ae║',
          beforeBody: '║bb║',
          afterBody: '║ab║',
          beforeMembers: '║bm║',
          afterMembers: '║am║',
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
        ║ads║║bm║export ║am║interface ║bn║X║an║║bg║<T, U>║ag║ extends ║be║Y, Z║ae║ ║bb║{
          ║bm║x;
          y;
          x();
          y();
          ║am║
        }║ab║
        ║a║`,
      ),
    );
  });
});
