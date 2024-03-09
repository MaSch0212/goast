import { AppendParam, AppendValue, SourceBuilder, isAppendValue } from '@goast/core';

import { isTsNode } from './ast';
import { TsWritableNode, writeTs } from './ast/writable-nodes';
import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from './config';
import { TypeScriptModelGeneratorOutput } from './generators';
import { ImportExportCollection } from './import-collection';

export type TypeScriptAppends<TAdditionalAppends> = TsWritableNode<TypeScriptFileBuilder> | TAdditionalAppends;
export type TypeScriptAppendParam<TBuilder extends TypeScriptFileBuilder, TAdditionalAppends> = AppendParam<
  TBuilder,
  TypeScriptAppends<TAdditionalAppends>
>;

export function isTypeScriptAppendValue<TBuilder extends TypeScriptFileBuilder = TypeScriptFileBuilder>(
  value: unknown
): value is AppendValue<TBuilder> {
  return isAppendValue(value) || isTsNode(value);
}

export class TypeScriptFileBuilder<TAdditionalAppends = never> extends SourceBuilder<
  TypeScriptAppends<TAdditionalAppends>
> {
  public readonly filePath: string | undefined;
  public readonly imports = new ImportExportCollection();

  public override get options(): TypeScriptGeneratorConfig {
    return super.options as TypeScriptGeneratorConfig;
  }

  constructor(filePath?: string, options?: TypeScriptGeneratorConfig) {
    super(options ?? defaultTypeScriptGeneratorConfig);
    this.filePath = filePath;
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
    return new SourceBuilder(this.options)
      .append((builder) => this.imports.writeTo(builder, this.filePath, this.options.importModuleTransformer))
      .appendIf(addPadding, (builder) => builder.ensurePreviousLineEmpty())
      .append(super.toString())
      .appendIf(addPadding, (builder) => builder.ensureCurrentLineEmpty())
      .toString();
  }

  protected override appendSingle(value: TypeScriptAppendParam<this, TAdditionalAppends>) {
    super.appendSingle(value);
    if (isTsNode(value)) {
      writeTs(this, value);
    }
  }

  public appendModelUsage(type: TypeScriptModelGeneratorOutput): this {
    this.append(type.component);
    for (const i of type.imports) {
      this.addImport(i.name, i.modulePath);
    }
    return this;
  }

  public appendExternalTypeUsage(type: TypeScriptExternalTypeOptions): this {
    return this.append(type.name).addImport(type.name, type.module);
  }
}

export type TypeScriptExternalTypeOptions = {
  name: string;
  module: string;
};
