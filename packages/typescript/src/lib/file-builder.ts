import { SourceBuilder } from '@goast/core/utils';

import { TypeScriptGeneratorConfig } from './config';
import { ImportExportCollection } from './import-collection';
import { getModulePathRelativeToFile } from './utils';

export class TypeScriptFileBuilder extends SourceBuilder {
  public readonly filePath: string | undefined;
  public readonly imports = new ImportExportCollection();

  public override get options(): TypeScriptGeneratorConfig {
    return super.options as TypeScriptGeneratorConfig;
  }

  constructor(filePath: string | undefined, options: TypeScriptGeneratorConfig) {
    super(options);
    this.filePath = filePath;
  }

  public addImport(name: string, filePath: string): void {
    this.imports.addImport(
      name,
      this.filePath
        ? getModulePathRelativeToFile(this.filePath, filePath, this.options.importModuleTransformer)
        : filePath
    );
  }

  public addExport(name: string, filePath: string): void {
    this.imports.addExport(
      name,
      this.filePath
        ? getModulePathRelativeToFile(this.filePath, filePath, this.options.importModuleTransformer)
        : filePath
    );
  }

  public override clear(): void {
    super.clear();
    this.imports.clear();
  }

  public override toString(addPadding: boolean = true): string {
    return new SourceBuilder(this.options)
      .apply((builder) => this.imports.writeTo(builder))
      .applyIf(addPadding, (builder) => builder.ensurePreviousLineEmpty())
      .append(super.toString())
      .applyIf(addPadding, (builder) => builder.ensureCurrentLineEmpty())
      .toString();
  }
}
