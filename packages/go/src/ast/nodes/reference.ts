import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { GoFileBuilder } from '../../file-builder.ts';
import { toGoPackageName } from '../../utils.ts';
import { GoNode } from '../node.ts';
import { writeGoNodes } from '../utils/write-go-node.ts';
import type { GoType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    /** The import path of the package declaring the identifier, `null` for builtins and the current package. */
    importPath?: Nullable<string>;
    /** The name the package declares, if it differs from the last segment of `importPath`. */
    packageName?: Nullable<string>;
    typeArguments?: Nullable<Nullable<GoType<TBuilder>>[]>;
  }
>;

/**
 * A reference to a type, function or value, qualified by its package and imported when needed.
 *
 * Written in this order: the qualifier, the name, then the type arguments in square brackets. The qualifier is the
 * package name followed by a dot, as the `models.` in `models.Pet`. Writing the reference adds its import to the file,
 * unless the package is the package of the file itself, which writes no qualifier. Without an `importPath`, only the
 * name is written. Type arguments are written as `[T1, T2]` and are left out when there are none.
 *
 * @template TBuilder The type of the source builder the reference is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goReference
 */
export class GoReference<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the referenced identifier, such as `Pet`.
   */
  public name: string;
  /**
   * The import path of the package that declares the identifier, such as `example.com/pets/models`. `null` for
   * predeclared identifiers and identifiers of the current package, which need no import.
   */
  public importPath: string | null;
  /**
   * The package name written as the qualifier, if it differs from the last segment of `importPath`. `null` derives the
   * qualifier from the last segment of `importPath`.
   */
  public packageName: string | null;
  /**
   * The type arguments written in square brackets after the name, such as `[string]` in `Set[string]`. An empty list
   * writes nothing.
   */
  public typeArguments: GoType<TBuilder>[];

  /**
   * Initializes a new instance of the GoReference class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.importPath = options.importPath ?? null;
    this.packageName = options.packageName ?? null;
    this.typeArguments = options.typeArguments?.filter(notNullish) ?? [];
  }

  /**
   * Returns the name that qualifies the identifier in the builder. A `GoFileBuilder` also gets the import of the
   * package.
   * @param builder The builder that the reference is written to.
   * @returns The qualifier, such as `models`, or `null` when the identifier needs none.
   */
  public getQualifier(builder: TBuilder): string | null {
    if (!this.importPath) return null;
    if (builder instanceof GoFileBuilder) {
      return builder.addImport(this.importPath, this.packageName ?? undefined);
    }
    return this.packageName ?? toGoPackageName(this.importPath);
  }

  protected override onWrite(builder: TBuilder): void {
    const qualifier = this.getQualifier(builder);
    if (qualifier) builder.append(qualifier, '.');
    builder.append(this.name);
    if (this.typeArguments.length > 0) {
      builder.parenthesize('[]', (b) => writeGoNodes(b, this.typeArguments, { separator: ', ' }));
    }
  }
}

const createReference = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  importPath?: Options<TBuilder>['importPath'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'importPath'>>,
): GoReference<TBuilder> => new GoReference<TBuilder>({ ...options, name, importPath });

/**
 * A function that creates references to one fixed name, import path and package name, as returned by
 * `goReference.factory`. Calling it creates the same reference as `goReference` with those values. Its only option is
 * `typeArguments`, since the other settings are fixed.
 */
export type GoReferenceFactory = (<TBuilder extends SourceBuilder>(
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'importPath' | 'packageName'>>,
) => GoReference<TBuilder>) & {
  /**
   * The name that every reference created by this factory is written with.
   */
  refName: string;
  /**
   * The import path that every reference created by this factory is imported from, or `null` for none.
   */
  importPath: Nullable<string>;
  /**
   * Whether the value is a reference with the name and import path of this factory. Use it to check the type of a node.
   */
  matches: (value: unknown) => value is GoReference<never>;
};

const createFactory = (name: string, importPath?: Nullable<string>, packageName?: string): GoReferenceFactory => {
  return Object.assign(
    <TBuilder extends SourceBuilder>(
      options?: Prettify<Omit<Options<TBuilder>, 'name' | 'importPath' | 'packageName'>>,
    ) => createReference<TBuilder>(name, importPath, { ...options, packageName }),
    {
      refName: name,
      importPath,
      matches: (value: unknown): value is GoReference<never> =>
        value instanceof GoReference && value.name === name && value.importPath === (importPath ?? null),
    },
  );
};

/**
 * Factory for creating reference nodes. The `factory` function creates a factory for one fixed name, import path and
 * package name, such as `goReference.factory('Request', 'net/http')`. The `write` function writes one or more reference
 * nodes to a builder.
 *
 * @param name The name of the referenced identifier, such as `Pet`.
 * @param importPath The import path of the package that declares the identifier, or `null` for predeclared identifiers
 * and the current package.
 * @param options The settings of the reference. See `GoReference` for the available properties.
 * @example
 * ```ts
 * goReference('Pet', 'example.com/pets/models');
 * // Emits:
 * // models.Pet
 * // and adds the import "example.com/pets/models" to the file.
 * ```
 */
export const goReference: typeof createReference & {
  factory: typeof createFactory;
  write: typeof writeGoNodes;
} = Object.assign(createReference, {
  factory: createFactory,
  write: writeGoNodes,
});
