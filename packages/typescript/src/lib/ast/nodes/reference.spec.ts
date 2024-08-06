import { EOL } from 'os';

import { tsReference } from './reference';
import { TypeScriptImport } from '../../common-results';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsReference', () => {
  it('should write the name of the reference', () => {
    builder.append(tsReference('X'));
    expect(builder.toString(false)).toBe('X');
  });

  it('should write the generics if they exist', () => {
    builder.append(tsReference('X', null, { generics: ['T', 'U'] }));
    expect(builder.toString(false)).toBe('X<T, U>');
  });

  it('should add the import if module name of file path is provided', () => {
    builder.append(tsReference('X', 'module'));
    expect(builder.imports.imports).toEqual(<TypeScriptImport[]>[
      { kind: 'module', modulePath: 'module', name: 'X', type: 'import' },
    ]);
    expect(builder.toString(false)).toBe(`import { X } from 'module';${EOL}X`);
  });

  it('should write the injections', () => {
    builder.append(tsReference('X', null, { generics: ['T', 'U'], inject: { before: '║b║', after: '║a║' } }));
    expect(builder.toString(false)).toBe('║b║X<T, U>║a║');
  });
});
