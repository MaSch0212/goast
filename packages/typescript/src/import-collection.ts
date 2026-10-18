import { extname } from 'node:path';

import { compareString, type SourceBuilderOptions, StringBuilder } from '@goast/core';

import type {
  TypeScriptExportType,
  TypeScriptImport,
  TypeScriptImportKind,
  TypeScriptImportType,
} from './common-results.ts';
import { defaultTypeScriptGeneratorConfig } from './config.ts';
import { getModulePathRelativeToFile, type ImportModuleTransformer } from './utils.ts';

/**
 * The options of an `ImportExportCollection`.
 */
export type ImportExportCollectionOptions = {
  /**
   * The path of the file that the statements are written to. Paths of project files are made relative to it. If it is
   * omitted, file paths are written as they are.
   */
  filePath?: string;
  /**
   * The transformer that writes the relative module paths of project files.
   * @default 'omit-extension'
   */
  importModuleTransformer: ImportModuleTransformer;
  /**
   * Whether the module paths are quoted with single quotes instead of double quotes.
   * @default true
   */
  useSingleQuotes: boolean;
};

/**
 * The default options of an `ImportExportCollection`. The transformer and the quote style are taken from
 * `defaultTypeScriptGeneratorConfig`.
 */
export const defaultImportExportCollectionOptions: ImportExportCollectionOptions = {
  importModuleTransformer: defaultTypeScriptGeneratorConfig.importModuleTransformer,
  useSingleQuotes: defaultTypeScriptGeneratorConfig.useSingleQuotes,
};

/**
 * The options of an import that is added with `addImport`. Its `type` property sets the form of the import statement,
 * see `TypeScriptImportType`, and defaults to `'import'`.
 */
export type TypeScriptImportOptions = { type?: TypeScriptImportType };
/**
 * The options of an export that is added with `addExport`. Its `type` property sets the form of the export statement,
 * see `TypeScriptExportType`, and defaults to `'export'`.
 */
export type TypeScriptExportOptions = { type?: TypeScriptExportType };

/**
 * Collects the imports and re-exports of a file, and writes them as import and export statements.
 *
 * Names are stored per module path, in one map for each form: `import`, `import type` and `@import` names, and the same
 * for re-exports. Adding a name that is already present has no effect, so each name is written once per module.
 *
 * When the statements are written, a project file (a path ending in `.ts`, `.js` or `.json`) is turned into a relative
 * path from the file that the statements are written to, and transformed with `importModuleTransformer`. A package
 * name, such as `rxjs`, is written as it is. The statements are written in this order: value imports, type imports, the
 * `@import` block, value re-exports and type re-exports. Module imports come before file imports, separated by a blank
 * line.
 *
 * `TypeScriptFileBuilder` owns one of these collections. It adds the imports of every `TsReference` node that has a
 * module or file path, and it passes its own `filePath` and options to the collection.
 */
export class ImportExportCollection {
  private readonly _imports: Map<string, Set<string>> = new Map();
  private readonly _typeImports: Map<string, Set<string>> = new Map();
  private readonly _jsDocImports: Map<string, Set<string>> = new Map();
  private readonly _exports: Map<string, Set<string>> = new Map();
  private readonly _typeExports: Map<string, Set<string>> = new Map();
  private readonly _options: ImportExportCollectionOptions;

  /**
   * Initializes a new instance of the ImportExportCollection class.
   * @param options The options of the collection. Options that are not given use the defaults.
   */
  constructor(options?: Partial<ImportExportCollectionOptions>) {
    this._options = { ...defaultImportExportCollectionOptions, ...options };
  }

  /**
   * Gets a value indicating whether at least one import of any form has been added.
   */
  public get hasImports(): boolean {
    return this._imports.size > 0 || this._typeImports.size > 0 || this._jsDocImports.size > 0;
  }

  /**
   * Gets a value indicating whether at least one re-export of any form has been added.
   */
  public get hasExports(): boolean {
    return this._exports.size > 0 || this._typeExports.size > 0;
  }

  /**
   * Gets all collected imports as a flat list. The module paths are the unresolved ones, as they were passed to
   * `addImport`, so they are not yet relative to the file.
   */
  public get imports(): TypeScriptImport[] {
    return [
      ...this.toImport('import', this._imports),
      ...this.toImport('type-import', this._typeImports),
      ...this.toImport('js-doc', this._jsDocImports),
    ];
  }

  private toImport(type: TypeScriptImportType, map: Map<string, Set<string>>): TypeScriptImport[] {
    return Array.from(map.entries())
      .map(([fromModule, importNames]) =>
        Array.from(importNames).map(
          (importName) =>
            ({
              kind: this.getImportKind(fromModule),
              type,
              modulePath: fromModule,
              name: importName,
            }) satisfies TypeScriptImport,
        ),
      )
      .flat();
  }

  /**
   * Adds a named import from a module or a file. Adding the same name from the same module again has no effect.
   * @param importName The name to import.
   * @param fromModule The module name, such as `rxjs`, or the path of the file that exports the name.
   * @param options The options of the import, such as the import type. Defaults to a value import.
   */
  public addImport(importName: string, fromModule: string, options?: TypeScriptImportOptions): void {
    const map = this.getImportMap(options?.type ?? 'import');
    const existingImport = map.get(fromModule);
    if (existingImport) {
      existingImport.add(importName);
    } else {
      map.set(fromModule, new Set([importName]));
    }
  }

