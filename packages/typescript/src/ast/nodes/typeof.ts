import type { AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsValue } from './types.ts';

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
): TsTypeof<TBuilder> => new TsTypeof<TBuilder>({ ...options, value });

export const tsTypeof: typeof createTypeof & { write: typeof writeTsNodes } = Object.assign(createTypeof, {
  write: writeTsNodes,
});
