import { normalizeEOL } from 'test/utils/string.utils';

import { tsTuple } from './tuple';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsTuple', () => {
  it('should write empty tuple if no elements are provided', () => {
    builder.append(tsTuple([]));
    expect(builder.toString(false)).toBe('[]');
  });

  it('should write the elements', () => {
    builder.append(tsTuple(['string', 'number']));
    expect(builder.toString(false)).toBe('[string, number]');
  });

  it('should write multiline if there are more than 3 elements', () => {
    builder.append(tsTuple(['string', 'number', 'boolean', 'unknown']));
    expect(builder.toString(false)).toBe(
      normalizeEOL(8)(
        `[
          string,
          number,
          boolean,
          unknown
        ]`,
      ),
    );
  });

  it('should write as const', () => {
    builder.append(tsTuple(['string', 'number'], { asConst: true }));
    expect(builder.toString(false)).toBe('[string, number] as const');
  });
});
