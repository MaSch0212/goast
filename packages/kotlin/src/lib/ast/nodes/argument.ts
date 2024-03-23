import { AppendValue, AstNodeOptions, Prettify, SingleOrMultiple, SourceBuilder, toArray } from '@goast/core';

import { KotlinFileBuilder } from '../../file-builder';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type KtArgumentOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtArgument<TBuilder>,
  typeof KtNode<TBuilder>,
  'value'
>;

export class KtArgument<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, TInjects> {
  public name: string | null;
  public value: AppendValue<TBuilder>;

  constructor(options: KtArgumentOptions<TBuilder>) {
    super(options);
    this.name = options?.name ?? null;
    this.value = options.value;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.appendIf(!!this.name, this.name, ' = ').append(this.value);
  }
}

const createArgument = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  value: AppendValue<TBuilder>,
  options?: Prettify<Omit<KtArgumentOptions<TBuilder>, 'value'>>
) => new KtArgument<TBuilder>({ ...options, value });

type x = AppendValue<KotlinFileBuilder>;

const createNamedArgument = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  name: NonNullable<KtArgument<TBuilder>['name']>,
  value: KtArgument<TBuilder>['value'],
  options?: Prettify<Omit<KtArgumentOptions<TBuilder>, 'value' | 'name'>>
) => new KtArgument<TBuilder>({ ...options, value, name });

const writeArguments = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<KtArgument<TBuilder> | AppendValue<TBuilder>>,
  options?: { multiline: boolean }
) => {
  nodes = toArray(nodes);
  const multiline = options?.multiline ?? nodes.length > 2;
  builder.parenthesize('()', (b) => b.forEach(nodes, writeKt, { separator: multiline ? ',\n' : ', ' }), {
    multiline,
  });
};

export const ktArgument = Object.assign(createArgument, {
  named: createNamedArgument,
  write: writeArguments,
});
