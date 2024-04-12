import { AstNodeOptions, Nullable, Prettify, SourceBuilder, notNullish } from '@goast/core';

import { TsType, TsValue } from './types';
import { TsNode } from '../node';
import { writeTsNodes } from '../utils/write-ts-nodes';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    elements: Nullable<TsType<TBuilder> | TsValue<TBuilder>>[];
  }
>;

export class TsTuple<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public elements: (TsType<TBuilder> | TsValue<TBuilder>)[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.elements = options.elements.filter(notNullish);
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.elements.length === 0) {
      builder.append('[]');
    } else {
      const multiline = this.elements.length > 3;
      builder.parenthesize('[]', (b) => writeTsNodes(b, this.elements, { separator: multiline ? ',\n' : ', ' }), {
        multiline,
      });
    }
  }
}

const createTuple = <TBuilder extends SourceBuilder>(
  elements: Options<TBuilder>['elements'],
  options?: Prettify<Omit<Options<TBuilder>, 'elements'>>,
) => new TsTuple<TBuilder>({ ...options, elements });

export const tsTuple = Object.assign(createTuple, {
  write: writeTsNodes,
});
