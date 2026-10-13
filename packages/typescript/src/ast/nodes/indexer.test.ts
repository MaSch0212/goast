import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsIndexer } from './indexer.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  // A fixed newLine keeps the expectations below host-independent.
  builder = new TypeScriptFileBuilder(
    undefined,
    { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
  );
});

describe('tsIndexer', () => {
  it('should write the key and value types', () => {
    builder.append(tsIndexer('string', 'number'));
    expect(builder.toString(false)).toBe('[key: string]: number;\n');
  });

  it('should write the readonly keyword if the indexer is readonly', () => {
    builder.append(tsIndexer('string', 'number', { readonly: true }));
    expect(builder.toString(false)).toBe('readonly [key: string]: number;\n');
  });

  it('should write the key name if it exists', () => {
    builder.append(tsIndexer('string', 'number', { keyName: 'id' }));
    expect(builder.toString(false)).toBe('[id: string]: number;\n');
  });

  it('should render injections', () => {
    builder.append(
      tsIndexer('string', 'number', {
        keyName: 'id',
        readonly: true,
        inject: { before: '║b║', after: '║a║' },
      }),
    );
    expect(builder.toString(false)).toBe('║b║readonly [id: string]: number;\n║a║');
  });
});
