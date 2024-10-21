import { type AppendParam, type AppendValue, isAppendValue, SourceBuilder } from '@goast/core';

import { KtNode } from './ast/node.ts';
import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from './config.ts';
import { ImportCollection } from './import-collection.ts';

type AnnotationArgumentValue<T extends SourceBuilder> = string | ((builder: T) => void);
type AnnotationArgument<T extends SourceBuilder> =
  | AnnotationArgumentValue<T>
  | [key: string, value: AnnotationArgumentValue<T>]
  | [value: AnnotationArgumentValue<T>, condition: boolean]
  | [key: string, value: AnnotationArgumentValue<T>, condition: boolean];

export type KotlinAppends<TAdditionalAppends> = KtNode<KotlinFileBuilder> | TAdditionalAppends;
export type KotlinAppendParam<TBuilder extends KotlinFileBuilder, TAdditionalAppends> = AppendParam<
  TBuilder,
  KotlinAppends<TAdditionalAppends>
>;

export function isKotlinAppendValue<TBuilder extends KotlinFileBuilder>(
  value: unknown,
): value is AppendValue<TBuilder> {
  return isAppendValue(value) || value instanceof KtNode;
}

export class KotlinFileBuilder<TAdditionalAppends = never> extends SourceBuilder<KotlinAppends<TAdditionalAppends>> {
  public readonly packageName: string | undefined;
  public readonly imports = new ImportCollection();

  public override get options(): KotlinGeneratorConfig {
    return super.options as KotlinGeneratorConfig;
  }

  constructor(packageName?: string, options?: KotlinGeneratorConfig) {
    super(options ?? defaultKotlinGeneratorConfig);
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
      const multiline = allArgs.some((x) => typeof x[1] !== 'string') ||
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
          .appendLineIf(multiline));
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
      .if(this.packageName !== undefined, (builder) => builder.appendLine(`package ${this.packageName}`).appendLine())
      .append((builder) => this.imports.writeTo(builder))
      .if(addPadding, (builder) => builder.ensurePreviousLineEmpty())
      .append(super.toString())
      .if(addPadding, (builder) => builder.ensureCurrentLineEmpty())
      .toString();
  }

  protected override appendSingle(value: KotlinAppendParam<this, TAdditionalAppends>): void {
    super.appendSingle(value);
    if (value instanceof KtNode) {
      value.write(this);
    }
  }
}
