import { SourceBuilderOptions, StringBuilder } from '@goast/core';

import { KotlinImport } from './common-results';

export class ImportCollection {
  private readonly _imports: Map<string, Set<string>> = new Map();

  public get hasImports(): boolean {
    return this._imports.size > 0;
  }

  public get imports(): KotlinImport[] {
    return Array.from(this._imports.entries())
      .map(([fromPackage, importNames]) =>
        Array.from(importNames).map((importName) => ({
          packageName: fromPackage,
          typeName: importName,
        }))
      )
      .flat();
  }

  public addImport(importName: string, fromModule: string): void;
  public addImport(importObj: KotlinImport): void;
  public addImport(importOrImportName: KotlinImport | string, fromModule?: string): void {
    const importName = typeof importOrImportName === 'string' ? importOrImportName : importOrImportName.typeName;
    fromModule = typeof importOrImportName === 'string' ? fromModule : importOrImportName.packageName;

    if (!fromModule) {
      return;
    }

    const existingImport = this._imports.get(fromModule);
    if (existingImport) {
      existingImport.add(importName);
    } else {
      this._imports.set(fromModule!, new Set([importName]));
    }
  }

  public addImports(imports: KotlinImport[]): void {
    for (const importObj of imports) {
      this.addImport(importObj);
    }
  }

  public clear(): void {
    this._imports.clear();
  }

  public toString(options: Partial<SourceBuilderOptions>): string {
    const builder = new StringBuilder(options);
    this.writeTo(builder);
    return builder.toString();
  }

  public writeTo(builder: StringBuilder) {
    if (this._imports.size > 0) {
      const sortedImports = Array.from(this._imports.entries()).sort(([fromModuleA], [fromModuleB]) => {
        if (isCoreImport(fromModuleA) && !isCoreImport(fromModuleB)) {
          return 1;
        } else if (!isCoreImport(fromModuleA) && isCoreImport(fromModuleB)) {
          return -1;
        }
        return fromModuleA.localeCompare(fromModuleB);
      });
      for (const [fromPackage, importNames] of sortedImports) {
        const sortedImportNames = Array.from(importNames).sort();
        for (const importName of sortedImportNames) {
          builder.appendLine(`import ${fromPackage}.${importName}`);
        }
      }
    }
  }
}

function isCoreImport(packageName: string): boolean {
  return packageName.startsWith('kotlin.') || packageName.startsWith('java.') || packageName.startsWith('javax.');
}
