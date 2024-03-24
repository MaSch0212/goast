import { EOL } from 'os';

import { tsMethod } from './method';
import { tsObject } from './object';
import { tsProperty } from './property';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write the properties if they exist', () => {
  builder.append(tsObject({ properties: [tsProperty('x'), tsProperty('y')] }));
  expect(builder.toString(false)).toBe('{' + EOL + '  x;' + EOL + '  y;' + EOL + '}');
});

it('should write the methods if they exist', () => {
  builder.append(tsObject({ methods: [tsMethod('x'), tsMethod('y')] }));
  expect(builder.toString(false)).toBe('{' + EOL + '  x();' + EOL + EOL + '  y();' + EOL + '}');
});

it('should write all the parts of the object', () => {
  builder.append(
    tsObject({
      properties: [tsProperty('x'), tsProperty('y')],
      methods: [tsMethod('x'), tsMethod('y')],
    }),
  );
  expect(builder.toString(false)).toBe(
    '{' + EOL + '  x;' + EOL + '  y;' + EOL + EOL + '  x();' + EOL + EOL + '  y();' + EOL + '}',
  );
});

it('should render injections', () => {
  builder.append(tsObject({ inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`before{}after`);
});
