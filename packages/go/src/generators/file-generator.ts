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

export abstract class GoFileGenerator<
  TContext extends OpenApiGenerationProviderContext<OpenApiGeneratorInput, GoGeneratorConfig>,
  TOutput,
> {
  public abstract generate(context: TContext): MaybePromise<TOutput>;

  /** The package for a path relative to the output directory. */
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

  /** The identifiers declared in a package by any generator of this run. */
  protected getIdentifierRegistry(ctx: TContext, pkg: GoPackageInfo): GoIdentifierRegistry {
    return getGoIdentifierRegistry(ctx.data, pkg.importPath);
  }

  /** An exported identifier, e.g. for a type, field or method. */
  protected toExportedName(ctx: TContext, name: Nullable<string>, fallback?: string): string {
    return toGoIdentifier(name, { exported: true, initialisms: ctx.config.initialisms, fallback });
  }

  /** An unexported identifier, e.g. for a parameter or local variable. */
  protected toUnexportedName(ctx: TContext, name: Nullable<string>, fallback?: string): string {
    return toGoIdentifier(name, { exported: false, initialisms: ctx.config.initialisms, fallback });
  }

  /** The names made unique in declaration order, see {@link makeUniqueNames}. */
  protected toUniqueNames(_ctx: TContext, names: readonly string[], reserved?: Iterable<string>): string[] {
    return makeUniqueNames(names, reserved);
  }
}
