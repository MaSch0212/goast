import {
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { CsNode } from '../node.ts';
import { writeCsGenericConstraints, writeCsGenericParameters } from '../utils/write-cs-generic-parameters.ts';
import type { CsType } from './types.ts';

type Injects = 'name';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    description?: Nullable<BasicAppendValue<TBuilder>>;
    /**
     * The `where` constraints of the parameter: types (`IDisposable`) or constraint keywords
     * (`class`, `struct`, `notnull`, `new()`).
     */
    constraints?: Nullable<Nullable<CsType<TBuilder>>[]>;
    /** Declares a variant type parameter on interfaces and delegates (`out T`, `in T`). */
    variance?: Nullable<'in' | 'out'>;
  }
>;

export class CsGenericParameter<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public description: BasicAppendValue<TBuilder> | null;
  public constraints: CsType<TBuilder>[];
  public variance: 'in' | 'out' | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.description = options.description ?? null;
    this.constraints = options.constraints?.filter(notNullish) ?? [];
    this.variance = options.variance ?? null;
  }

  /** Only writes the name of the parameter. The constraints are written by `csGenericParameter.writeConstraints`. */
  protected override onWrite(builder: TBuilder): void {
    if (this.variance) builder.append(this.variance, ' ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);
  }
}

const createGenericParameter = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): CsGenericParameter<TBuilder> => new CsGenericParameter<TBuilder>({ ...options, name });

export const csGenericParameter: typeof createGenericParameter & {
  write: typeof writeCsGenericParameters;
  writeConstraints: typeof writeCsGenericConstraints;
} = Object.assign(createGenericParameter, {
  write: writeCsGenericParameters,
  writeConstraints: writeCsGenericConstraints,
});
