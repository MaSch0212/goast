import {
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
  type TupleWithCount,
} from '@goast/core';

import type { TypeScriptImportType } from '../../common-results.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { TsNode } from '../node.ts';
import { writeTsGenericParameters } from '../utils/write-ts-generic-parameters.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    moduleNameOrfilePath?: Nullable<string>;
    generics?: Nullable<Nullable<TsType<TBuilder>>[]>;
    importType?: Nullable<TypeScriptImportType>;
  }
>;
// oxlint-disable-next-line no-unused-vars -- keeps call sites generic over TBuilder
type FactoryOptions<TBuilder extends SourceBuilder> = {
  importType?: Nullable<TypeScriptImportType>;
};

type _AddImportHandler<T> = {
  builderClass: abstract new (...args: any[]) => T;
  handler: (builder: T, reference: TsReference<any>) => void;
};

/**
 * Represents a reference to a named type or value, such as `Foo` or `Foo<T, U>`. A reference can also name the module
 * that exports it. Writing such a reference adds an import for it to the file that is being written.
 *
 * The reference is written as its name, followed by the generic arguments in angle brackets when there are any. When a
 * module is set and the reference is written to a `TypeScriptFileBuilder`, the name is also registered as an import of
 * that file. The import is registered when the reference is written, so a reference that is never written adds no
 * import. Imports from the same module are combined into one statement.
 *
 * How the import is written depends on `importType`. A value import is written as `import { X } from 'module';`, a type
 * import as `import type { X } from 'module';`, and a `js-doc` import as an `@import` tag in a JSDoc comment, which is
 * used for JavaScript output. Other builders can handle imports as well, see `registerAddImportHandler`.
 *
 * @template TBuilder The type of the source builder the reference is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsReference
 * @see TypeScriptFileBuilder
 */
export class TsReference<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  private static readonly addImportHandlers: _AddImportHandler<any>[] = [
    {
      builderClass: TypeScriptFileBuilder,
      handler: (builder: TypeScriptFileBuilder, reference) => {
        if (reference.moduleNameOrfilePath) {
          builder.addImport(reference.name, reference.moduleNameOrfilePath, { type: reference.importType });
        }
      },
    },
  ];

  /**
   * The name of the referenced type or value, written verbatim. When a module is set, the same name is imported
   * from it, so it has to be the name that the module exports.
   */
  public name: string;
  /**
   * The module name, such as `'@angular/core'`, or the path of a file that exports the name, such as
   * `'./models/foo.ts'`. `null` makes the reference local, so no import is added. A path that ends in `.ts`, `.js`
   * or `.json` is a file path, which is written relative to the generated file when that file's path is known.
   */
  public moduleNameOrfilePath: string | null;
  /**
   * The generic arguments written in angle brackets after the name, such as `<T, U>`. Null entries are skipped, and an
   * empty list writes the bare name. With more than two arguments, each one is written on its own line.
   */
  public generics: TsType<TBuilder>[];
  /**
   * The kind of import that is added for `moduleNameOrfilePath`: `'import'` for a value import, `'type-import'` for a
   * type-only import, or `'js-doc'` for an `@import` tag in a JSDoc comment. It has no effect without a module.
   * @default 'import'
   */
  public importType: TypeScriptImportType;

  /**
   * Initializes a new instance of the TsReference class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.moduleNameOrfilePath = options.moduleNameOrfilePath ?? null;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.importType = options.importType ?? 'import';
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.name);
    writeTsGenericParameters(builder, this.generics);
    if (this.moduleNameOrfilePath) {
      const handler = TsReference.addImportHandlers.find((h) => builder instanceof h.builderClass);
      if (handler) {
        handler.handler(builder, this);
      }
    }
  }

  /**
   * Registers a handler that adds the import of a reference to builders of the given class. The handler is called
   * when a reference with a module is written to a builder that is an instance of `builderClass`. Handlers are tried
   * in the order they were registered, and the first one that matches is used. The default handler for
   * `TypeScriptFileBuilder` is registered first, so a handler for that class, or a subclass of it, is never reached.
   * @param builderClass The class of the builders that the handler applies to. Matched with `instanceof`.
   * @param handler Adds the import of the reference to the builder. It receives the builder and the reference.
   */
  public static registerAddImportHandler<TBuilder extends SourceBuilder>(
    builderClass: _AddImportHandler<TBuilder>['builderClass'],
    handler: _AddImportHandler<TBuilder>['handler'],
  ): void {
    TsReference.addImportHandlers.push({ builderClass, handler });
  }
}

const createReference = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  moduleNameOrfilePath?: Options<TBuilder>['moduleNameOrfilePath'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'moduleNameOrfilePath'>>,
): TsReference<TBuilder> => new TsReference<TBuilder>({ ...options, name, moduleNameOrfilePath });

