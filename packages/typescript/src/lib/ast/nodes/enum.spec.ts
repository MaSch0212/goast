import { EOL } from 'os';

import { tsEnum, tsEnumValue, writeTsEnumValue } from './enum';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('enum-value', () => {
  it('should write the name of the member', () => {
    writeTsEnumValue(builder, tsEnumValue('X'));
    expect(builder.toString(false)).toBe('X');
  });

  it('should write the value if it exists', () => {
    writeTsEnumValue(builder, tsEnumValue('X', { value: 42 }));
    expect(builder.toString(false)).toBe('X = 42');
  });

  it('should render injections', () => {
    writeTsEnumValue(builder, tsEnumValue('X', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforeXafter`);
  });
});

describe('writeTsEnum', () => {
  it('should write the name of the enum', () => {
    builder.append(tsEnum('X'));
    expect(builder.toString(false)).toBe('enum X {}' + EOL);
  });

  it('should write the members if they exist', () => {
    builder.append(tsEnum('X', { members: [tsEnumValue('A'), tsEnumValue('B')] }));
    expect(builder.toString(false)).toBe('enum X {' + EOL + '  A,' + EOL + '  B' + EOL + '}' + EOL);
  });

  it('should write export keyword if configured', () => {
    builder.append(tsEnum('X', { export: true }));
    expect(builder.toString(false)).toBe('export enum X {}' + EOL);
  });

  it('should write const keyword if configured', () => {
    builder.append(tsEnum('X', { const: true }));
    expect(builder.toString(false)).toBe('const enum X {}' + EOL);
  });

  it('should write all the parts of the enum', () => {
    builder.append(tsEnum('X', { members: [tsEnumValue('A'), tsEnumValue('B')], export: true, const: true }));
    expect(builder.toString(false)).toBe('export const enum X {' + EOL + '  A,' + EOL + '  B' + EOL + '}' + EOL);
  });

  it('should render injections', () => {
    builder.append(tsEnum('X', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforeenum X {}${EOL}after`);
  });
});
