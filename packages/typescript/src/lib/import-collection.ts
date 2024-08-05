import { extname } from 'path';

import { SourceBuilderOptions, StringBuilder } from '@goast/core';

import { TypeScriptImport, TypeScriptImportKind, TypeScriptImportType } from './common-results';
import { defaultTypeScriptGeneratorConfig } from './config';
import { ImportModuleTransformer, getModulePathRelativeToFile } from './utils';

export type ImportExportCollectionOptions = {
  filePath?: string;
  importModuleTransformer: ImportModuleTransformer;
  useSingleQuotes: boolean;
};

export const defaultImportExportCollectionOptions: ImportExportCollectionOptions = {
  importModuleTransformer: defaultTypeScriptGeneratorConfig.importModuleTransformer,
  useSingleQuotes: defaultTypeScriptGeneratorConfig.useSingleQuotes,
};

export type TypeScriptImportOptions = { type?: TypeScriptImportType };

export class ImportExportCollection {
  private readonly _imports: Map<string, Set<string>> = new Map();
  private readonly _typeImports: Map<string, Set<string>> = new Map();
  private readonly _jsDocImports: Map<string, Set<string>> = new Map();
  private readonly _exports: Map<string, Set<string>> = new Map();
  private readonly _options: ImportExportCollectionOptions;

  constructor(options?: Partial<ImportExportCollectionOptions>) {
    this._options = { ...defaultImportExportCollectionOptions, ...options };
  }

  public get hasImports(): boolean {
    return this._imports.size > 0 || this._typeImports.size > 0 || this._jsDocImports.size > 0;
  }

  public get hasExports(): boolean {
    return this._exports.size > 0;
  }

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

  public addImport(importName: string, fromModule: string, options?: TypeScriptImportOptions): void {
    const map = this.getImportMap(options?.type ?? 'import');
    const existingImport = map.get(fromModule);
    if (existingImport) {
      existingImport.add(importName);
    } else {
      map.set(fromModule, new Set([importName]));
    }
  }

  getImportMap(type: TypeScriptImportType) {
    switch (type) {
      case 'import':
        return this._imports;
      case 'type-import':
        return this._typeImports;
      case 'js-doc':
        return this._jsDocImports;
    }
  }

  public addExport(exportName: string, fromModule: string): void {
    const existingExport = this._exports.get(fromModule);
    if (existingExport) {
      existingExport.add(exportName);
    } else {
      this._exports.set(fromModule, new Set([exportName]));
    }
  }

  public clear(): void {
    this._imports.clear();
    this._exports.clear();
  }

  public toString(options: Partial<SourceBuilderOptions>): string {
    const builder = new StringBuilder(options);
    this.writeTo(builder);
    return builder.toString();
  }

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
    }
  }

  protected writeImportsExports(
    builder: StringBuilder,
    keyword: 'import' | 'export' | 'import type' | ' * @import',
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
      .sort(([fromModuleA], [fromModuleB]) => fromModuleA.localeCompare(fromModuleB))
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
}
