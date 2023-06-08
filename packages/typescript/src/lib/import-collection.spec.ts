import { ImportExportCollection } from './import-collection';

describe('ImportExportCollection', () => {
  let collection: ImportExportCollection;

  beforeEach(() => {
    collection = new ImportExportCollection();
  });

  describe('addImport', () => {
    it('should add a new import to the collection', () => {
      collection.addImport('myImport', 'myModule');
      expect(collection.hasImports).toBe(true);
      expect(collection.hasExports).toBe(false);
      expect(collection.toString('\n')).toBe("import { myImport } from 'myModule';\n");
    });

    it('should add a new import to an existing module', () => {
      collection.addImport('myImport1', 'myModule');
      collection.addImport('myImport2', 'myModule');
      expect(collection.hasImports).toBe(true);
      expect(collection.hasExports).toBe(false);
      expect(collection.toString('\n')).toBe("import { myImport1, myImport2 } from 'myModule';\n");
    });
  });

  describe('addExport', () => {
    it('should add a new export to the collection', () => {
      collection.addExport('myExport', 'myModule');
      expect(collection.hasImports).toBe(false);
      expect(collection.hasExports).toBe(true);
      expect(collection.toString('\n')).toBe("export { myExport } from 'myModule';\n");
    });

    it('should add a new export to an existing module', () => {
      collection.addExport('myExport1', 'myModule');
      collection.addExport('myExport2', 'myModule');
      expect(collection.hasImports).toBe(false);
      expect(collection.hasExports).toBe(true);
      expect(collection.toString('\n')).toBe("export { myExport1, myExport2 } from 'myModule';\n");
    });
  });

  describe('clear', () => {
    it('should clear the collection', () => {
      collection.addImport('myImport', 'myModule');
      collection.addExport('myExport', 'myModule');
      expect(collection.hasImports).toBe(true);
      expect(collection.hasExports).toBe(true);
      collection.clear();
      expect(collection.hasImports).toBe(false);
      expect(collection.hasExports).toBe(false);
      expect(collection.toString('\n')).toBe('');
    });
  });

  describe('toString', () => {
    it('should return an empty string if the collection is empty', () => {
      expect(collection.toString('\n')).toBe('');
    });

    it('should return a string representation of the collection', () => {
      collection.addImport('myImport', 'myModule');
      collection.addExport('myExport', 'myModule');
      expect(collection.toString('\n')).toBe(
        "import { myImport } from 'myModule';\n\nexport { myExport } from 'myModule';\n"
      );
    });
  });
});
