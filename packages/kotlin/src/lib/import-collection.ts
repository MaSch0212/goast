import { SourceBuilderOptions, StringBuilder } from '@goast/core';

import { KotlinImport } from './common-results';
import { defaultKotlinGeneratorConfig } from './config';

export type ImportCollectionOptions = {
  globalImports: string[];
};

export const defaultImportCollectionOptions: ImportCollectionOptions = {
  globalImports: defaultKotlinGeneratorConfig.globalImports,
};

export class ImportCollection {
  private readonly _imports: Map<string, Set<string>> = new Map();
  private readonly _options: ImportCollectionOptions;

  constructor(options: Partial<ImportCollectionOptions> = {}) {
    this._options = { ...defaultImportCollectionOptions, ...options };
  }

  public get hasImports(): boolean {
    return this._imports.size > 0;
  }

  public get imports(): KotlinImport[] {
    return Array.from(this._imports.entries())
      .map(([fromPackage, importNames]) =>
        Array.from(importNames).map((importName) => ({
          packageName: fromPackage,
          typeName: importName,
        })),
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

  public toString(options?: Partial<SourceBuilderOptions>): string {
    const builder = new StringBuilder(options);
    this.writeTo(builder);
    return builder.toString();
  }

  public writeTo(builder: StringBuilder) {
    if (this._imports.size > 0) {
      const globalPackages = this._options.globalImports
        .filter((g) => g.endsWith('.*'))
        .map((g) => g.substring(0, g.length - 2));
      const globalImports = this._options.globalImports.filter((g) => !g.endsWith('.*'));

      Array.from(this._imports.entries())
        .filter(([packageName]) => !globalPackages.includes(packageName))
        .flatMap(([packageName, importNames]) => Array.from(importNames).map((importName) => [packageName, importName]))
        .map(([packageName, importName]) => `${packageName}.${importName}`)
        .filter((importPath) => !globalImports.includes(importPath))
        .sort((a, b) => {
          if (isCoreImport(a) && !isCoreImport(b)) {
            return 1;
          } else if (!isCoreImport(a) && isCoreImport(b)) {
            return -1;
          }
          return a.localeCompare(b);
        })
        .forEach((importPath) => builder.appendLine(`import ${importPath}`));
    }
  }
}

function isCoreImport(importPath: string): boolean {
  return importPath.startsWith('kotlin.') || importPath.startsWith('java.') || importPath.startsWith('javax.');
}
