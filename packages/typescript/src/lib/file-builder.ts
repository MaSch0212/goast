import { AppendParam, AppendValue, SourceBuilder, isAppendValue } from '@goast/core';

import { TsNode } from './ast/node';
import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from './config';
import { TypeScriptModelGeneratorOutput } from './generators';
import { ImportExportCollection } from './import-collection';

export type TypeScriptAppends<TAdditionalAppends> = TsNode<TypeScriptFileBuilder> | TAdditionalAppends;
export type TypeScriptAppendParam<TBuilder extends TypeScriptFileBuilder, TAdditionalAppends> = AppendParam<
  TBuilder,
  TypeScriptAppends<TAdditionalAppends>
>;

export function isTypeScriptAppendValue<TBuilder extends TypeScriptFileBuilder = TypeScriptFileBuilder>(
  value: unknown,
): value is AppendValue<TBuilder> {
  return isAppendValue(value) || value instanceof TsNode;
}

export class TypeScriptFileBuilder<TAdditionalAppends = never> extends SourceBuilder<
  TypeScriptAppends<TAdditionalAppends>
> {
  public readonly filePath: string | undefined;
  public readonly imports: ImportExportCollection;

  public override get options(): TypeScriptGeneratorConfig {
    return super.options as TypeScriptGeneratorConfig;
  }

  constructor(filePath?: string, options?: TypeScriptGeneratorConfig) {
    super(options ?? defaultTypeScriptGeneratorConfig);
    this.filePath = filePath;
    this.imports = new ImportExportCollection({
      filePath: filePath,
      importModuleTransformer: this.options.importModuleTransformer,
      useSingleQuotes: this.options.useSingleQuotes,
    });
  }

  public addImport(name: string, moduleNameOrfilePath: string): this {
    this.imports.addImport(name, moduleNameOrfilePath);
    return this;
  }

  public addExport(name: string, filePath: string): this {
    this.imports.addExport(name, filePath);
    return this;
  }

  public override clear(): void {
    super.clear();
    this.imports.clear();
  }

  public override toString(addPadding: boolean = true): string {
    const builder = new SourceBuilder(this.options);
    this.imports.writeTo(builder);

    const baseString = super.toString();
    if (baseString && addPadding) {
      builder.ensurePreviousLineEmpty();
    }

    builder.append(baseString);

    if (addPadding) {
      builder.ensureCurrentLineEmpty();
    }

    return builder.toString();
  }

  protected override appendSingle(value: TypeScriptAppendParam<this, TAdditionalAppends>) {
    super.appendSingle(value);
    if (value instanceof TsNode) {
      value.write(this);
    }
  }

  public appendModelUsage(type: TypeScriptModelGeneratorOutput): this {
    this.append(type.component);
    for (const i of type.imports) {
      this.addImport(i.name, i.modulePath);
    }
    return this;
  }
}
