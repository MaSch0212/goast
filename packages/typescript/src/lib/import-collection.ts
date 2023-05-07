export class ImportCollection {
  private readonly _imports: Map<string, Set<string>> = new Map();

  public get hasImports(): boolean {
    return this._imports.size > 0;
  }

  public addImport(importName: string, fromModule: string): void {
    const existingImport = this._imports.get(fromModule);
    if (existingImport) {
      existingImport.add(importName);
    } else {
      this._imports.set(fromModule, new Set([importName]));
    }
  }

  public clear(): void {
    this._imports.clear();
  }

  public toString(newLineChar: string): string {
    let output = '';
    for (const [fromModule, importNames] of this._imports.entries()) {
      output += `import { ${Array.from(importNames).join(
        ', '
      )} } from '${fromModule}';${newLineChar}`;
    }
    return output;
  }
}
