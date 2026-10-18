import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { CsNode } from '../node.ts';
import { writeCsNodes } from '../utils/write-cs-node.ts';
import type { CsValue } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    items?: Nullable<Nullable<CsValue<TBuilder>>[]>;
  }
>;

/** A C# 12 collection expression: `[a, b, c]`. */
export class CsCollectionExpression<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public items: CsValue<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.items = options.items?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    const multiline = this.items.length > 3;
    builder.parenthesize('[]', (b) => writeCsNodes(b, this.items, { separator: multiline ? ',\n' : ', ' }), {
      multiline,
    });
  }
}

const createCollectionExpression = <TBuilder extends SourceBuilder>(
  items?: Options<TBuilder>['items'],
  options?: Prettify<Omit<Options<TBuilder>, 'items'>>,
): CsCollectionExpression<TBuilder> => new CsCollectionExpression<TBuilder>({ ...options, items });

export const csCollectionExpression: typeof createCollectionExpression & { write: typeof writeCsNodes } = Object.assign(
  createCollectionExpression,
  {
    write: writeCsNodes,
  },
);
