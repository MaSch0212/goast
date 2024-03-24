import {
  SourceBuilder,
  AppendValue,
  AstNodeOptions,
  notNullish,
  toArray,
  SingleOrMultiple,
  Nullable,
} from '@goast/core';

import { KtFunction } from './function';
import { KtInitBlock } from './init-block';
import { KtProperty } from './property';
import { KtReference } from './reference';
import { KtNode } from '../node';
import { writeKt, writeKtMembers } from '../utils';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    data?: boolean;
    name?: Nullable<string>;
    class?: KtReference<TBuilder> | AppendValue<TBuilder>;
    classArguments?: Nullable<Nullable<AppendValue<TBuilder>>[]>;
    implements?: Nullable<Nullable<KtReference<TBuilder> | AppendValue<TBuilder>>[]>;
    members?: Nullable<
      Nullable<KtInitBlock<TBuilder> | KtProperty<TBuilder> | KtFunction<TBuilder> | AppendValue<TBuilder>>[]
    >;
  }
>;

export class KtObject<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public data: boolean;
  public name: string | null;
  public class: KtReference<TBuilder> | AppendValue<TBuilder> | null;
  public classArguments: AppendValue<TBuilder>[];
  public implements: (KtReference<TBuilder> | AppendValue<TBuilder>)[];
  public members: (KtInitBlock<TBuilder> | KtProperty<TBuilder> | KtFunction<TBuilder> | AppendValue<TBuilder>)[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.data = options.data ?? false;
    this.name = options.name ?? null;
    this.class = options.class ?? null;
    this.classArguments = options.classArguments?.filter(notNullish) ?? [];
    this.implements = options.implements?.filter(notNullish) ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .appendIf(this.data, 'data ')
      .append('object')
      .appendIf(!!this.name, ' ', this.name)
      .appendIf(!!this.class || this.implements.length > 0, ' : ')
      .appendIf(
        !!this.class,
        (b) => writeKt(b, this.class),
        (b) =>
          b.parenthesize('()', (b) => b.forEach(this.classArguments, (b, a) => writeKt(b, a), { separator: ', ' })),
      )
      .appendIf(!!this.class && this.implements.length > 0, ', ')
      .forEach(this.implements, (b, i) => writeKt(b, i), { separator: ', ' })
      .if(this.members.some(notNullish), (b) =>
        b.append(' ').parenthesize('{}', (b) => writeKtMembers(b, this.members), { multiline: true }),
      )
      .appendLineIf(!!this.name);
  }
}

const createObject = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>) =>
  new KtObject<TBuilder>(options ?? {});

const writeObjects = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtObject<TBuilder> | AppendValue<TBuilder>>>,
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, writeKt, { separator: '\n' });
};

export const ktObject = Object.assign(createObject, {
  write: writeObjects,
});
