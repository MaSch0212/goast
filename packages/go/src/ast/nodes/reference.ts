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

/** A reference to a type, function or value, qualified by its package and imported when needed. */
export class GoReference<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public importPath: string | null;
  public packageName: string | null;
  public typeArguments: GoType<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.importPath = options.importPath ?? null;
    this.packageName = options.packageName ?? null;
    this.typeArguments = options.typeArguments?.filter(notNullish) ?? [];
  }

  /** The name to qualify the identifier with in the builder, `null` if it needs none. */
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

export type GoReferenceFactory = (<TBuilder extends SourceBuilder>(
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'importPath' | 'packageName'>>,
) => GoReference<TBuilder>) & {
  refName: string;
  importPath: Nullable<string>;
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

export const goReference: typeof createReference & {
  factory: typeof createFactory;
  write: typeof writeGoNodes;
} = Object.assign(createReference, {
  factory: createFactory,
  write: writeGoNodes,
});
