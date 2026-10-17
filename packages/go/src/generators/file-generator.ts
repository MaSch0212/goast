import type { MaybePromise, Nullable, OpenApiGenerationProviderContext, OpenApiGeneratorInput } from '@goast/core';

import type { GoGeneratorConfig } from '../config.ts';
import { getGoIdentifierRegistry, type GoIdentifierRegistry } from '../identifier-registry.ts';
import { makeUniqueNames, toGoIdentifier, toGoPackageName } from '../utils.ts';

/** Where generated code goes: a directory below the output directory, which is one Go package. */
export type GoPackageInfo = {
  /** The path relative to the output directory, with forward slashes (e.g. `api`). */
  path: string;
  /** The name in the `package` clause. */
  name: string;
  /** The import path: the module path joined with `path`. */
  importPath: string;
  /** The directory on disk. */
  dir: string;
};

/**
 * Base class for the generators that produce Go output. It provides the helpers that the generators share, such as the
 * package of a path and the naming of identifiers with the `initialisms` option. Subclasses implement `generate` to
 * produce the output for a context.
 * @template TContext The type of the context the generator receives.
 * @template TOutput The type of the output the generator produces.
 */
export abstract class GoFileGenerator<
  TContext extends OpenApiGenerationProviderContext<OpenApiGeneratorInput, GoGeneratorConfig>,
  TOutput,
> {
  /**
   * Generates the Go output for the given context.
   * @param context The context to generate the output from.
   * @returns The generated output, or a promise of it.
   */
  public abstract generate(context: TContext): MaybePromise<TOutput>;

  /**
   * Gets the package that generated code for a path goes into. Backslashes are turned into forward slashes, and leading
   * and trailing slashes are removed from the path.
   * @param ctx The context of the generator run.
   * @param packagePath The path of the package, relative to the output directory. An empty path is the output directory
   * itself.
   * @param packageName The name in the `package` clause. Defaults to the last segment of the path, or of the module
   * path for the output directory itself.
   * @returns The package info, including its import path and the directory on disk.
   */
  protected getPackageInfo(ctx: TContext, packagePath: string, packageName?: Nullable<string>): GoPackageInfo {
    const path = packagePath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    const modulePath = ctx.config.modulePath.replace(/\/+$/, '');
    return {
      path,
      name: packageName ?? toGoPackageName(path || modulePath),
      importPath: path ? `${modulePath}/${path}` : modulePath,
      dir: path ? `${ctx.config.outputDir}/${path}` : ctx.config.outputDir,
    };
  }

  /**
   * Gets the identifier registry of a package. It holds the identifiers declared in the package by any generator of the
   * run, so that generators do not declare the same name twice.
   * @param ctx The context of the generator run.
   * @param pkg The package, see `getPackageInfo`.
   * @returns The registry shared by all generators of the run that write into the package.
   * @see getGoIdentifierRegistry
   */
  protected getIdentifierRegistry(ctx: TContext, pkg: GoPackageInfo): GoIdentifierRegistry {
    return getGoIdentifierRegistry(ctx.data, pkg.importPath);
  }

  /**
   * Converts a name to an exported identifier, e.g. for a type, field or method. Initialisms from the `initialisms`
   * option are written in all caps.
   * @param ctx The context of the generator run, which provides the `initialisms` option.
   * @param name The name to convert.
   * @param fallback The identifier to use when the name has no usable characters. Defaults to `Value`.
   * @returns The exported identifier, e.g. `PetID` for `pet_id`.
   */
  protected toExportedName(ctx: TContext, name: Nullable<string>, fallback?: string): string {
    return toGoIdentifier(name, { exported: true, initialisms: ctx.config.initialisms, fallback });
  }

  /**
   * Converts a name to an unexported identifier, e.g. for a parameter or local variable. Initialisms from the
   * `initialisms` option are written in all caps, except for the first word.
   * @param ctx The context of the generator run, which provides the `initialisms` option.
   * @param name The name to convert.
   * @param fallback The identifier to use when the name has no usable characters. Defaults to `value`.
   * @returns The unexported identifier, e.g. `petID` for `pet_id`.
   */
  protected toUnexportedName(ctx: TContext, name: Nullable<string>, fallback?: string): string {
    return toGoIdentifier(name, { exported: false, initialisms: ctx.config.initialisms, fallback });
  }

  /**
   * Makes the names unique in declaration order, see {@link makeUniqueNames}.
   * @param _ctx The context of the generator run. It is not used.
   * @param names The names to make unique.
   * @param reserved Names that are already taken, which the result must not use.
   * @returns The unique names, in the same order as `names`.
   */
  protected toUniqueNames(_ctx: TContext, names: readonly string[], reserved?: Iterable<string>): string[] {
    return makeUniqueNames(names, reserved);
  }
}
