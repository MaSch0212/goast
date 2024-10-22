import type { AstNodeOptions, Prettify, SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode } from '../utils/write-ts-nodes.ts';
import { writeTsParameters } from '../utils/write-ts-parameters.ts';
import type { TsValue } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    value: TsValue<TBuilder>;
  }
>;

export class TsArgument<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public value: TsValue<TBuilder>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.value = options.value;
  }

  protected override onWrite(builder: TBuilder): void {
    writeTsNode(builder, this.value);
  }
}

const createArgument = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value'>>,
): TsArgument<TBuilder> => new TsArgument<TBuilder>({ ...options, value });

export const tsArgument: typeof createArgument & { write: typeof writeTsParameters } = Object.assign(createArgument, {
  write: writeTsParameters,
});
