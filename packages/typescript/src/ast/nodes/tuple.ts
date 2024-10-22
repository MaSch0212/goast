import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsType, TsValue } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    elements: Nullable<TsType<TBuilder> | TsValue<TBuilder>>[];
    asConst?: Nullable<boolean>;
  }
>;

export class TsTuple<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public elements: (TsType<TBuilder> | TsValue<TBuilder>)[];
  public asConst: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.elements = options.elements.filter(notNullish);
    this.asConst = options.asConst ?? false;
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

    if (this.asConst) {
      builder.append(' as const');
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
