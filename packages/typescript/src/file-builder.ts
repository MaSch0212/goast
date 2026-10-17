import {
  type AppendParam,
  type AppendValue,
  isAppendValue,
  type Nullable,
  SourceBuilder,
  writeGeneratedFile,
} from '@goast/core';

import { TsNode } from './ast/node.ts';
import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from './config.ts';
import type { TypeScriptModelGeneratorOutput } from './generators/index.ts';
import {
  ImportExportCollection,
  type TypeScriptExportOptions,
  type TypeScriptImportOptions,
} from './import-collection.ts';

/**
 * A value that can be appended to a `TypeScriptFileBuilder`: a TypeScript node, which is written together with its
 * imports, or one of the additional values.
 * @template TAdditionalAppends The additional value types that the builder accepts.
 */
export type TypeScriptAppends<TAdditionalAppends> = TsNode<TypeScriptFileBuilder> | TAdditionalAppends;
/**
 * The parameter type of the `append` methods of a `TypeScriptFileBuilder`: a single value, an array of values, or a
 * function that appends content to the builder.
 * @template TBuilder The type of the builder that the value is appended to.
 * @template TAdditionalAppends The additional value types that the builder accepts.
 */
export type TypeScriptAppendParam<TBuilder extends TypeScriptFileBuilder, TAdditionalAppends> = AppendParam<
  TBuilder,
  TypeScriptAppends<TAdditionalAppends>
>;

/**
 * Checks whether a value can be appended to a TypeScript file builder. This is the case for TypeScript nodes and for
 * the values that a `SourceBuilder` accepts.
 * @template TBuilder The type of the builder that the value is appended to.
 * @param value The value to check.
 * @returns `true` if the value can be appended, otherwise `false`.
 */
export function isTypeScriptAppendValue<TBuilder extends TypeScriptFileBuilder = TypeScriptFileBuilder>(
  value: unknown,
): value is AppendValue<TBuilder> {
  return isAppendValue(value) || value instanceof TsNode;
}

/**
 * Builds a TypeScript source file. Content is appended like with any `SourceBuilder`, and the imports and exports that
 * the content needs are collected next to it.
 *
 * Imports are rarely added by hand. A `TsReference` node that has a module name or a file path, such as
 * `tsReference('User', '/out/models/user.ts')`, adds its import to the builder when the node is written, because
 * `appendSingle` calls `write` on every TypeScript node. The collected imports are kept in `imports`, and `toString`
 * writes them as import statements above the content. The statements therefore always end up at the top of the file,
 * whatever the order of the appends was.
 *
 * File paths are turned into relative module paths based on the `filePath` of this builder, and the
 * `importModuleTransformer` option decides how their extensions are written. See `ImportExportCollection`.
 *
 * @template TAdditionalAppends The additional value types that the builder accepts besides TypeScript nodes.
 * @example
 * ```ts
 * const builder = new TypeScriptFileBuilder('/out/services/user.ts', defaultTypeScriptGeneratorConfig);
 * builder.append(tsReference('User', '/out/models/user.ts'));
 * builder.toString(); // => "import { User } from '../models/user';\n\nUser\n"
 * ```
 */
export class TypeScriptFileBuilder<TAdditionalAppends = never> extends SourceBuilder<
  TypeScriptAppends<TAdditionalAppends>
