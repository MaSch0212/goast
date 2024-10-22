import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsType } from './types.ts';

type Injects = 'type';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    readonly?: Nullable<boolean>;
    type: TsType<TBuilder>;
  }
>;

export class TsArrayType<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public readonly: boolean;
  public type: TsType<TBuilder>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.readonly = options.readonly ?? false;
    this.type = options.type;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.readonly) builder.append('readonly ');

    builder
      .append(this.inject.beforeType)
      .parenthesize('()', (b) => writeTsNode(b, this.type))
      .append(this.inject.afterType);

    builder.append('[]');
  }
}

const createArrayType = <TBuilder extends SourceBuilder>(
  type: Options<TBuilder>['type'],
  options?: Prettify<Omit<Options<TBuilder>, 'type'>>,
): TsArrayType<TBuilder> => new TsArrayType<TBuilder>({ ...options, type });

export const tsArrayType: typeof createArrayType & { write: typeof writeTsNodes } = Object.assign(createArrayType, {
  write: writeTsNodes,
});
