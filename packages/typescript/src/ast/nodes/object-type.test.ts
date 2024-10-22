import { EOL } from 'node:os';

import { expect } from '@std/expect/expect';
import { beforeEach, it } from '@std/testing/bdd';

import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsMethod } from './method.ts';
import { tsObjectType } from './object-type.ts';
import { tsProperty } from './property.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write the properties if they exist', () => {
  builder.append(tsObjectType({ members: [tsProperty('x'), tsProperty('y')] }));
  expect(builder.toString(false)).toBe('{' + EOL + '  x;' + EOL + '  y;' + EOL + '}');
});

it('should write the methods if they exist', () => {
  builder.append(tsObjectType({ members: [tsMethod('x'), tsMethod('y')] }));
  expect(builder.toString(false)).toBe('{' + EOL + '  x();' + EOL + '  y();' + EOL + '}');
});

it('should write all the parts of the object type', () => {
  builder.append(
    tsObjectType({
      members: [tsProperty('x'), tsProperty('y'), tsMethod('x'), tsMethod('y')],
    }),
  );
  expect(builder.toString(false)).toBe('{' + EOL + '  x;' + EOL + '  y;' + EOL + '  x();' + EOL + '  y();' + EOL + '}');
});

it('should render injections', () => {
  builder.append(tsObjectType({ inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`before{}after`);
});
