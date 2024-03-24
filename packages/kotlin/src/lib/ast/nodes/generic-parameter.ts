import {
  AppendValue,
  AstNodeOptions,
  Nullable,
  Prettify,
  SingleOrMultiple,
  SourceBuilder,
  notNullish,
  toArray,
} from '@goast/core';

import { KtNode } from '../node';
import { writeKt } from '../utils';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    description?: Nullable<AppendValue<TBuilder>>;
    constraint?: Nullable<AppendValue<TBuilder>>;
  }
>;

export class KtGenericParameter<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public description: AppendValue<TBuilder> | null;
  public constraint: AppendValue<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.description = options.description ?? null;
    this.constraint = options.constraint ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.name).appendIf(this.constraint !== null, ' : ', this.constraint);
  }
}

const createGenericParameter = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new KtGenericParameter<TBuilder>({ ...options, name });

const writeGenericParameters = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtGenericParameter<TBuilder> | AppendValue<TBuilder>>>,
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  if (filteredNodes.length === 0) return;
  builder.parenthesize('<>', (b) => b.forEach(filteredNodes, writeKt, { separator: ', ' }));
};

export const ktGenericParameter = Object.assign(createGenericParameter, {
  write: writeGenericParameters,
});