> {
  /**
   * The path of the file that this builder writes to, or `undefined` if the path is not known. Relative module paths of
   * the imports are calculated from it.
   */
  public readonly filePath: string | undefined;
  /**
   * The imports and re-exports that the content of this builder needs. `toString` writes them above the content.
   */
  public readonly imports: ImportExportCollection;

  /**
   * Gets the TypeScript generator options that this builder uses.
   */
  public override get options(): TypeScriptGeneratorConfig {
    return super.options as TypeScriptGeneratorConfig;
  }

  /**
   * Initializes a new instance of the TypeScriptFileBuilder class.
   * @param filePath The path of the file that the content is written to. Used by `writeToFile` and for relative
   * imports.
   * @param options The generator options. Defaults to `defaultTypeScriptGeneratorConfig`.
   */
  constructor(filePath?: string, options?: TypeScriptGeneratorConfig) {
    super(options ?? defaultTypeScriptGeneratorConfig);
    this.filePath = filePath;
    this.imports = new ImportExportCollection({
      filePath: filePath,
      importModuleTransformer: this.options.importModuleTransformer,
      useSingleQuotes: this.options.useSingleQuotes,
    });
  }

  /**
   * Adds a named import to the file. The import is written above the content by `toString`. Adding the same name from
   * the same module more than once writes it only once.
   * @param name The name to import.
   * @param moduleNameOrfilePath The module name, such as `rxjs`, or the path of the file that exports the name.
   * @param options The options of the import, such as the import type. Defaults to a value import.
   * @returns This builder, for chaining.
   */
  public addImport(name: string, moduleNameOrfilePath: string, options?: TypeScriptImportOptions): this {
    this.imports.addImport(name, moduleNameOrfilePath, options);
    return this;
  }

  /**
   * Adds a re-export of a named export from a file, such as `export { User } from '../models/user';`. The re-export is
   * written above the content by `toString`, after the imports.
   * @param name The name to re-export.
   * @param filePath The path of the file that exports the name.
   * @param options The options of the export, such as the export type. Defaults to a value export.
   * @returns This builder, for chaining.
   */
  public addExport(name: string, filePath: string, options?: TypeScriptExportOptions): this {
    this.imports.addExport(name, filePath, options);
    return this;
  }

  /**
   * Removes all appended content, imports and re-exports from the builder.
   */
  public override clear(): void {
    super.clear();
    this.imports.clear();
  }

  /**
   * Renders the complete file: the imports and re-exports first, then the appended content. A `// @ts-check` comment is
   * added at the top for files with a `.js`, `.cjs` or `.mjs` extension.
   * @param addPadding Whether to separate the imports from the content with a blank line, and to end the output with a
   * line break. Defaults to `true`.
   * @returns The source code of the file.
   */
  public override toString(addPadding: boolean = true): string {
    const builder = new SourceBuilder(this.options);
    if (this.filePath?.match(/\.[cm]?js$/)) {
      builder.appendLine('// @ts-check');
    }

    builder.ensurePreviousLineEmpty();
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

  /**
   * Appends the component of a model that another generator published, and adds the imports that the component needs.
   * Use it to reference a model from `typescript.models`. With the `js-doc` import type, the JSDoc comments are removed
   * from the component text and the imports are written as `@import` tags instead.
   * @param type The published output of the model.
   * @param options The import options, such as the import type, that apply to the imports of the model.
   * @returns This builder, for chaining.
   */
  public appendModelUsage(type: TypeScriptModelGeneratorOutput, options?: TypeScriptImportOptions): this {
    this.append(options?.type === 'js-doc' ? type.component.replace(/\/\*\*.*\*\/\s*/gs, '') : type.component);
    for (const i of type.imports) {
      this.addImport(i.name, i.modulePath, { ...i, ...options });
    }
    return this;
  }

  /**
   * Writes the rendered file to disk with the generator options. Throws if no path is given and this builder has none.
   * @param filePath The path of the file to write to. Defaults to the `filePath` of this builder.
   */
  public writeToFile(filePath?: string): void {
    if (!filePath) filePath = this.filePath;
    if (!filePath) throw new Error('File path is required');
    writeGeneratedFile(this.options, filePath, this.toString());
  }

  /**
   * Creates a file builder for the file path, lets the generator callback fill it, and writes the file. Nothing happens
   * if the path is empty. See `tryGenerate` for the details.
   * @param options The file path, the optional log name, the generator options, and the callback that appends content.
   */
  public static generate(options: {
    filePath: string;
    logName?: Nullable<string>;
    options?: TypeScriptGeneratorConfig;
    generator: (builder: TypeScriptFileBuilder) => void;
  }): void {
    TypeScriptFileBuilder.tryGenerate(options);
  }

  /**
   * Creates a file builder for the file path, lets the generator callback fill it, and writes the file. Unlike
   * `generate`, a nullish path is accepted. In that case nothing is generated and the callback is not called.
   * @param options The file path, the generator callback, the optional log name, and the generator options. The log
   * name is logged as `Generating <log name> to <file path>...` before the file is generated.
   */
  public static tryGenerate({
    filePath,
    generator,
    options,
    logName,
  }: {
    filePath: Nullable<string>;
    logName?: Nullable<string>;
    options?: TypeScriptGeneratorConfig;
    generator: (builder: TypeScriptFileBuilder) => void;
  }) {
    if (!filePath) return;
    if (logName) {
      console.log(`Generating ${logName} to ${filePath}...`);
    }
    const builder = new TypeScriptFileBuilder(filePath, options);
    generator(builder);
    builder.writeToFile();
  }
}
