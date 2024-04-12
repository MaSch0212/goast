import { EOL } from 'os';

import { tsDoc } from './doc';
import { tsDocTag } from './doc-tag';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should not write anything if the node is empty', () => {
  builder.append(tsDoc());
  expect(builder.toString(false)).toBe('');
});

it('should write description', () => {
  builder.append(tsDoc({ description: 'description' }));
  expect(builder.toString(false)).toBe(`/**${EOL} * description${EOL} */${EOL}`);
});

it('should write tags', () => {
  builder.append(tsDoc({ tags: [tsDocTag('tag1'), tsDocTag('tag2')] }));
  expect(builder.toString(false)).toBe(`/**${EOL} * @tag1${EOL} * @tag2${EOL} */${EOL}`);
});

it('should write all the parts of the node', () => {
  builder.append(tsDoc({ description: 'description', tags: [tsDocTag('tag1'), tsDocTag('tag2')] }));
  expect(builder.toString(false)).toBe(`/**${EOL} * description${EOL} *${EOL} * @tag1${EOL} * @tag2${EOL} */${EOL}`);
});

it('should render injections', () => {
  builder.append(tsDoc({ description: 'hello', inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`before${EOL}/**${EOL} * hello${EOL} */${EOL}after`);
});
