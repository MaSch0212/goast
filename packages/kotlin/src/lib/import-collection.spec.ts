import { EOL } from 'os';

import { StringBuilder } from '@goast/core';

import { ImportCollection } from './import-collection';

describe('ImportCollection', () => {
  describe('hasImport', () => {
    it('should return false when no imports are added', () => {
      const importCollection = new ImportCollection();
      expect(importCollection.hasImports).toBe(false);
    });

    it('should return true when imports are added', () => {
      const importCollection = new ImportCollection();
      importCollection.addImport('SomeClass', 'some.package');
      expect(importCollection.hasImports).toBe(true);
    });
  });

  describe('imports', () => {
    it('should return an empty array when no imports are added', () => {
      const importCollection = new ImportCollection();
      expect(importCollection.imports).toEqual([]);
    });

    it('should return an array of imports when imports are added', () => {
      const importCollection = new ImportCollection();
      importCollection.addImport('SomeClass', 'some.package');
      importCollection.addImport('AnotherClass', 'another.package');
      expect(importCollection.imports).toEqual([
        { packageName: 'some.package', typeName: 'SomeClass' },
        { packageName: 'another.package', typeName: 'AnotherClass' },
      ]);
    });
  });

  describe('addImport', () => {
    it('should add an import to the collection', () => {
      const importCollection = new ImportCollection();
      importCollection.addImport('SomeClass', 'some.package');
      expect(importCollection.imports).toEqual([{ packageName: 'some.package', typeName: 'SomeClass' }]);
    });

    it('should add an import to the collection using an object', () => {
      const importCollection = new ImportCollection();
      importCollection.addImport({ packageName: 'some.package', typeName: 'SomeClass' });
      expect(importCollection.imports).toEqual([{ packageName: 'some.package', typeName: 'SomeClass' }]);
    });
  });

  describe('addImports', () => {
    it('should add multiple imports to the collection', () => {
      const importCollection = new ImportCollection();
      importCollection.addImports([
        { packageName: 'some.package', typeName: 'SomeClass' },
        { packageName: 'another.package', typeName: 'AnotherClass' },
      ]);
      expect(importCollection.imports).toEqual([
        { packageName: 'some.package', typeName: 'SomeClass' },
        { packageName: 'another.package', typeName: 'AnotherClass' },
      ]);
    });
  });

  describe('clear', () => {
    it('should clear all imports', () => {
      const importCollection = new ImportCollection();
      importCollection.addImport('SomeClass', 'some.package');
      importCollection.clear();
      expect(importCollection.imports).toEqual([]);
    });
  });

  describe('toString', () => {
    it('should return an empty string when no imports are added', () => {
      const importCollection = new ImportCollection();
      expect(importCollection.toString()).toBe('');
    });

    it('should return a string of imports when imports are added', () => {
      const importCollection = new ImportCollection();
      importCollection.addImport('SomeClass', 'some.package');
      importCollection.addImport('AnotherClass', 'another.package');
      expect(importCollection.toString()).toBe(
        `import another.package.AnotherClass${EOL}import some.package.SomeClass${EOL}`,
      );
    });
  });

  describe('writeTo', () => {
    it('should write imports to a StringBuilder', () => {
      const importCollection = new ImportCollection();
      importCollection.addImport('SomeClass', 'some.package');
      importCollection.addImport('AnotherClass', 'another.package');
      const builder = new StringBuilder();
      importCollection.writeTo(builder);
      expect(builder.toString()).toBe(`import another.package.AnotherClass${EOL}import some.package.SomeClass${EOL}`);
    });
  });

  it('should ignore global imports', () => {
    const importCollection = new ImportCollection({
      globalImports: ['kotlin.*', 'myPackage.MyClass'],
    });
    importCollection.addImport('String', 'kotlin');
    importCollection.addImport('Int', 'kotlin');
    importCollection.addImport('MyClass', 'myPackage');
    importCollection.addImport('MyOtherClass', 'myPackage');
    expect(importCollection.toString()).toBe(`import myPackage.MyOtherClass${EOL}`);
  });
});
