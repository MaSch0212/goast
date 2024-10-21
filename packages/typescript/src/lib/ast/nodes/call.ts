import {
  type ArrayItem,
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { type TsArgument, tsArgument } from './argument.ts';
import type { TsType, TsValue } from './types.ts';
import { TsNode } from '../node.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    path: Nullable<TsType<TBuilder> | TsValue<TBuilder>>[];
    arguments?: Nullable<Nullable<TsArgument<TBuilder> | TsValue<TBuilder>>[]>;
  }
>;

export class TsCall<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public path: (TsType<TBuilder> | TsValue<TBuilder>)[];
  public arguments: (TsArgument<TBuilder> | TsValue<TBuilder>)[] | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.path = options.path.filter(notNullish);
    this.arguments = options.arguments?.filter(notNullish) ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    writeTsNodes(builder, this.path, { separator: '.' });

    if (this.arguments) {
      tsArgument.write(builder, this.arguments);
    }
  }
}

const createCall = <TBuilder extends SourceBuilder>(
  path: Options<TBuilder>['path'] | ArrayItem<Options<TBuilder>['path']>,
  args?: Options<TBuilder>['arguments'],
  options?: Prettify<Omit<Options<TBuilder>, 'path' | 'arguments'>>,
) => new TsCall<TBuilder>({ ...options, path: Array.isArray(path) ? path : [path], arguments: args });

export const tsCall = Object.assign(createCall, {
  write: writeTsNodes,
});
