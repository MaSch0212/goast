import { AppendValue, AstNodeOptions, Prettify, SingleOrMultiple, SourceBuilder, toArray } from '@goast/core';

import { KotlinFileBuilder } from '../../file-builder';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type KtGenericParameterOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtGenericParameter<TBuilder>,
  typeof KtNode<TBuilder>,
  'name'
>;

export class KtGenericParameter<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, TInjects> {
  public name: string;
  public description: AppendValue<TBuilder>;
  public constraint: AppendValue<TBuilder>;

  constructor(options: KtGenericParameterOptions<TBuilder>) {
    super(options);
    this.name = options.name;
    this.description = options.description ?? null;
    this.constraint = options.constraint ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.name).appendIf(this.constraint !== null, ' : ', this.constraint);
  }
}

const createGenericParameter = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  name: KtGenericParameter<TBuilder>['name'],
  options?: Prettify<Omit<KtGenericParameterOptions<TBuilder>, 'name'>>
) => new KtGenericParameter<TBuilder>({ ...options, name });

const writeGenericParameters = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<KtGenericParameter<TBuilder> | AppendValue<TBuilder>>
) => {
  nodes = toArray(nodes);
  if (nodes.length === 0) return;
  builder.parenthesize('<>', (b) => b.forEach(nodes, writeKt, { separator: ', ' }));
};

export const ktGenericParameter = Object.assign(createGenericParameter, {
  write: writeGenericParameters,
});
