import type { AstNodeOptions, SourceBuilder } from '@goast/core';

import type { TsType } from './types.ts';
import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';

type Injects = 'type' | 'index';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    type: TsType<TBuilder>;
    index: TsType<TBuilder>;
  }
>;

export class TsLookupType<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public type: TsType<TBuilder>;
  public index: TsType<TBuilder>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.type = options.type;
    this.index = options.index;
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .parenthesize('()', (b) => {
        b.append(this.inject.beforeType);
        writeTsNode(b, this.type);
        b.append(this.inject.afterType);
      })
      .parenthesize('[]', (b) => {
        b.append(this.inject.beforeIndex);
        writeTsNode(b, this.index);
        b.append(this.inject.afterIndex);
      });
  }
}

const createLookupType = <TBuilder extends SourceBuilder>(
  type: Options<TBuilder>['type'],
  index: Options<TBuilder>['index'],
  options?: Omit<Options<TBuilder>, 'type' | 'index'>,
) => new TsLookupType<TBuilder>({ ...options, type, index });

export const tsLookupType = Object.assign(createLookupType, {
  write: writeTsNodes,
});
