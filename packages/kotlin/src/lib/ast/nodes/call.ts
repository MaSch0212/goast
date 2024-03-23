import { AppendValue, AstNodeOptions, Nullable, Prettify, SingleOrMultiple, SourceBuilder, toArray } from '@goast/core';

import { KtArgument } from './argument';
import { KotlinFileBuilder } from '../../file-builder';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type KtCallOptions<TBuilder extends SourceBuilder> = AstNodeOptions<
  KtCall<TBuilder>,
  typeof KtNode<TBuilder>,
  'callPath'
>;

export class KtCall<TBuilder extends SourceBuilder = KotlinFileBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects
> {
  public callPath: AppendValue<TBuilder>[];
  public arguments: (KtArgument<TBuilder> | AppendValue<TBuilder>)[];

  constructor(options: KtCallOptions<TBuilder>) {
    super(options);
    this.callPath = options.callPath;
    this.arguments = options.arguments ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .forEach(this.callPath, (b, p) => b.append(p), { separator: '.' })
      .parenthesize('()', (b) => b.forEach(this.arguments, writeKt, { separator: ', ' }));
  }
}

const createCall = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  callPath: KtCall<TBuilder>['callPath'],
  $arguments?: Nullable<KtCall<TBuilder>['arguments']>,
  options?: Prettify<Omit<KtCallOptions<TBuilder>, 'callPath' | 'arguments'>>
) => new KtCall<TBuilder>({ ...options, callPath, arguments: $arguments ?? [] });

const writeCalls = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<KtCall<TBuilder> | AppendValue<TBuilder>>
) => {
  builder.forEach(toArray(nodes), writeKt, { separator: '.' });
};

export const ktCall = Object.assign(createCall, {
  write: writeCalls,
});
