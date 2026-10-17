import { type AppendParam, type AppendValue, isAppendValue, SourceBuilder, writeGeneratedFile } from '@goast/core';

import { KtNode } from './ast/node.ts';
import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from './config.ts';
import { ImportCollection } from './import-collection.ts';

type AnnotationArgumentValue<T extends SourceBuilder> = string | ((builder: T) => void);
type AnnotationArgument<T extends SourceBuilder> =
  | AnnotationArgumentValue<T>
  | [key: string, value: AnnotationArgumentValue<T>]
  | [value: AnnotationArgumentValue<T>, condition: boolean]
  | [key: string, value: AnnotationArgumentValue<T>, condition: boolean];

/**
 * The values that can be appended to a `KotlinFileBuilder`: Kotlin nodes, and the additional values of the builder.
 * @template TAdditionalAppends The additional values, besides Kotlin nodes, that the builder accepts.
 */
export type KotlinAppends<TAdditionalAppends> = KtNode<KotlinFileBuilder> | TAdditionalAppends;
/**
 * A parameter of an append method of a `KotlinFileBuilder`: a single value or builder function, or an array of them.
 * @template TBuilder The Kotlin file builder type that the value is appended to.
 * @template TAdditionalAppends The additional values, besides Kotlin nodes, that the builder accepts.
 * @see KotlinAppends
 */
export type KotlinAppendParam<TBuilder extends KotlinFileBuilder, TAdditionalAppends> = AppendParam<
  TBuilder,
  KotlinAppends<TAdditionalAppends>
>;

/**
 * Checks whether a value can be appended to a Kotlin file builder: an append value, or a Kotlin node.
 * @template TBuilder The Kotlin file builder type that the value is appended to.
 * @param value The value to check.
 * @returns `true` if the value can be appended, otherwise `false`.
 */
export function isKotlinAppendValue<TBuilder extends KotlinFileBuilder>(
  value: unknown,
): value is AppendValue<TBuilder> {
  return isAppendValue(value) || value instanceof KtNode;
}

/**
 * Builds the source of one Kotlin file. Besides the code, it collects the imports that the code needs and writes them
 * above the code, after the `package` line.
 *
 * Imports are collected while the code is written. A `KtReference` created by `ktReference` writes its name and then
 * calls `addImport` on the builder. The builder ignores references to its own package and passes the others to its
 * `ImportCollection`. `toString` then writes the `package` line, the import statements that the collection writes, and
 * finally the code. Annotations written with `appendAnnotation` register their imports the same way.
 *
 * @template TAdditionalAppends The additional values, besides Kotlin nodes, that can be appended to the builder.
 * @see ImportCollection
 * @see ktReference
 */
export class KotlinFileBuilder<TAdditionalAppends = never> extends SourceBuilder<KotlinAppends<TAdditionalAppends>> {
  /**
   * The package the file is declared in, or `undefined` for a file without a package. References to this package do not
   * produce imports.
   */
  public readonly packageName: string | undefined;
  /**
   * The imports of this file. The collection is created with its default options, so its `globalImports` is always the
   * default list, whatever the configuration of this builder says.
   */
  public readonly imports: ImportCollection = new ImportCollection();

  /**
   * Gets the options of this builder, which are the Kotlin generator configuration that it was created with, or the
   * defaults.
   * @returns The options of this builder.
   */
  public override get options(): KotlinGeneratorConfig {
    return super.options as KotlinGeneratorConfig;
  }

  /**
   * Initializes a new instance of the KotlinFileBuilder class.
   * @param packageName The package of the file, or `undefined` for a file without a package.
   * @param options The Kotlin generator configuration to use. Defaults to `defaultKotlinGeneratorConfig`.
   */
  constructor(packageName?: string, options?: KotlinGeneratorConfig) {
    super(options ?? defaultKotlinGeneratorConfig);
    this.packageName = packageName;
  }

