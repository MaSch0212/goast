import {
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
  type TupleWithCount,
} from '@goast/core';

import { KotlinFileBuilder } from '../../file-builder.ts';
import { KtNode } from '../node.ts';
import { writeKtNode, writeKtNodes } from '../utils/write-kt-node.ts';
import { ktGenericParameter } from './generic-parameter.ts';
import type { KtType } from './types.ts';

import type { KtCall } from './call.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    packageName?: Nullable<string>;
    generics?: Nullable<Nullable<KtType<TBuilder>>[]>;
    nullable?: Nullable<boolean>;
    classReference?: Nullable<boolean>;
    subReference?: Nullable<KtReference<TBuilder> | KtCall<TBuilder>>;
  }
>;

type _AddImportHandler<T> = {
  builderClass: abstract new (...args: any) => T;
  handler: (builder: T, reference: KtReference<any>) => void;
};

/**
 * Represents a reference to a named Kotlin type or declaration, such as `List<String>?` or `Foo::class`.
 *
 * Written in this order: the name, the generic arguments in angle brackets, then one suffix. The suffix is `::class`
 * when `classReference` is set, `::` followed by `subReference` when that is set, or `?` when `nullable` is set. The
 * suffixes exclude each other, so `nullable` has no effect when `classReference` or `subReference` is set.
 *
 * Writing a reference also imports it. When `packageName` is set and the builder is a `KotlinFileBuilder`, the file
 * gets an import for `<packageName>.<name>`, unless the package is the package of the file itself. Imports that match
 * the `globalImports` option of the generator configuration are left out when the import block is written. Builders
 * with no registered handler, such as a plain string builder, only receive the name. The import is added when the
 * reference is written, so use `addImport` or `ktReference.import` to add an import without writing the reference.
 *
 * @template TBuilder The type of the source builder the reference is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktReference
 * @see KtReference.registerAddImportHandler
 */
export class KtReference<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  private static readonly addImportHandlers: _AddImportHandler<any>[] = [
    {
      builderClass: KotlinFileBuilder,
      handler: (builder, reference) => builder.addImport(reference.name, reference.packageName),
    },
  ];

  /**
   * The name written verbatim, such as `List`. When `packageName` is set, the same name is imported.
   */
  public name: string;
  /**
   * The package the name is imported from, such as `com.example.models`. `null` writes the name without an import.
   */
  public packageName: string | null;
  /**
   * The generic arguments written in angle brackets after the name, such as `<String>` in `List<String>`. An empty list
   * writes nothing.
   */
  public generics: KtType<TBuilder>[];
  /**
   * Whether a `?` is written after the name, which makes the type nullable. Ignored when `classReference` or
   * `subReference` is set.
   * @default false
   */
  public nullable: boolean;
  /**
   * Whether the reference is written as a class literal, such as `Foo::class`. Takes precedence over `subReference` and
   * `nullable`.
   * @default false
   */
  public classReference: boolean;
  /**
   * A reference or call written after `::`, such as `Bar` in `Foo::Bar`, or `null` for none. Takes precedence over
   * `nullable`, and `classReference` takes precedence over it.
   */
  public subReference: KtReference<TBuilder> | KtCall<TBuilder> | null;

  /**
   * Initializes a new instance of the KtReference class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.packageName = options.packageName ?? null;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.nullable = options.nullable ?? false;
    this.classReference = options.classReference ?? false;
    this.subReference = options.subReference ?? null;
  }

  /**
   * Adds the import for this reference to the builder without writing the reference. Nothing is added when
   * `packageName` is not set, or when no handler is registered for the class of the builder.
   * @param builder The builder to add the import to.
   */
  public addImport(builder: TBuilder): void {
    if (this.packageName) {
      const handler = KtReference.addImportHandlers.find((h) => builder instanceof h.builderClass);
      if (handler) {
        handler.handler(builder, this);
      }
    }
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.name);
    ktGenericParameter.write(builder, this.generics);
    if (this.classReference) {
      builder.append('::class');
    } else if (this.subReference) {
      builder.append('::');
      writeKtNode(builder, this.subReference);
    } else if (this.nullable) {
      builder.append('?');
    }

    this.addImport(builder);
  }

  /**
   * Registers a handler that adds imports for references written to builders of the given class. The handlers are tried
   * in the order they were registered, and the first one whose class matches the builder is used. The handler for
   * `KotlinFileBuilder` is registered first, so it also matches subclasses of that class.
   * @template TBuilder The type of the builder that the handler supports.
   * @param builderClass The class of the builders that the handler applies to.
   * @param handler Adds the import for the reference to the builder.
   */
  public static registerAddImportHandler<TBuilder extends SourceBuilder>(
    builderClass: _AddImportHandler<TBuilder>['builderClass'],
    handler: _AddImportHandler<TBuilder>['handler'],
  ): void {
    KtReference.addImportHandlers.push({ builderClass, handler });
  }
}

