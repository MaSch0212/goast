import { Nullable, SourceBuilder, TextOrBuilderFn } from '@goast/core';

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
      .append((builder) => this.imports.writeTo(builder))
      .appendIf(addPadding, (builder) => builder.ensurePreviousLineEmpty())
      .append(super.toString())
      .appendIf(addPadding, (builder) => builder.ensureCurrentLineEmpty())
      .toString();
  }

  public appendGenericTypeParameters(...genericTypeParameters: Nullable<TextOrBuilderFn<this>>[]): this {
    if (genericTypeParameters.length === 0) return this;
    return this.parenthesize('<>', (builder) =>
      builder.forEach(genericTypeParameters, (builder, parameter) => builder.append(parameter), { separator: ', ' })
    );
  }

  public appendComment(style: '/***/' | '/**/' | '//', comment: Nullable<TextOrBuilderFn<this>>): this {
    if (!comment) return this;
    if (typeof comment === 'string') {
      comment = comment.trim();
    }
    return style === '//'
      ? this.appendLineWithLinePrefix('// ', comment)
      : this.appendLine(style === '/**/' ? '/*' : '/**')
          .appendLineWithLinePrefix(' * ', comment)
          .appendLine(' */');
  }
}
