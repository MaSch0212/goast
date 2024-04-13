import { extname } from 'path';

import { SourceBuilderOptions, StringBuilder } from '@goast/core';

import { TypeScriptImport, TypeScriptImportKind } from './common-results';
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

export class ImportExportCollection {
  private readonly _imports: Map<string, Set<string>> = new Map();
  private readonly _exports: Map<string, Set<string>> = new Map();
  private readonly _options: ImportExportCollectionOptions;

  constructor(options?: Partial<ImportExportCollectionOptions>) {
    this._options = { ...defaultImportExportCollectionOptions, ...options };
  }

  public get hasImports(): boolean {
    return this._imports.size > 0;
  }

  public get hasExports(): boolean {
    return this._exports.size > 0;
  }

  public get imports(): TypeScriptImport[] {
    return Array.from(this._imports.entries())
      .map(([fromModule, importNames]) =>
        Array.from(importNames).map(
          (importName) =>
            ({
              kind: this.getImportKind(fromModule),
              modulePath: fromModule,
              name: importName,
            }) satisfies TypeScriptImport,
        ),
      )
      .flat();
  }

  public addImport(importName: string, fromModule: string): void {
    const existingImport = this._imports.get(fromModule);
    if (existingImport) {
      existingImport.add(importName);
    } else {
      this._imports.set(fromModule, new Set([importName]));
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

    if (this._imports.size > 0) {
      const sortedImports = this.sortAndResolve(this._imports, filePath, importModuleTransformer);
      this.writeImportsExports(builder, 'import', sortedImports, { useSingleQuotes });
    }

    if (this._imports.size > 0 && this._exports.size > 0) {
      builder.appendLine();
    }

    if (this._exports.size > 0) {
      const sortedExports = this.sortAndResolve(this._exports, filePath, importModuleTransformer);
      this.writeImportsExports(builder, 'export', sortedExports, { useSingleQuotes });
    }
  }

  protected writeImportsExports(
    builder: StringBuilder,
    keyword: 'import' | 'export',
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