const createReference = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  packageName?: Options<TBuilder>['packageName'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'packageName'>>,
): KtReference<TBuilder> => new KtReference<TBuilder>({ ...options, name, packageName });

/**
 * A function that creates references to one fixed name and package, as returned by `ktReference.factory`. Calling it
 * creates the same reference as `ktReference` with that name and package, and takes the same options.
 */
export type KtReferenceFactory = (<TBuilder extends SourceBuilder>(
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'packageName'>>,
) => KtReference<TBuilder>) & {
  /**
   * The name that every reference created by this factory is written with.
   */
  refName: string;
  /**
   * The package that every reference created by this factory is imported from, or `null` for none.
   */
  packageName: Nullable<string>;
  /**
   * Whether the value is a reference with the name and package of this factory. Use it to check the type of a node.
   */
  matches: (value: unknown) => value is KtReference<never>;
};

/**
 * A function that creates references to one fixed name and package with generic arguments, as returned by
 * `ktReference.genericFactory`. Its first argument is the tuple of generic arguments, which must match `TGenericCount`.
 *
 * @template TGenericCount The number of generic arguments, or a list of the allowed numbers.
 */
export type KtGenericReferenceFactory<TGenericCount extends number | number[]> = (<TBuilder extends SourceBuilder>(
  generics: TupleWithCount<KtType<TBuilder>, TGenericCount>,
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'packageName' | 'generics'>>,
) => KtReference<TBuilder>) & {
  /**
   * The name that every reference created by this factory is written with.
   */
  refName: string;
  /**
   * The package that every reference created by this factory is imported from, or `null` for none.
   */
  packageName: Nullable<string>;
  /**
   * Creates a reference with the name and package of this factory and without generic arguments, for when the arguments
   * are not known or not needed.
   */
  infer: <TBuilder extends SourceBuilder>(
    options?: Prettify<Omit<Options<TBuilder>, 'name' | 'packageName' | 'generics'>>,
  ) => KtReference<TBuilder>;
  /**
   * Whether the value is a reference with the name and package of this factory. Use it to check the type of a node.
   */
  matches: (value: unknown) => value is KtReference<never>;
};

const createFactory = (name: string, packageName?: Nullable<string>): KtReferenceFactory => {
  return Object.assign(
    <TBuilder extends SourceBuilder>(options?: Prettify<Omit<Options<TBuilder>, 'name' | 'packageName'>>) =>
      createReference<TBuilder>(name, packageName, options),
    {
      refName: name,
      packageName,
      matches: (value: unknown): value is KtReference<never> =>
        value instanceof KtReference && value.name === name && value.packageName === (packageName ?? null),
    },
  );
};

const createGenericFactory = <TGenericCount extends number | number[]>(
  name: string,
  packageName?: Nullable<string>,
): KtGenericReferenceFactory<TGenericCount> => {
  return Object.assign(
    <TBuilder extends SourceBuilder>(
      generics: TupleWithCount<KtType<TBuilder>, TGenericCount>,
      options?: Prettify<Omit<Options<TBuilder>, 'name' | 'packageName' | 'generics'>>,
    ) => createReference<TBuilder>(name, packageName, { ...options, generics }),
    {
      refName: name,
      packageName,
      infer: <TBuilder extends SourceBuilder>(
        options?: Prettify<Omit<Options<TBuilder>, 'name' | 'packageName' | 'generics'>>,
      ) => createReference<TBuilder>(name, packageName, options),
      matches: (value: unknown): value is KtReference<never> =>
        value instanceof KtReference && value.name === name && value.packageName === (packageName ?? null),
    },
  );
};

const importRefs = <TBuilder extends SourceBuilder>(builder: TBuilder, references: KtReference<TBuilder>[]): void => {
  references.forEach((ref) => ref.addImport(builder));
};

/**
 * Factory for creating reference nodes. The `factory` and `genericFactory` functions create factories for one fixed
 * name and package, `import` adds the imports of references without writing them, and `write` writes one or more
 * reference nodes to a builder.
 *
 * @param name The name of the referenced type, such as `List`.
 * @param packageName The package the name is imported from, or `null` to write the name without an import.
 * @param options The settings of the reference. See `KtReference` for the available properties.
 * @example
 * ```ts
 * ktReference('User', 'com.example.models', { generics: ['String'], nullable: true });
 * // Emits:
 * // User<String>?
 * // and adds the import `com.example.models.User` to the file.
 * ```
 */
export const ktReference: typeof createReference & {
  factory: typeof createFactory;
  genericFactory: typeof createGenericFactory;
  write: typeof writeKtNodes;
  import: typeof importRefs;
} = Object.assign(createReference, {
  factory: createFactory,
  genericFactory: createGenericFactory,
  write: writeKtNodes,
  import: importRefs,
});