/**
 * A function that creates references with a fixed name and module, as returned by `tsReference.factory`. Calling it
 * creates a reference with the given options. The properties `refName` and `moduleNameOrfilePath` expose the name and
 * the module that the factory was created with.
 * @see tsReference.factory
 */
export type TsReferenceFactory = (<TBuilder extends SourceBuilder>(
  options?: FactoryOptions<TBuilder>,
) => TsReference<TBuilder>) & {
  refName: string;
  moduleNameOrfilePath: Nullable<string>;
};
/**
 * A reference factory that was created with a module, so its `moduleNameOrfilePath` is always a string.
 * @see TsReferenceFactory
 */
export type TsModuleReferenceFactory = TsReferenceFactory & {
  moduleNameOrfilePath: string;
};

/**
 * A function that creates references to a generic type, as returned by `tsReference.genericFactory`. It takes the
 * generic arguments as a tuple, whose length is given by `TGenericCount`. The `infer` function creates a reference to
 * the same name without generic arguments.
 *
 * @template TGenericCount The number of generic arguments that are required, or an array of the accepted counts.
 * @see tsReference.genericFactory
 */
export type TsGenericReferenceFactory<TGenericCount extends number | number[]> = (<TBuilder extends SourceBuilder>(
  generics: TupleWithCount<TsType<TBuilder>, TGenericCount>,
  options?: FactoryOptions<TBuilder>,
) => TsReference<TBuilder>) & {
  refName: string;
  moduleNameOrfilePath: Nullable<string>;
  infer: <TBuilder extends SourceBuilder>() => TsReference<TBuilder>;
};
/**
 * A generic reference factory that was created with a module, so its `moduleNameOrfilePath` is always a string.
 *
 * @template TGenericCount The number of generic arguments that are required, or an array of the accepted counts.
 * @see TsGenericReferenceFactory
 */
export type TsGenericModuleReferenceFactory<TGenericCount extends number | number[]> =
  TsGenericReferenceFactory<TGenericCount> & {
    moduleNameOrfilePath: string;
  };

function _createFactory(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsReferenceFactory {
  return Object.assign(
    <TBuilder extends SourceBuilder>(options?: FactoryOptions<TBuilder>) =>
      createReference<TBuilder>(name, moduleNameOrfilePath, { ...defaultOptions, ...options }),
    {
      refName: name,
      moduleNameOrfilePath,
    },
  );
}
function createFactory(
  name: string,
  moduleNameOrfilePath: string,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsModuleReferenceFactory;
function createFactory(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsReferenceFactory;
function createFactory(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsReferenceFactory {
  return _createFactory(name, moduleNameOrfilePath, defaultOptions);
}

function _createGenericFactory<TGenericCount extends number | number[]>(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsGenericReferenceFactory<TGenericCount> {
  return Object.assign(
    <TBuilder extends SourceBuilder>(
      generics: TupleWithCount<TsType<TBuilder>, TGenericCount>,
      options?: FactoryOptions<TBuilder>,
    ) => createReference<TBuilder>(name, moduleNameOrfilePath, { ...defaultOptions, ...options, generics }),
    {
      refName: name,
      moduleNameOrfilePath,
      infer: <TBuilder extends SourceBuilder>() => createReference<TBuilder>(name, moduleNameOrfilePath),
    },
  );
}
function createGenericFactory<TGenericCount extends number | number[]>(
  name: string,
  moduleNameOrfilePath: string,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsGenericModuleReferenceFactory<TGenericCount>;
function createGenericFactory<TGenericCount extends number | number[]>(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsGenericReferenceFactory<TGenericCount>;
function createGenericFactory<TGenericCount extends number | number[]>(
  name: string,
  moduleNameOrfilePath?: Nullable<string>,
  defaultOptions?: { importType?: Nullable<TypeScriptImportType> },
): TsGenericReferenceFactory<TGenericCount> {
  return _createGenericFactory<TGenericCount>(name, moduleNameOrfilePath, defaultOptions);
}

/**
 * Factory for creating reference nodes. The `write` function writes one or more reference nodes to a builder.
 *
 * `factory` creates a reusable function for a name and module, with default options. `genericFactory` does the same
 * for a generic type, and takes the generic arguments as its first parameter.
 *
 * @param name The name of the referenced type or value. See `TsReference.name`.
 * @param moduleNameOrfilePath The module or file that exports the name, or `null` for a local name.
 * @param options The settings of the reference. See `TsReference` for the available properties.
 * @example
 * ```ts
 * tsReference('X', 'module', { generics: ['T', 'U'] });
 * // Output, with the import added to the file:
 * // import { X } from 'module';
 * // X<T, U>
 * ```
 * @see TsReference
 */
export const tsReference: typeof createReference & {
  factory: typeof createFactory;
  genericFactory: typeof createGenericFactory;
  write: typeof writeTsNodes;
} = Object.assign(createReference, {
  factory: createFactory,
  genericFactory: createGenericFactory,
  write: writeTsNodes,
});
