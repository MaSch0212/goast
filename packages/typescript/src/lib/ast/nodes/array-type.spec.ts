import { tsArrayType } from './array-type';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsArrayType', () => {
  it('should write the type of the array', () => {
    builder.append(tsArrayType('number'));
    expect(builder.toString(false)).toBe('(number)[]');
  });

  it('should write the array as readonly', () => {
    builder.append(tsArrayType('number', { readonly: true }));
    expect(builder.toString(false)).toBe('readonly (number)[]');
  });

  it('should render injections', () => {
    builder.append(
      tsArrayType('number', {
        readonly: true,
        inject: { before: '║b║', after: '║a║', beforeType: '║bt║', afterType: '║at║' },
      }),
    );
    expect(builder.toString(false)).toBe(`║b║readonly ║bt║(number)║at║[]║a║`);
  });
});
