import { describe, expect, it } from 'vitest';

import { StringBuilder } from '@goast/core';

import { GoImportCollection } from './import-collection.ts';

function write(imports: GoImportCollection): string {
  const builder = new StringBuilder({ newLine: '\n' });
  imports.writeTo(builder);
  return builder.toString();
}

describe('GoImportCollection', () => {
  it('returns the package name and adds an import once', () => {
    const imports = new GoImportCollection();

    expect(imports.addImport('net/http')).toBe('http');
    expect(imports.addImport('net/http')).toBe('http');
    expect(imports.imports).toHaveLength(1);
  });

  it('aliases a package whose name is taken', () => {
    const imports = new GoImportCollection(['json']);

    expect(imports.addImport('math/rand')).toBe('rand');
    expect(imports.addImport('crypto/rand')).toBe('rand2');
    expect(imports.addImport('encoding/json')).toBe('json2');
  });

  it('writes a single import on one line', () => {
    const imports = new GoImportCollection();
    imports.addImport('time');

    expect(write(imports)).toBe('import "time"\n');
  });

  it('groups the standard library before other packages, each sorted by path', () => {
    const imports = new GoImportCollection();
    imports.addImport('github.com/google/uuid');
    imports.addImport('time');
    imports.addImport('math/rand');
    imports.addImport('crypto/rand');

    expect(write(imports)).toBe(
      [
        'import (',
        '\trand2 "crypto/rand"',
        '\t"math/rand"',
        '\t"time"',
        '',
        '\t"github.com/google/uuid"',
        ')',
        '',
      ].join('\n'),
    );
  });

  it('writes nothing without imports', () => {
    expect(write(new GoImportCollection())).toBe('');
  });
});
