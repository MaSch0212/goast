import { compareString, type SourceBuilderOptions, StringBuilder } from '@goast/core';

import { defaultCSharpGeneratorConfig } from './config.ts';

export type UsingCollectionOptions = {
  /** Namespaces that are imported project-wide and therefore never need a `using` directive. */
  globalUsings: string[];
  /**
   * The namespace of the file the usings are written to. Neither this namespace nor any of its parent namespaces
   * need a `using` directive.
   */
  namespace?: string;
};

export const defaultUsingCollectionOptions: UsingCollectionOptions = {
  globalUsings: defaultCSharpGeneratorConfig.globalUsings,
};

export class UsingCollection {
  private readonly _usings: Set<string> = new Set();
  private readonly _options: UsingCollectionOptions;

  constructor(options: Partial<UsingCollectionOptions> = {}) {
    this._options = { ...defaultUsingCollectionOptions, ...options };
  }

  public get hasUsings(): boolean {
    return this.usings.length > 0;
  }

  /**
   * The namespaces that need a `using` directive: `System*` namespaces first, then alphabetical. Global usings and the
   * file's own namespace (and its parents) are left out.
   */
  public get usings(): string[] {
    const { globalUsings, namespace } = this._options;
    return Array.from(this._usings)
      .filter((ns) => !globalUsings.includes(ns))
      .filter((ns) => namespace === undefined || !(ns === namespace || namespace.startsWith(`${ns}.`)))
      .sort((a, b) => {
        if (isSystemNamespace(a) && !isSystemNamespace(b)) {
          return -1;
        } else if (!isSystemNamespace(a) && isSystemNamespace(b)) {
          return 1;
        }
        return compareString(a, b);
      });
  }

  public addUsing(namespace: string): void {
    if (namespace) {
      this._usings.add(namespace);
    }
  }

  public addUsings(namespaces: string[]): void {
    for (const namespace of namespaces) {
      this.addUsing(namespace);
    }
  }

  public clear(): void {
    this._usings.clear();
  }

  public toString(options?: Partial<SourceBuilderOptions>): string {
    const builder = new StringBuilder(options);
    this.writeTo(builder);
    return builder.toString();
  }

  public writeTo(builder: StringBuilder) {
    this.usings.forEach((ns) => builder.appendLine(`using ${ns};`));
  }
}

function isSystemNamespace(namespace: string): boolean {
  return namespace === 'System' || namespace.startsWith('System.');
}
