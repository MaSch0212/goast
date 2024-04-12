import { EOL } from 'os';

import { tsGenericParameter } from './generic-parameter';
import { tsTypeAlias } from './type-alias';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write the name of the type alias', () => {
  builder.append(tsTypeAlias('X', 'number'));
  expect(builder.toString(false)).toBe('type X = number;' + EOL);
});

it('should write the generics if they exist', () => {
  builder.append(tsTypeAlias('X', 'number', { generics: [tsGenericParameter('T'), tsGenericParameter('U')] }));
  expect(builder.toString(false)).toBe('type X<T, U> = number;' + EOL);
});

it('should write export keyword if configured', () => {
  builder.append(tsTypeAlias('X', 'number', { export: true }));
  expect(builder.toString(false)).toBe('export type X = number;' + EOL);
});

it('should render injections', () => {
  builder.append(tsTypeAlias('X', 'number', { inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`beforetype X = number;${EOL}after`);
});
