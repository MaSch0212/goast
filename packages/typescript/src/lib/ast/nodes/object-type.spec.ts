import { EOL } from 'os';

import { tsMethod } from './method';
import { tsObjectType } from './object-type';
import { tsProperty } from './property';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write the properties if they exist', () => {
  builder.append(tsObjectType({ properties: [tsProperty('x'), tsProperty('y')] }));
  expect(builder.toString(false)).toBe('{' + EOL + '  x;' + EOL + '  y;' + EOL + '}');
});

it('should write the methods if they exist', () => {
  builder.append(tsObjectType({ methods: [tsMethod('x'), tsMethod('y')] }));
  expect(builder.toString(false)).toBe('{' + EOL + '  x();' + EOL + '  y();' + EOL + '}');
});

it('should write all the parts of the object type', () => {
  builder.append(
    tsObjectType({
      properties: [tsProperty('x'), tsProperty('y')],
      methods: [tsMethod('x'), tsMethod('y')],
    })
  );
  expect(builder.toString(false)).toBe(
    '{' + EOL + '  x;' + EOL + '  y;' + EOL + EOL + '  x();' + EOL + '  y();' + EOL + '}'
  );
});

it('should render injections', () => {
  builder.append(tsObjectType({ inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`before{}after`);
});
