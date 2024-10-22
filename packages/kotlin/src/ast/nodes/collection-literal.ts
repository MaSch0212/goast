import { type AstNodeOptions, notNullish, type Nullable, type SourceBuilder } from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtNodes } from '../utils/write-kt-node.ts';
import type { KtValue } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    elements: Nullable<Nullable<KtValue<TBuilder>>[]>;
  }
>;

export class KtCollectionLiteral<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public elements: KtValue<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.elements = options.elements?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    const multiline = this.elements.length > 2;
    builder.parenthesize(
      '[]',
      (b) => {
        writeKtNodes(b, this.elements, { separator: multiline ? ',\n' : ', ' });
      },
      { multiline },
    );
  }
}

const createCollectionLiteral = <TBuilder extends SourceBuilder>(
  elements: Options<TBuilder>['elements'],
  options?: Omit<Options<TBuilder>, 'elements'>,
) => new KtCollectionLiteral<TBuilder>({ ...options, elements });

export const ktCollectionLiteral = Object.assign(createCollectionLiteral, {
  write: writeKtNodes,
});
