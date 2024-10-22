import { EOL } from 'node:os';

import { expect } from '@std/expect/expect';
import { beforeEach, it } from '@std/testing/bdd';

import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsMethod } from './method.ts';
import { tsObject } from './object.ts';
import { tsProperty } from './property.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write the properties if they exist', () => {
  builder.append(tsObject({ members: [tsProperty('x'), tsProperty('y')] }));
  expect(builder.toString(false)).toBe('{' + EOL + '  x,' + EOL + '  y,' + EOL + '}');
});

it('should write the methods if they exist', () => {
  builder.append(tsObject({ members: [tsMethod('x'), tsMethod('y')] }));
  expect(builder.toString(false)).toBe('{' + EOL + '  x(),' + EOL + '  y(),' + EOL + '}');
});

it('should write all the parts of the object', () => {
  builder.append(
    tsObject({
      members: [tsProperty('x'), tsProperty('y'), tsMethod('x'), tsMethod('y')],
    }),
  );
  expect(builder.toString(false)).toBe('{' + EOL + '  x,' + EOL + '  y,' + EOL + '  x(),' + EOL + '  y(),' + EOL + '}');
});

it('should render injections', () => {
  builder.append(tsObject({ inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`before{}after`);
});
