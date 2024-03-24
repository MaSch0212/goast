import {
  AppendValue,
  AstNodeOptions,
  Nullable,
  Prettify,
  SingleOrMultiple,
  SourceBuilder,
  notNullish,
  toArray,
} from '@goast/core';

import { KtArgument } from './argument';
import { KtReference } from './reference';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    callPath: Nullable<AppendValue<TBuilder> | KtReference<TBuilder>>[];
    arguments?: Nullable<Nullable<KtArgument<TBuilder> | AppendValue<TBuilder>>[]>;
  }
>;

export class KtCall<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public callPath: (AppendValue<TBuilder> | KtReference<TBuilder>)[];
  public arguments: (KtArgument<TBuilder> | AppendValue<TBuilder>)[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.callPath = options.callPath.filter(notNullish);
    this.arguments = options.arguments?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .forEach(this.callPath, writeKt, { separator: '.' })
      .parenthesize('()', (b) => b.forEach(this.arguments, writeKt, { separator: ', ' }));
  }
}

const createCall = <TBuilder extends SourceBuilder>(
  callPath: Options<TBuilder>['callPath'],
  $arguments?: Options<TBuilder>['arguments'],
  options?: Prettify<Omit<Options<TBuilder>, 'callPath' | 'arguments'>>,
) => new KtCall<TBuilder>({ ...options, callPath, arguments: $arguments ?? [] });

const writeCalls = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtCall<TBuilder> | AppendValue<TBuilder>>>,
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, writeKt, { separator: '.' });
};

export const ktCall = Object.assign(createCall, {
  write: writeCalls,
});
