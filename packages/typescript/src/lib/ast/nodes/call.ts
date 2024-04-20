import { SourceBuilder, AstNodeOptions, Nullable, notNullish, ArrayItem, Prettify } from '@goast/core';

import { TsArgument, tsArgument } from './argument';
import { TsType, TsValue } from './types';
import { TsNode } from '../node';
import { writeTsNodes } from '../utils/write-ts-nodes';

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