  /**
   * Registers the import of a type that the file refers to. Nothing is registered when `packageName` is missing, or
   * when it is the package of this file, because no import is needed there.
   * @param name The name of the type, such as `List`.
   * @param packageName The package the type is declared in, such as `kotlin.collections`.
   * @returns A reference to this instance.
   */
  public addImport(name: string, packageName?: string): this {
    if (packageName !== undefined && packageName !== this.packageName) {
      this.imports.addImport(name, packageName);
    }
    return this;
  }

  /**
   * Appends an annotation, such as `@JsonProperty("id")`, on a line of its own, and registers its import.
   *
   * Each entry of `args` is either a value, which is written as a positional argument, or one of these tuples:
   * - `[value, condition]` writes the value as a positional argument when the condition is `true`.
   * - `[key, value]` writes the named argument `key = value`.
   * - `[key, value, condition]` writes the named argument unless the condition is `false`.
   *
   * The arguments are written on one line, or one per line when a value is a builder function or the arguments are
   * long.
   * @param name The simple name of the annotation, such as `JsonProperty`.
   * @param packageName The package of the annotation. It is imported unless it is the package of this file.
   * @param args The arguments of the annotation, in the forms described above.
   * @returns A reference to this instance.
   * @example
   * ```ts
   * builder.appendAnnotation('JsonProperty', 'com.fasterxml.jackson.annotation', [
   *   '"id"',
   *   ['required', 'true', isRequired],
   * ]);
   * // Emits: @JsonProperty("id", required = true)
   * ```
   */
  public appendAnnotation(name: string, packageName?: string, args?: AnnotationArgument<this>[]): this {
    const allArgs: [key: string | undefined, value: AnnotationArgumentValue<this>][] = [];
    if (args) {
      for (const a of args) {
        if (!Array.isArray(a)) {
          allArgs.push([undefined, a]);
        } else if (a.length === 2 && a[1] === true) {
          allArgs.push([undefined, a[0]]);
        }
      }
      for (const a of args) {
        if (Array.isArray(a) && typeof a[1] !== 'boolean' && a[2] !== false) {
          allArgs.push(a.length === 2 ? a : [a[0], a[1]]);
        }
      }
    }

    this.append(`@${name}`).addImport(name, packageName);

    if (allArgs.length > 0) {
      const multiline =
        allArgs.some((x) => typeof x[1] !== 'string') ||
        allArgs.reduce((c, [key, value]) => c + (key ? key.length + 3 : 0) + (value?.length ?? 0), 0) > 80;
      this.parenthesize('()', (builder) =>
        builder
          .appendLineIf(multiline)
          .forEach(
            allArgs,
            (builder, [name, value]) =>
              builder
                .append(name ? `${name} = ` : '')
                .append((builder) => (typeof value === 'string' ? builder.append(value) : value(builder))),
            { separator: multiline ? ',\n' : ', ' },
          )
          .appendLineIf(multiline),
      );
    }

    this.appendLine();

    return this;
  }

  /**
   * Removes the code and all collected imports. The package name is kept.
   */
  public override clear(): void {
    super.clear();
    this.imports.clear();
  }

  /**
   * Gets the source of the file: the `package` line, the import statements, and the code.
   * @param addPadding Whether to separate the imports from the code with an empty line, and to end the source with a
   * line break. Defaults to `true`.
   * @returns The source of the file.
   */
  public override toString(addPadding: boolean = true): string {
    return new SourceBuilder(this.options)
      .if(this.packageName !== undefined, (builder) => builder.appendLine(`package ${this.packageName}`).appendLine())
      .append((builder) => this.imports.writeTo(builder))
      .if(addPadding, (builder) => builder.ensurePreviousLineEmpty())
      .append(super.toString())
      .if(addPadding, (builder) => builder.ensureCurrentLineEmpty())
      .toString();
  }

  /**
   * Writes the source of the file to a path, creating missing parent directories. If the file already exists, the
   * `existingFileBehavior` of the configuration decides what happens.
   * @param filePath The path of the file to write.
   */
  public writeToFile(filePath: string) {
    writeGeneratedFile(this.options, filePath, this.toString());
  }

  protected override appendSingle(value: KotlinAppendParam<this, TAdditionalAppends>): void {
    super.appendSingle(value);
    if (value instanceof KtNode) {
      value.write(this);
    }
  }
}
