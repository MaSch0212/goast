import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { SourceBuilder } from '@goast/core';

import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsExport } from './export.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsExport', () => {
  it('should add the export to the builder', () => {
    builder.append(tsExport('myFunction', './my-function'));
    expect(builder.imports['_exports']).toEqual(new Map([['./my-function', new Set(['myFunction'])]]));
  });

  it('should write export if not TypeScriptFileBuilder', () => {
    // A fixed newLine keeps the expectation below host-independent.
    const builder = new SourceBuilder({ newLine: '\n' });
    tsExport('myFunction', './my-function').write(builder);
    expect(builder.toString()).toBe("export { myFunction } from './my-function';\n");
  });
});
