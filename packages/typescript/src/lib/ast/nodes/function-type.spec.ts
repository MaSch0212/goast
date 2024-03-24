import { tsFunctionType } from './function-type';
import { tsGenericParameter } from './generic-parameter';
import { tsParameter } from './parameter';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write the parameters and the return type', () => {
  builder.append(tsFunctionType({ parameters: [tsParameter('x'), tsParameter('y')], returnType: 'number' }));
  expect(builder.toString(false)).toBe('((x, y) => number)');
});

it('should write the generics if they exist', () => {
  builder.append(
    tsFunctionType({
      generics: [tsGenericParameter('T'), tsGenericParameter('U')],
      returnType: 'number',
    }),
  );
  expect(builder.toString(false)).toBe('(<T, U>() => number)');
});

it('should write all the parts of the function type', () => {
  builder.append(
    tsFunctionType({
      generics: [tsGenericParameter('T'), tsGenericParameter('U')],
      parameters: [tsParameter('x'), tsParameter('y')],
      returnType: 'number',
    }),
  );
  expect(builder.toString(false)).toBe('(<T, U>(x, y) => number)');
});

it('should render injections', () => {
  builder.append(tsFunctionType({ returnType: 'number', inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`before(() => number)after`);
});
