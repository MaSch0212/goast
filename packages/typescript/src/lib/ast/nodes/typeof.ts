import { SourceBuilder, AstNodeOptions } from '@goast/core';

import { TsValue } from './types';
import { TsNode } from '../node';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes';

type Injects = 'value';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    value: TsValue<TBuilder>;
  }
>;

export class TsTypeof<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public value: TsValue<TBuilder>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.value = options.value;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('typeof ');
    builder.append(this.inject.beforeValue);
    writeTsNode(builder, this.value);
    builder.append(this.inject.afterValue);
  }
}

export const createTypeof = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Omit<Options<TBuilder>, 'value'>,
) => new TsTypeof<TBuilder>({ ...options, value });

export const tsTypeof = Object.assign(createTypeof, {
  write: writeTsNodes,
});
