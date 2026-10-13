import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import type { TypeScriptImport } from '../../common-results.ts';
import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsReference } from './reference.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  // A fixed newLine keeps the expectations below host-independent.
  builder = new TypeScriptFileBuilder(
    undefined,
    { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
  );
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
    expect(builder.imports.imports).toEqual(
      <TypeScriptImport[]> [
        { kind: 'module', modulePath: 'module', name: 'X', type: 'import' },
      ],
    );
    expect(builder.toString(false)).toBe("import { X } from 'module';\nX");
  });

  it('should write the injections', () => {
    builder.append(tsReference('X', null, { generics: ['T', 'U'], inject: { before: '║b║', after: '║a║' } }));
    expect(builder.toString(false)).toBe('║b║X<T, U>║a║');
  });
});
