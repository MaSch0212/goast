import { Nullable, SourceBuilder, TextOrBuilderFn, notNullish } from '@goast/core';

import { TypeScriptGeneratorConfig } from './config';
import { TypeScriptModelGeneratorOutput } from './generators';
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

  public addImport(type: TypeScriptExternalTypeOptions): this {
    if ('filePath' in type) {
      this.addFileImport(type.name, type.filePath);
    } else {
      this.addModuleImport(type.name, type.moduleName);
    }
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

  public appendGenericArguments(...genericArguments: Nullable<TextOrBuilderFn<this>>[]): this {
    genericArguments = genericArguments.filter(notNullish);
    if (genericArguments.length === 0) return this;
    const multiline = genericArguments.length > 1;
    return this.parenthesize('<>', (builder) => builder.appendSeparated(genericArguments, multiline ? ',\n' : ', '), {
      multiline,
      indent: multiline,
    });
  }

  public appendParameter(parameter: Nullable<TextOrBuilderFn<this>> | TypeScriptParameterOptions) {
    if (!parameter) return;
    if (typeof parameter === 'object') {
      return this.append(parameter.name)
        .appendIf(parameter.isOptional === true, '?')
        .appendIf(parameter.type !== undefined, ': ', (builder) => {
          if (!parameter.type) throw new Error('Unreachable error');
          return typeof parameter.type === 'object'
            ? builder.appendExternalTypeUsage(parameter.type)
            : builder.append(parameter.type);
        })
        .appendGenericArguments(...(parameter.genericArguments ?? []))
        .appendIf(parameter.defaultValue !== undefined, ' = ', parameter.defaultValue);
    } else {
      return this.append(parameter);
    }
  }

  public appendParameters(...parameters: (Nullable<TextOrBuilderFn<this>> | TypeScriptParameterOptions)[]): this {
    parameters = parameters.filter(notNullish);
    if (parameters.length === 0) return this.append('()');
    const multiline = parameters.length > 1;
    return this.parenthesize(
      '()',
      (builder) =>
        builder.forEach(parameters, (builder, param) => builder.appendParameter(param), {
          separator: multiline ? ',\n' : ', ',
        }),
      { multiline, indent: multiline }
    );
  }

  public appendObjectLiteral(...properties: Nullable<TextOrBuilderFn<this>>[]): this {
    properties = properties.filter(notNullish);
    if (properties.length === 0) return this.append('{}');
    const multiline = properties.length > 1;
    return this.parenthesize(
      '{}',
      (builder) =>
        builder
          .appendIf(!multiline, ' ')
          .appendSeparated(properties, multiline ? ',\n' : ', ')
          .appendIf(!multiline, ' '),
      { multiline, indent: multiline }
    );
  }

  public appendArrayLiteral(...items: Nullable<TextOrBuilderFn<this>>[]): this {
    items = items.filter(notNullish);
    if (items.length === 0) return this.append('[]');
    const multiline = items.length > 1;
    return this.parenthesize('[]', (builder) => builder.appendSeparated(items, multiline ? ',\n' : ', '), {
      multiline,
      indent: multiline,
    });
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
          .appendWithLinePrefix(' * ', comment)
          .ensureCurrentLineEmpty()
          .appendLine(' */');
  }

  public appendDocumentation(documentation: Nullable<TextOrBuilderFn<this>>): this {
    return this.appendComment('/***/', documentation);
  }

  public appendModelUsage(type: TypeScriptModelGeneratorOutput): this {
    this.append(type.name);
    if (type.filePath) this.addFileImport(type.name, type.filePath);
    for (const additionalImport of type.additionalImports) {
      this.addFileImport(additionalImport.typeName, additionalImport.modulePath);
    }
    return this;
  }

  public appendExternalTypeUsage(type: TypeScriptExternalTypeOptions): this {
    this.append(type.name);
    if ('filePath' in type) this.addFileImport(type.name, type.filePath);
    else this.addModuleImport(type.name, type.moduleName);
    return this;
  }

  public appendTypeDeclaration(options: TypeScriptTypeDeclarationOptions): this {
    return this.appendDocumentation(options.documentation)
      .appendIf(options.omitExport !== true, 'export ')
      .append('type ')
      .append(options.name)
      .append(' = ')
      .append(options.type)
      .appendLine(';');
  }

  public appendAnnotation(options: TypeScriptAnnotationOptions): this {
    if (options.filePath) this.addFileImport(options.name, options.filePath);
    else if (options.moduleName) this.addModuleImport(options.name, options.moduleName);
    return this.append(`@${options.name}`).appendParameters(...(options.args ?? []));
  }

  public appendAnnotations(annotations: TypeScriptAnnotationOptions[], separator: string): this {
    if (annotations.length === 0) return this;
    return this.forEach(annotations, (builder, annotation) => builder.appendAnnotation(annotation).append(separator));
  }

  public appendClass(options: TypeScriptClassOptions) {
    return this.appendComment('/***/', options.documentation)
      .appendAnnotations(options.annotations ?? [], '\n')
      .appendIf(options.omitExport !== true, 'export ')
      .appendIf(options.isAbstract === true, 'abstract ')
      .append('class ')
      .append(options.name)
      .indent((builder) =>
        builder
          .appendGenericArguments(...(options?.genericArguments ?? []))
          .appendIf(options.extends !== undefined, '\nextends ', options.extends)
          .appendIf(options.implements !== undefined && options.implements.length > 0, ' implements ', (builder) =>
            builder.appendSeparated(options.implements ?? [], ', ')
          )
      )
      .append(options.extends || (options.implements !== undefined && options.implements.length > 0) ? '\n' : ' ')
      .appendCodeBlock(options.body)
      .appendLine();
  }

  public appendConstructor(options: TypeScriptConstructorOptions) {
    return this.appendComment('/***/', options.documentation)
      .appendAnnotations(options.annotations ?? [], '\n')
      .append('constructor')
      .appendParameters(...(options?.parameters ?? []))
      .append(' ')
      .appendCodeBlock(options.body)
      .appendLine();
  }

  public appendMethod(options: TypeScriptMethodOptions) {
    return this.appendComment('/***/', options.documentation)
      .appendAnnotations(options.annotations ?? [], '\n')
      .appendIf(options.accessibility !== undefined, options.accessibility, ' ')
      .appendIf(options.isAbstract === true, 'abstract ')
      .appendIf(options.isStatic === true, 'static ')
      .appendIf(options.isAsync === true, 'async ')
      .append(options.name)
      .appendGenericArguments(...(options?.genericArguments ?? []))
      .appendParameters(...(options?.parameters ?? []))
      .appendIf(options.returnType !== undefined, ': ', options.returnType)
      .append(' ')
      .appendCodeBlock(options.body)
      .appendLine();
  }

  public appendProperty(options: TypeScriptPropertyOptions) {
    if (options.kind === 'getter' || options.kind === 'setter' || options.kind === 'getter-setter') {
      if (options.kind === 'getter-setter' || options.kind === 'getter') {
        this.appendComment('/***/', options.documentation)
          .appendAnnotations([...(options.annotations ?? []), ...(options.getterAnnotations ?? [])], '\n')
          .appendIf(options.accessibility !== undefined, options.accessibility, ' ')
          .appendIf(options.isAbstract === true, 'abstract ')
          .appendIf(options.isStatic === true, 'static ')
          .append('get ', options.name, '()')
          .appendIf(options.type !== undefined, ': ', options.type)
          .if(
            options.isAbstract === true,
            (builder) => builder.append(';'),
            (builder) => builder.append(' ').appendCodeBlock(options.getter)
          )
          .ensureCurrentLineEmpty();
      }
      if (options.kind === 'getter-setter' || options.kind === 'setter') {
        this.appendComment('/***/', options.documentation)
          .appendAnnotations([...(options.annotations ?? []), ...(options.setterAnnotations ?? [])], '\n')
          .appendIf(options.accessibility !== undefined, options.accessibility, ' ')
          .appendIf(options.isAbstract === true, 'abstract ')
          .appendIf(options.isStatic === true, 'static ')
          .append('set ', options.name)
          .parenthesize('()', (builder) => builder.append('value: ', options.type))
          .if(
            options.isAbstract === true,
            (builder) => builder.append(';'),
            (builder) => builder.append(' ').appendCodeBlock(options.setter)
          )
          .ensureCurrentLineEmpty();
      }
      return this;
    }

    return this.appendComment('/***/', options.documentation)
      .appendAnnotations(options.annotations ?? [], '\n')
      .appendIf(options.accessibility !== undefined, options.accessibility, ' ')
      .appendIf(options.isAbstract === true, 'abstract ')
      .appendIf(options.isStatic === true, 'static ')
      .appendIf(options.isReadonly === true, 'readonly ')
      .append(options.name)
      .appendIf(options.isOptional === true, '?')
      .appendIf(options.type !== undefined, ': ', options.type)
      .appendIf(options.initializer !== undefined, ' = ', options.initializer)
      .appendLine(';');
  }

  public appendFunction(options: TypeScriptFunctionOptions) {
    const kind = options.kind ?? 'arrow-function';
    return this.appendIf(kind === 'arrow-function' && !!options.name, 'const ', options.name, ' = ')
      .appendIf(options.isAsync === true, 'async ')
      .appendIf(kind === 'function', 'function')
      .appendIf(kind === 'function' && !!options.name, ' ', options.name)
      .appendParameters(...(options?.parameters ?? []))
      .appendIf(options.returnType !== undefined, ': ', options.returnType)
      .append(' ')
      .appendIf(kind === 'arrow-function', '=> ')
      .parenthesizeIf(
        kind === 'function' || options.singleLine !== true,
        '{}',
        (builder) => builder.append(options.body),
        { multiline: true }
      );
  }
}

