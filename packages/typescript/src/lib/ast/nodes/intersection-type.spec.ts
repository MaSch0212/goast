import { EOL } from 'os';

import { tsIntersectionType } from './intersection-type';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsIntersectionType', () => {
  it('should write type "unknown" if no types are provided', () => {
    builder.append(tsIntersectionType([]));
    expect(builder.toString(false)).toBe('unknown');
  });

  it('should write the type if only one type is provided', () => {
    builder.append(tsIntersectionType(['string']));
    expect(builder.toString(false)).toBe('string');
  });

  it('should write the types', () => {
    builder.append(tsIntersectionType(['string', 'number']));
    expect(builder.toString(false)).toBe('(string) & (number)');
  });

  it('should write the types on separate lines if there are more than 3', () => {
    builder.append(tsIntersectionType(['string', 'number', 'boolean', 'unknown']));
    expect(builder.toString(false)).toBe(`& (string)${EOL}& (number)${EOL}& (boolean)${EOL}& (unknown)`);
  });

  it('should collapse nested intersection types', () => {
    builder.append(
      tsIntersectionType([tsIntersectionType(['string', 'number']), tsIntersectionType(['boolean', 'unknown'])]),
    );
    expect(builder.toString(false)).toBe(`& (string)${EOL}& (number)${EOL}& (boolean)${EOL}& (unknown)`);
  });

  it('should render injections', () => {
    builder.append(
      tsIntersectionType(['string', 'number'], {
        inject: { before: '║b║', after: '║a║' },
      }),
    );
    expect(builder.toString(false)).toBe('║b║(string) & (number)║a║');
  });
});
