import { tsArrayType } from './array-type';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write the type of the array', () => {
  builder.append(tsArrayType('number'));
  expect(builder.toString(false)).toBe('(number)[]');
});

it('should write the array as readonly', () => {
  builder.append(tsArrayType('number', { readonly: true }));
  expect(builder.toString(false)).toBe('readonly (number)[]');
});

it('should render injections', () => {
  builder.append(tsArrayType('number', { inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`before(number)[]after`);
});
