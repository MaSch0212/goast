import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsDoc } from './doc.ts';
import { tsEnumValue } from './enum-value.ts';
import { tsEnum } from './enum.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  // A fixed newLine keeps the expectations below host-independent.
  builder = new TypeScriptFileBuilder(
    undefined,
    { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
  );
});

describe('tsEnum', () => {
  it('should write the name of the enum', () => {
    builder.append(tsEnum('X'));
    expect(builder.toString(false)).toBe('enum X {}\n');
  });

  it('should write the members if they exist', () => {
    builder.append(tsEnum('X', { members: [tsEnumValue('A'), tsEnumValue('B')] }));
    expect(builder.toString(false)).toBe('enum X {\n  A,\n  B\n}\n');
  });

  it('should write export keyword if configured', () => {
    builder.append(tsEnum('X', { export: true }));
    expect(builder.toString(false)).toBe('export enum X {}\n');
  });

  it('should write const keyword if configured', () => {
    builder.append(tsEnum('X', { const: true }));
    expect(builder.toString(false)).toBe('const enum X {}\n');
  });

  it('should write documenation if it exists', () => {
    builder.append(tsEnum('X', { doc: tsDoc({ description: 'description' }) }));
    expect(builder.toString(false)).toBe('/**\n * description\n */\nenum X {}\n');
  });

  it('should write all the parts of the enum', () => {
    builder.append(
      tsEnum('X', {
        doc: tsDoc({ description: 'description' }),
        members: [tsEnumValue('A'), tsEnumValue('B')],
        export: true,
        const: true,
      }),
    );
    expect(builder.toString(false)).toBe(
      '/**\n * description\n */\nexport const enum X {\n  A,\n  B\n}\n',
    );
  });

  it('should render injections', () => {
    builder.append(
      tsEnum('X', {
        doc: tsDoc({ description: 'description' }),
        members: [tsEnumValue('A'), tsEnumValue('B')],
        export: true,
        const: true,
        inject: {
          before: '║b║',
          after: '║a║',
          beforeDoc: '║bd║',
          afterDoc: '║ad║',
          beforeModifiers: '║bm║',
          afterModifiers: '║am║',
          beforeName: '║bn║',
          afterName: '║an║',
          beforeBody: '║bb║',
          afterBody: '║ab║',
          beforeMembers: '║bm║',
          afterMembers: '║am║',
        },
      }),
    );
    expect(builder.toString(false)).toBe(
      '║b║║bd║\n/**\n * description\n */\n║ad║║bm║export const ║am║enum ║bn║X║an║ ║bb║{\n  ║bm║A,\n  B║am║\n}║ab║\n║a║',
    );
  });
});
