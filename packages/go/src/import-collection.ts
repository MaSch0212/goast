import { compareString, type StringBuilder } from '@goast/core';

import { goKeywords, toGoPackageName } from './utils.ts';

export type GoImport = {
  /** The import path, e.g. `net/http`. */
  path: string;
  /** The name the package is referred to by in the file. */
  name: string;
  /** Whether `name` differs from the package's own name and has to be written as an alias. */
  aliased: boolean;
};

/**
 * The imports of one Go file.
 *
 * Every import gets a distinct name within the file: when two packages share a name (e.g. `math/rand` and
 * `crypto/rand`), the later one is aliased with a counter (`rand2`).
 */
export class GoImportCollection {
  private readonly _imports = new Map<string, GoImport>();
  private readonly _reservedNames: Set<string>;

  /**
   * @param reservedNames Names imports must not use, e.g. identifiers declared at the top level of the file.
   */
  constructor(reservedNames: Iterable<string> = []) {
    this._reservedNames = new Set(reservedNames);
  }

  public get hasImports(): boolean {
    return this._imports.size > 0;
  }

  public get imports(): GoImport[] {
    return [...this._imports.values()];
  }

  /**
   * Adds an import and returns the name to refer to the package by.
   * @param path The import path.
   * @param packageName The name the package declares, if it differs from the last segment of its path (e.g.
   * `gopkg.in/yaml.v3` declares `yaml`).
   */
  public addImport(path: string, packageName?: string): string {
    const existing = this._imports.get(path);
    if (existing) return existing.name;

    const ownName = packageName ?? defaultPackageName(path);
    const used = new Set([...this._reservedNames, ...[...this._imports.values()].map((x) => x.name)]);
    let name = ownName;
    for (let i = 2; used.has(name) || goKeywords.has(name); i++) name = `${ownName}${i}`;

    this._imports.set(path, { path, name, aliased: name !== ownName || ownName !== defaultPackageName(path) });
    return name;
  }

  public clear(): void {
    this._imports.clear();
  }

  /**
   * Writes the import declaration: standard library packages first, then a blank line and all others, each group
   * sorted by path, as `goimports` does.
   */
  public writeTo(builder: StringBuilder): void {
    if (this._imports.size === 0) return;

    const all = [...this._imports.values()].sort((a, b) => compareString(a.path, b.path));
    const groups = [all.filter((x) => isStandardLibrary(x.path)), all.filter((x) => !isStandardLibrary(x.path))].filter(
      (x) => x.length > 0,
    );
    const spec = (x: GoImport) => `${x.aliased ? `${x.name} ` : ''}"${x.path}"`;

    if (all.length === 1) {
      builder.appendLine(`import ${spec(all[0])}`);
      return;
    }

    builder.appendLine('import (');
    groups.forEach((group, index) => {
      if (index > 0) builder.appendLine();
      for (const x of group) builder.appendLine(`\t${spec(x)}`);
    });
    builder.appendLine(')');
  }
}

/** The package name `go` assumes for an import path: its last segment, without a major version suffix. */
function defaultPackageName(path: string): string {
  const segments = path.split('/');
  let last = segments.at(-1) ?? path;
  if (/^v[0-9]+$/.test(last) && segments.length > 1) {
    last = segments.at(-2)!;
  }
  return toGoPackageName(last.replace(/\.v[0-9]+$/, '').replace(/^go-/, ''));
}

/** Standard library paths have no dot in their first segment (`net/http`, unlike `github.com/...`). */
function isStandardLibrary(path: string): boolean {
  return !path.split('/')[0].includes('.');
}
