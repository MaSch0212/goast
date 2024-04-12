import { EOL } from 'os';

import { ktDoc } from './doc';
import { ktDocTag } from './doc-tag';
import { KotlinFileBuilder } from '../../file-builder';

describe('ktDoc', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should not write anything if the node is empty', () => {
    builder.append(ktDoc(null));
    expect(builder.toString(false)).toBe('');
  });

  it('should write description', () => {
    builder.append(ktDoc('description'));
    expect(builder.toString(false)).toBe(`/**${EOL} * description${EOL} */${EOL}`);
  });

  it('should write tags', () => {
    builder.append(ktDoc(null, [ktDocTag('tag1'), ktDocTag('tag2')]));
    expect(builder.toString(false)).toBe(`/**${EOL} * @tag1${EOL} * @tag2${EOL} */${EOL}`);
  });

  it('should write all the parts of the node', () => {
    builder.append(ktDoc('description', [ktDocTag('tag1'), ktDocTag('tag2')]));
    expect(builder.toString(false)).toBe(`/**${EOL} * description${EOL} *${EOL} * @tag1${EOL} * @tag2${EOL} */${EOL}`);
  });

  it('should render injections', () => {
    builder.append(ktDoc('hello', [], { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`before${EOL}/**${EOL} * hello${EOL} */${EOL}after`);
  });
});
