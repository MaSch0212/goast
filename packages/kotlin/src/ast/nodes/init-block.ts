import type { AppendValue, AstNodeOptions, Prettify, SourceBuilder } from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtNodes } from '../utils/write-kt-node.ts';

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
): KtInitBlock<TBuilder> => new KtInitBlock<TBuilder>({ ...options, body });

export const ktInitBlock: typeof createInitBlock & { write: typeof writeKtNodes } = Object.assign(createInitBlock, {
  write: writeKtNodes,
});
