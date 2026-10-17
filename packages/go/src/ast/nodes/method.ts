import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { GoNode } from '../node.ts';
import { writeGoNodes } from '../utils/write-go-node.ts';
import type { GoDoc } from './doc.ts';
import { type GoParameter, goParameter } from './parameter.ts';

type Injects = 'parameters' | 'results';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<GoDoc<TBuilder>>;
    parameters?: Nullable<Nullable<GoParameter<TBuilder>>[]>;
    results?: Nullable<Nullable<GoParameter<TBuilder>>[]>;
  }
>;

/** A method of an interface type: `Name(params) results`. */
export class GoMethod<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public doc: GoDoc<TBuilder> | null;
  public parameters: GoParameter<TBuilder>[];
  public results: GoParameter<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.results = options.results?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    this.doc?.write(builder);
    builder.append(this.name);
    builder.append(this.inject.beforeParameters);
    goParameter.writeList(builder, this.parameters);
    builder.append(this.inject.afterParameters);
    if (this.results.length > 0) {
      builder.append(' ', this.inject.beforeResults);
      goParameter.writeList(builder, this.results, { results: true });
      builder.append(this.inject.afterResults);
    }
  }
}

const createMethod = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): GoMethod<TBuilder> => new GoMethod<TBuilder>({ ...options, name });

export const goMethod: typeof createMethod & { write: typeof writeGoNodes } = Object.assign(createMethod, {
  write: writeGoNodes,
});
