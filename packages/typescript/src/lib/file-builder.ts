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

  public addFileImport(name: string, filePath: string): this {
    this.imports.addImport(
      name,
      this.filePath
        ? getModulePathRelativeToFile(this.filePath, filePath, this.options.importModuleTransformer)
        : filePath
    );
    return this;
  }

  public addModuleImport(name: string, moduleName: string): this {
    this.imports.addImport(name, moduleName);
    return this;
  }

  public addFileExport(name: string, filePath: string): this {
    this.imports.addExport(
      name,
      this.filePath
        ? getModulePathRelativeToFile(this.filePath, filePath, this.options.importModuleTransformer)
        : filePath
    );
    return this;
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
    return this.parenthesize('<>', (builder) => builder.appendSeparated(genericTypeParameters, ', '));
  }

  public appendMethodParamneters(...parameters: Nullable<TextOrBuilderFn<this>>[]): this {
    return this.parenthesize('()', (builder) => builder.appendSeparated(parameters, ',\n'), { multiline: true });
  }

  public appendObjectLiteral(...properties: Nullable<TextOrBuilderFn<this>>[]): this {
    return this.parenthesize('{}', (builder) => builder.appendSeparated(properties, ', '), { multiline: true });
  }

  public appendArrayLiteral(...items: Nullable<TextOrBuilderFn<this>>[]): this {
    return this.parenthesize('[]', (builder) => builder.appendSeparated(items, ', '), { multiline: true });
  }

  public appendCodeBlock(...content: Nullable<TextOrBuilderFn<this>>[]): this {
    return this.parenthesize('{}', (builder) => builder.append(...content).ensureCurrentLineEmpty(), {
      multiline: true,
    });
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

  public appendAnnotation(options: TypeScriptAnnotation): this {
    if (options.filePath) this.addFileImport(options.name, options.filePath);
    else if (options.moduleName) this.addModuleImport(options.name, options.moduleName);
    return this.append(`@${options.name}`).appendMethodParamneters(...(options.args ?? []));
  }

  public appendAnnotations(annotations: TypeScriptAnnotation[], separator: string): this {
    if (annotations.length === 0) return this;
    return this.forEach(annotations, (builder, annotation) => builder.appendAnnotation(annotation).append(separator));
  }

  public appendClass(options: TypeScriptClassOptions, ...content: Nullable<TextOrBuilderFn<this>>[]) {
    return this.appendComment('/***/', options.documentation)
      .appendAnnotations(options.annotations ?? [], '\n')
      .appendIf(options.omitExport !== true, 'export ')
      .appendIf(options.isAbstract === true, 'abstract ')
      .append('class ')
      .append(options.name)
      .indent((builder) =>
        builder
          .appendGenericTypeParameters(...(options?.genericTypeParameters ?? []))
          .appendIf(options.extends !== undefined, '\nextends ', options.extends)
          .appendIf(options.implements !== undefined && options.implements.length > 0, ' implements ', (builder) =>
            builder.appendSeparated(options.implements ?? [], ', ')
          )
      )
      .append(options.extends || (options.implements !== undefined && options.implements.length > 0) ? '\n' : ' ')
      .appendCodeBlock(...content)
      .appendLine();
  }

  public appendConstructor(options: TypeScriptConstructorOptions, ...content: Nullable<TextOrBuilderFn<this>>[]) {
    return this.appendComment('/***/', options.documentation)
      .appendAnnotations(options.annotations ?? [], '\n')
      .append('constructor')
      .appendMethodParamneters(...(options?.parameters ?? []))
      .append(' ')
      .appendCodeBlock(...content)
      .appendLine();
  }

  public appendMethod(options: TypeScriptMethodOptions, ...content: Nullable<TextOrBuilderFn<this>>[]) {
    return this.appendComment('/***/', options.documentation)
      .appendAnnotations(options.annotations ?? [], '\n')
      .appendIf(options.accessibility !== undefined, options.accessibility, ' ')
      .appendIf(options.isAbstract === true, 'abstract ')
      .appendIf(options.isStatic === true, 'static ')
      .append(options.name)
      .appendGenericTypeParameters(...(options?.genericTypeParameters ?? []))
      .appendMethodParamneters(...(options?.parameters ?? []))
      .appendIf(options.returnType !== undefined, ': ', options.returnType)
      .append(' ')
      .appendCodeBlock(...content)
      .appendLine();
  }
}

export type TypeScriptAnnotation = {
  name: string;
  filePath?: string;
  moduleName?: string;
  args?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>[];
};

export type TypeScriptClassOptions = {
  documentation?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  annotations?: TypeScriptAnnotation[];
  omitExport?: boolean;
  isAbstract?: boolean;
  name: string;
  genericTypeParameters?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>[];
  extends?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  implements?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>[];
};

export type TypeScriptConstructorOptions = {
  documentation?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  annotations?: TypeScriptAnnotation[];
  parameters?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>[];
};

export type TypeScriptMethodOptions = {
  documentation?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  annotations?: TypeScriptAnnotation[];
  accessibility?: 'public' | 'protected' | 'private';
  isAbstract?: boolean;
  isStatic?: boolean;
  name: string;
  genericTypeParameters?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>[];
  parameters?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>[];
  returnType?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
};
