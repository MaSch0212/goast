import { EOL } from 'node:os';

import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsDoc } from './doc.ts';
import { tsEnumValue } from './enum-value.ts';
import { tsEnum } from './enum.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsEnum', () => {
  it('should write the name of the enum', () => {
    builder.append(tsEnum('X'));
    expect(builder.toString(false)).toBe(`enum X {}${EOL}`);
  });

  it('should write the members if they exist', () => {
    builder.append(tsEnum('X', { members: [tsEnumValue('A'), tsEnumValue('B')] }));
    expect(builder.toString(false)).toBe(`enum X {${EOL}  A,${EOL}  B${EOL}}${EOL}`);
  });

  it('should write export keyword if configured', () => {
    builder.append(tsEnum('X', { export: true }));
    expect(builder.toString(false)).toBe(`export enum X {}${EOL}`);
  });

  it('should write const keyword if configured', () => {
    builder.append(tsEnum('X', { const: true }));
    expect(builder.toString(false)).toBe(`const enum X {}${EOL}`);
  });

  it('should write documenation if it exists', () => {
    builder.append(tsEnum('X', { doc: tsDoc({ description: 'description' }) }));
    expect(builder.toString(false)).toBe(`/**${EOL} * description${EOL} */${EOL}enum X {}${EOL}`);
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
      `/**${EOL} * description${EOL} */${EOL}export const enum X {${EOL}  A,${EOL}  B${EOL}}${EOL}`,
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
      `║b║║bd║${EOL}/**${EOL} * description${EOL} */${EOL}║ad║║bm║export const ║am║enum ║bn║X║an║ ║bb║{${EOL}  ║bm║A,${EOL}  B║am║${EOL}}║ab║${EOL}║a║`,
    );
  });
});
