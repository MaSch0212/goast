import type { TypeScriptExportOptions } from './import-collection.ts';

/**
 * The kind of TypeScript declaration that a generated component is. The models index file re-exports components of
 * kind `type` and `interface` with `export type`.
 */
export type TypeScriptComponentOutputKind = 'interface' | 'type' | 'enum' | 'class' | 'function' | 'variable';
/**
 * Describes a component (a type, interface, enum, class, ...) that a generator wrote or declared. The models generator
 * publishes one of these for each schema as `typescript.models[schemaId]`, so that later generators can reference the
 * component with `TypeScriptFileBuilder.appendModelUsage` without knowing how it was generated.
 */
export type TypeScriptComponentOutput = {
  /**
   * The name of the component. For an unnamed schema that is inlined, this is the type declaration itself.
   */
  component: string;
  /**
   * The path of the file that the component was saved to. Omitted if the component is not saved in a file of its own.
   */
  filePath?: string;
  /**
   * The imports that are required to use the component. For a component saved in a file, this is the import from
   * that file.
   */
  imports: TypeScriptImport[];
  /**
   * Other names that the file at `filePath` exports besides `component`. Strings are value exports, and objects can
   * set the export type with `type`. The models index file re-exports them.
   */
  additionalExports?: string[] | ({ name: string } & TypeScriptExportOptions)[];
  /**
   * The kind of declaration of the component, if known. See `TypeScriptComponentOutputKind`.
   */
  kind?: TypeScriptComponentOutputKind;
};

/**
 * A component that a generator wrote to a file of its own, so the file path is always known. The `type` option of
 * `TypeScriptExportOptions` sets how the component is exported.
 */
export type TypeScriptExportOutput = {
  /**
   * The name of the exported component.
   */
  component: string;
  /**
   * The path of the file that the component was written to.
   */
  filePath: string;
} & TypeScriptExportOptions;

/**
 * How the module path of an import is resolved. A `file` is a project file whose path ends in `.ts`, `.js` or `.json`.
 * Its path is written relative to the importing file and transformed by `importModuleTransformer`. A `module` is a
 * package name, such as `rxjs`, which is written as it is.
 */
export type TypeScriptImportKind = 'module' | 'file';
/**
 * The form of an import statement. `import` writes `import { X } from '...';`, `type-import` writes
 * `import type { X } from '...';`, and `js-doc` writes the name in an `@import` tag inside a JSDoc comment.
 */
export type TypeScriptImportType = 'import' | 'type-import' | 'js-doc';
/**
 * The form of a re-export statement. `export` writes `export { X } from '...';`, and `type-export` writes
 * `export type { X } from '...';`.
 */
export type TypeScriptExportType = 'export' | 'type-export';

/**
 * A single named import that a component needs. The imports are collected by `ImportExportCollection` and written as
 * import statements at the top of the file by `TypeScriptFileBuilder`.
 */
export type TypeScriptImport = {
  /**
   * Whether `modulePath` is a project file or a package. See `TypeScriptImportKind`.
   */
  kind: TypeScriptImportKind;
  /**
   * The form of the import statement. See `TypeScriptImportType`.
   */
  type: TypeScriptImportType;
  /**
   * The path of the file that exports the name for a `file` import, or the package name for a `module` import.
   */
  modulePath: string;
  /**
   * The name that is imported.
   */
  name: string;
};
