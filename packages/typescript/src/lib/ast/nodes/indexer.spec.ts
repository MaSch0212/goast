import { EOL } from 'os';

import { tsIndexer } from './indexer';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsIndexer', () => {
  it('should write the key and value types', () => {
    builder.append(tsIndexer('string', 'number'));
    expect(builder.toString(false)).toBe(`[key: string]: number;${EOL}`);
  });

  it('should write the readonly keyword if the indexer is readonly', () => {
    builder.append(tsIndexer('string', 'number', { readonly: true }));
    expect(builder.toString(false)).toBe(`readonly [key: string]: number;${EOL}`);
  });

  it('should write the key name if it exists', () => {
    builder.append(tsIndexer('string', 'number', { keyName: 'id' }));
    expect(builder.toString(false)).toBe(`[id: string]: number;${EOL}`);
  });

  it('should render injections', () => {
    builder.append(
      tsIndexer('string', 'number', {
        keyName: 'id',
        readonly: true,
        inject: { before: '║b║', after: '║a║' },
      }),
    );
    expect(builder.toString(false)).toBe(`║b║readonly [id: string]: number;${EOL}║a║`);
  });
});