  /**
   * Adds a named re-export from a module or a file. Adding the same name from the same module again has no effect.
   * @param exportName The name to re-export.
   * @param fromModule The module name, or the path of the file that exports the name.
   * @param options The options of the export, such as the export type. Defaults to a value export.
   */
  public addExport(exportName: string, fromModule: string, options?: TypeScriptExportOptions): void {
    const map = this.getExportMap(options?.type ?? 'export');
    const existingExport = map.get(fromModule);
    if (existingExport) {
      existingExport.add(exportName);
    } else {
      map.set(fromModule, new Set([exportName]));
    }
  }

  /**
   * Removes all collected imports and re-exports.
   */
  public clear(): void {
    this._imports.clear();
    this._typeImports.clear();
    this._jsDocImports.clear();
    this._exports.clear();
    this._typeExports.clear();
  }

  /**
   * Renders the import and export statements as a string.
   * @param options The options of the builder that the statements are written with.
   * @returns The import and export statements.
   */
  public toString(options: Partial<SourceBuilderOptions>): string {
    const builder = new StringBuilder(options);
    this.writeTo(builder);
    return builder.toString();
  }

  /**
   * Writes the import and export statements to a builder. The statements are written in the order described for the
   * class, and the groups are separated by a blank line.
   * @param builder The builder to write the statements to.
   */
  public writeTo(builder: StringBuilder) {
    const { filePath, importModuleTransformer, useSingleQuotes } = this._options;
    let hasPrevious = false;

    if (this._imports.size > 0) {
      const sortedImports = this.sortAndResolve(this._imports, filePath, importModuleTransformer);
      this.writeImportsExports(builder, 'import', sortedImports, { useSingleQuotes });
      hasPrevious = true;
    }

    if (this._typeImports.size > 0) {
      if (hasPrevious) {
        builder.appendLine();
      }
      const sortedImports = this.sortAndResolve(this._typeImports, filePath, importModuleTransformer);
      this.writeImportsExports(builder, 'import type', sortedImports, { useSingleQuotes });
      hasPrevious = true;
    }

    if (this._jsDocImports.size > 0) {
      if (hasPrevious) {
        builder.appendLine();
      }
      const sortedImports = this.sortAndResolve(this._jsDocImports, filePath, importModuleTransformer);
      builder.appendLine('/**');
      this.writeImportsExports(builder, ' * @import', sortedImports, { useSingleQuotes });
      builder.appendLine(' */');
      hasPrevious = true;
    }

    if (this._exports.size > 0) {
      if (hasPrevious) {
        builder.appendLine();
      }
      const sortedExports = this.sortAndResolve(this._exports, filePath, importModuleTransformer);
      this.writeImportsExports(builder, 'export', sortedExports, { useSingleQuotes });
      hasPrevious = true;
    }

    if (this._typeExports.size > 0) {
      if (hasPrevious) {
        builder.appendLine();
      }
      const sortedExports = this.sortAndResolve(this._typeExports, filePath, importModuleTransformer);
      this.writeImportsExports(builder, 'export type', sortedExports, { useSingleQuotes });
      hasPrevious = true;
    }
  }

  protected writeImportsExports(
    builder: StringBuilder,
    keyword: 'import' | 'export' | 'import type' | 'export type' | ' * @import',
    data: (readonly [string, TypeScriptImportKind, string[]])[],
    options: { useSingleQuotes: boolean },
  ) {
    const moduleData: (readonly [string, TypeScriptImportKind, string[]])[] = [];
    const fileData: (readonly [string, TypeScriptImportKind, string[]])[] = [];
    for (const x of data) {
      if (x[1] === 'module') {
        moduleData.push(x);
      } else {
        fileData.push(x);
      }
    }

    const quote = options.useSingleQuotes ? "'" : '"';

    for (const [fromModule, _, names] of moduleData) {
      builder.appendLine(`${keyword} { ${names.join(', ')} } from ${quote}${fromModule}${quote};`);
    }

    if (moduleData.length > 0 && fileData.length > 0) {
      builder.appendLine();
    }

    for (const [fromModule, _, names] of fileData) {
      builder.appendLine(`${keyword} { ${names.join(', ')} } from ${quote}${fromModule}${quote};`);
    }
  }

  protected sortAndResolve(
    data: Map<string, Set<string>>,
    filePath: string | undefined,
    importModuleTransformer: ImportModuleTransformer,
  ): (readonly [string, TypeScriptImportKind, string[]])[] {
    return Array.from(data.entries())
      .sort(([a], [b]) => compareString(a, b))
      .map(
        ([fromModule, names]) =>
          [...this.resolveModulePath(fromModule, filePath, importModuleTransformer), Array.from(names).sort()] as const,
      );
  }

  protected getImportKind(fromModule: string): TypeScriptImportKind {
    const extName = extname(fromModule).toUpperCase();
    return extName === '.TS' || extName === '.JS' || extName === '.JSON' ? 'file' : 'module';
  }

  protected resolveModulePath(
    fromModule: string,
    filePath: string | undefined,
    importModuleTransformer: ImportModuleTransformer,
  ): [string, TypeScriptImportKind] {
    const kind = this.getImportKind(fromModule);
    return [
      filePath && kind === 'file'
        ? getModulePathRelativeToFile(filePath, fromModule, importModuleTransformer)
        : fromModule,
      kind,
    ];
  }

  protected getImportMap(type: TypeScriptImportType): Map<string, Set<string>> {
    switch (type) {
      case 'import':
        return this._imports;
      case 'type-import':
        return this._typeImports;
      case 'js-doc':
        return this._jsDocImports;
    }
  }

  protected getExportMap(type: TypeScriptExportType): Map<string, Set<string>> {
    switch (type) {
      case 'export':
        return this._exports;
      case 'type-export':
        return this._typeExports;
    }
  }
}
