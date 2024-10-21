import { EOL } from 'node:os';

import { tsVariable } from './variable.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { beforeEach, it } from '@std/testing/bdd';
import { expect } from '@std/expect/expect';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write the name of the variable', () => {
  builder.append(tsVariable('x'));
  expect(builder.toString(false)).toBe('let x;' + EOL);
});

it('should write the type if it exists', () => {
  builder.append(tsVariable('x', { type: 'number' }));
  expect(builder.toString(false)).toBe('let x: number;' + EOL);
});

it('should write the value if it exists', () => {
  builder.append(tsVariable('x', { value: 42 }));
  expect(builder.toString(false)).toBe('let x = 42;' + EOL);
});

it('should write the const keyword if configured', () => {
  builder.append(tsVariable('x', { readonly: true }));
  expect(builder.toString(false)).toBe('const x;' + EOL);
});

it('should write the export keyword if configured', () => {
  builder.append(tsVariable('x', { export: true }));
  expect(builder.toString(false)).toBe('export let x;' + EOL);
});

it('should write all the parts of the variable', () => {
  builder.append(tsVariable('x', { type: 'number', value: 42, readonly: true, export: true }));
  expect(builder.toString(false)).toBe('export const x: number = 42;' + EOL);
});

it('should render injections', () => {
  builder.append(tsVariable('x', { inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`beforelet x;${EOL}after`);
});
