import { SourceBuilder, SourceBuilderOptions } from '@goast/core';

import { ImportCollection } from './import-collection';

type AnnotationArgumentValue<T extends SourceBuilder> = string | ((builder: T) => void);
type AnnotationArgument<T extends SourceBuilder> =
  | AnnotationArgumentValue<T>
  | [key: string, value: AnnotationArgumentValue<T>]
  | [value: AnnotationArgumentValue<T>, condition: boolean]
  | [key: string, value: AnnotationArgumentValue<T>, condition: boolean];

export class KotlinFileBuilder extends SourceBuilder {
  public readonly packageName: string | undefined;
  public readonly imports = new ImportCollection();

  constructor(packageName: string | undefined, options: SourceBuilderOptions) {
    super(options);
    this.packageName = packageName;
  }

  public addImport(name: string, packageName?: string): this {
    if (packageName !== undefined && packageName !== this.packageName) {
      this.imports.addImport(name, packageName);
    }
    return this;
  }

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
          .forEachSeparated(allArgs, multiline ? ',\n' : ', ', (builder, [name, value]) =>
            builder
              .append(name ? `${name} = ` : '')
              .apply((builder) => (typeof value === 'string' ? builder.append(value) : value(builder)))
          )
          .appendLineIf(multiline)
      );
    }

    this.appendLine();

    return this;
  }

  public override clear(): void {
    super.clear();
    this.imports.clear();
  }

  public override toString(addPadding: boolean = true): string {
    return new SourceBuilder(this.options)
      .applyIf(this.packageName !== undefined, (builder) =>
        builder.appendLine(`package ${this.packageName}`).appendLine()
      )
      .apply((builder) => this.imports.writeTo(builder))
      .applyIf(addPadding, (builder) => builder.ensurePreviousLineEmpty())
      .append(super.toString())
      .applyIf(addPadding, (builder) => builder.ensureCurrentLineEmpty())
      .toString();
  }
}
