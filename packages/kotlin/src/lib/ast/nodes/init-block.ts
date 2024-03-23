import { AppendValue, AstNodeOptions, Prettify, SingleOrMultiple, SourceBuilder, toArray } from '@goast/core';

import { KotlinFileBuilder } from '../../file-builder';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type KtInitBlockOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtInitBlock<TBuilder>,
  typeof KtNode<TBuilder>,
  'body'
>;

export class KtInitBlock<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, TInjects> {
  public body: AppendValue<TBuilder>;

  constructor(options: KtInitBlockOptions<TBuilder>) {
    super(options);
    this.body = options.body;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('init ').parenthesize('{}', this.body, { multiline: !!this.body }).appendLine();
  }
}

const createInitBlock = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  body: KtInitBlock<TBuilder>['body'],
  options?: Prettify<Omit<KtInitBlockOptions<TBuilder>, 'body'>>
) => new KtInitBlock<TBuilder>({ ...options, body });

const writeInitBlocks = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<KtInitBlock<TBuilder> | AppendValue<TBuilder>>
) => {
  builder.forEach(toArray(nodes), writeKt, { separator: '\n' });
};

export const ktInitBlock = Object.assign(createInitBlock, {
  write: writeInitBlocks,
});
