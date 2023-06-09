import { SourceBuilderOptions, StringBuilder } from '@goast/core';

export class ImportExportCollection {
  private readonly _imports: Map<string, Set<string>> = new Map();
  private readonly _exports: Map<string, Set<string>> = new Map();

  public get hasImports(): boolean {
    return this._imports.size > 0;
  }

  public get hasExports(): boolean {
    return this._exports.size > 0;
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
    if (this._imports.size > 0) {
      const sortedImports = Array.from(this._imports.entries()).sort(([fromModuleA], [fromModuleB]) =>
        fromModuleA.localeCompare(fromModuleB)
      );
      for (const [fromModule, importNames] of sortedImports) {
        const sortedImportNames = Array.from(importNames).sort();
        builder.appendLine(`import { ${sortedImportNames.join(', ')} } from '${fromModule}';`);
      }
    }

    if (this._imports.size > 0 && this._exports.size > 0) {
      builder.appendLine();
    }

    if (this._exports.size > 0) {
      const sortedExports = Array.from(this._exports.entries()).sort(([fromModuleA], [fromModuleB]) =>
        fromModuleA.localeCompare(fromModuleB)
      );
      for (const [fromModule, exportNames] of sortedExports) {
        const sortedExportNames = Array.from(exportNames).sort();
        builder.appendLine(`export { ${sortedExportNames.join(', ')} } from '${fromModule}';`);
      }
    }
  }
}
