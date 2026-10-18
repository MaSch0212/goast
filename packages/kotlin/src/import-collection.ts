import { compareString, type SourceBuilderOptions, StringBuilder } from '@goast/core';

import type { KotlinImport } from './common-results.ts';
import { defaultKotlinGeneratorConfig } from './config.ts';

/**
 * The options of an `ImportCollection`.
 */
export type ImportCollectionOptions = {
  /**
   * The imports to leave out when the collection is written. An entry ending in `.*` excludes a whole package, and any
   * other entry excludes a single type by its fully qualified name.
   * @default defaultKotlinGeneratorConfig.globalImports
   * @see KotlinGeneratorConfig.globalImports
   */
  globalImports: string[];
};

/**
 * The options that an `ImportCollection` falls back to for any option that is not given. Its `globalImports` is the
 * default of `defaultKotlinGeneratorConfig`.
 * @see defaultKotlinGeneratorConfig
 */
export const defaultImportCollectionOptions: ImportCollectionOptions = {
  globalImports: defaultKotlinGeneratorConfig.globalImports,
};

/**
 * Collects the types that a generated Kotlin file imports and writes them as `import` statements.
 *
 * Each type is stored once per package. When written, the imports are sorted by their full path, ignoring case, and
 * imports whose path starts with `kotlin.`, `java.` or `javax.` come after all others. Imports that match
 * `globalImports` are not written, but the `imports` getter still returns them.
 * @see ImportCollectionOptions
 * @see KotlinFileBuilder
 */
export class ImportCollection {
  private readonly _imports: Map<string, Set<string>> = new Map();
  private readonly _options: ImportCollectionOptions;

  /**
   * Initializes a new instance of the ImportCollection class.
   * @param options The options to use for this instance. Options that are not given keep their defaults.
   */
  constructor(options: Partial<ImportCollectionOptions> = {}) {
    this._options = { ...defaultImportCollectionOptions, ...options };
  }

  /**
   * Gets a value indicating whether any import has been added. This includes imports that `globalImports` leaves out
   * when the collection is written.
   */
  public get hasImports(): boolean {
    return this._imports.size > 0;
  }

  /**
   * Gets all added imports, one entry per type with its package. Unlike `writeTo`, this does not apply `globalImports`.
   * @returns The added imports, grouped by package in the order in which the first import of each package was added.
   */
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

  /**
   * Adds the import of a type from a package. Nothing is added when `fromModule` is empty.
   * @param importName The name of the type, such as `List`.
   * @param fromModule The package the type is declared in, such as `kotlin.collections`.
   */
  public addImport(importName: string, fromModule: string): void;
  /**
   * Adds the import described by a `KotlinImport`. Nothing is added when its `packageName` is missing.
   * @param importObj The import to add.
   */
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

  /**
   * Adds several imports, one after the other, as `addImport` does for each of them.
   * @param imports The imports to add.
   */
  public addImports(imports: KotlinImport[]): void {
    for (const importObj of imports) {
      this.addImport(importObj);
    }
  }

  /**
   * Removes all added imports.
   */
  public clear(): void {
    this._imports.clear();
  }

  /**
   * Gets the import statements as text. This is the same text that `writeTo` appends.
   * @param options The options of the string builder that builds the text, such as the line break characters.
   * @returns The import statements, one per line. Empty when no import is left to write.
   */
  public toString(options?: Partial<SourceBuilderOptions>): string {
    const builder = new StringBuilder(options);
    this.writeTo(builder);
    return builder.toString();
  }

  /**
   * Appends one `import` statement per line to the builder, in the order described on `ImportCollection`. Writes
   * nothing when no import is left after filtering.
   *
   * An import is left out when its package is listed in `globalImports` as an entry ending in `.*`, or when its full
   * path (`package.Type`) is listed as an entry without that suffix.
   * @param builder The builder to append the import statements to.
   */
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
          return compareString(a, b);
        })
        .forEach((importPath) => builder.appendLine(`import ${importPath}`));
    }
  }
}

function isCoreImport(importPath: string): boolean {
  return importPath.startsWith('kotlin.') || importPath.startsWith('java.') || importPath.startsWith('javax.');
}
