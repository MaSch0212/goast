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
    body: AppendValue<TBuilder>;
  }
>;

export class KtInitBlock<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public body: AppendValue<TBuilder>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.body = options.body;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('init ').parenthesize('{}', this.body, { multiline: !!this.body }).appendLine();
  }
}

const createInitBlock = <TBuilder extends SourceBuilder>(
  body: Options<TBuilder>['body'],
  options?: Prettify<Omit<Options<TBuilder>, 'body'>>,
) => new KtInitBlock<TBuilder>({ ...options, body });

const writeInitBlocks = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtInitBlock<TBuilder> | AppendValue<TBuilder>>>,
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, writeKt, { separator: '\n' });
};

export const ktInitBlock = Object.assign(createInitBlock, {
  write: writeInitBlocks,
});