export type TypeScriptTypeDeclarationOptions = {
  documentation?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  omitExport?: boolean;
  name: string;
  type: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
};

export type TypeScriptExternalTypeOptions = {
  name: string;
} & ({ filePath: string } | { moduleName: string });

export type TypeScriptAnnotationOptions = {
  name: string;
  filePath?: string;
  moduleName?: string;
  args?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>[];
};

export type TypeScriptClassOptions = {
  documentation?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  annotations?: TypeScriptAnnotationOptions[];
  omitExport?: boolean;
  isAbstract?: boolean;
  name: string;
  genericArguments?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>[];
  extends?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  implements?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>[];
  body?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
};

export type TypeScriptConstructorOptions = {
  documentation?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  annotations?: TypeScriptAnnotationOptions[];
  parameters?: (Nullable<TextOrBuilderFn<TypeScriptFileBuilder>> | TypeScriptParameterOptions)[];
  body?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
};

export type TypeScriptParameterOptions = {
  name: string;
  isOptional?: boolean;
  type?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>> | TypeScriptExternalTypeOptions;
  genericArguments?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>[];
  defaultValue?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
};

export type TypeScriptMethodOptions = {
  documentation?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  annotations?: TypeScriptAnnotationOptions[];
  accessibility?: 'public' | 'protected' | 'private';
  isAbstract?: boolean;
  isStatic?: boolean;
  isAsync?: boolean;
  name: string;
  genericArguments?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>[];
  parameters?: (Nullable<TextOrBuilderFn<TypeScriptFileBuilder>> | TypeScriptParameterOptions)[];
  returnType?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  body?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
};

export type TypeScriptPropertyOptions = {
  documentation?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  annotations?: TypeScriptAnnotationOptions[];
  accessibility?: 'public' | 'protected' | 'private';
  isAbstract?: boolean;
  isStatic?: boolean;
  isReadonly?: boolean;
  isOptional?: boolean;
  kind?: 'property' | 'getter' | 'setter' | 'getter-setter';
  name: string;
  type?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  initializer?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  getter?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  getterAnnotations?: TypeScriptAnnotationOptions[];
  setter?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  setterAnnotations?: TypeScriptAnnotationOptions[];
};

export type TypeScriptFunctionOptions = {
  kind?: 'function' | 'arrow-function';
  isAsync?: boolean;
  name?: string;
  parameters: (Nullable<TextOrBuilderFn<TypeScriptFileBuilder>> | TypeScriptParameterOptions)[];
  returnType?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  body?: Nullable<TextOrBuilderFn<TypeScriptFileBuilder>>;
  singleLine?: boolean;
};
