import { SourceBuilder, AppendValue, AstNodeOptions, notNullish, toArray, SingleOrMultiple } from '@goast/core';

import { KtFunction } from './function';
import { KtInitBlock } from './init-block';
import { KtProperty } from './property';
import { KtReference } from './reference';
import { KotlinFileBuilder } from '../../file-builder';
import { KtNode } from '../node';
import { writeKt, writeKtMembers } from '../utils';

type KtObjectOptions<TBuilder extends SourceBuilder> = AstNodeOptions<KtObject<TBuilder>, typeof KtNode<TBuilder>>;

export class KtObject<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends KtNode<TBuilder, TInjects> {
  public data: boolean;
  public name: string | null;
  public class: KtReference<TBuilder> | AppendValue<TBuilder>;
  public classArguments: AppendValue<TBuilder>[];
  public implements: (KtReference<TBuilder> | AppendValue<TBuilder>)[];
  public members: (KtInitBlock<TBuilder> | KtProperty<TBuilder> | KtFunction<TBuilder> | AppendValue<TBuilder>)[];

  constructor(options: KtObjectOptions<TBuilder>) {
    super(options);
    this.data = options.data ?? false;
    this.name = options.name ?? null;
    this.class = options.class;
    this.classArguments = options.classArguments ?? [];
    this.implements = options.implements ?? [];
    this.members = options.members ?? [];
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
        (b) => b.parenthesize('()', (b) => b.forEach(this.classArguments, (b, a) => writeKt(b, a), { separator: ', ' }))
      )
      .appendIf(!!this.class && this.implements.length > 0, ', ')
      .forEach(this.implements, (b, i) => writeKt(b, i), { separator: ', ' })
      .if(this.members.some(notNullish), (b) =>
        b.append(' ').parenthesize('{}', (b) => writeKtMembers(b, this.members), { multiline: true })
      )
      .appendLineIf(!!this.name);
  }
}

const createObject = <TBuilder extends SourceBuilder = KotlinFileBuilder>(options?: KtObjectOptions<TBuilder>) =>
  new KtObject<TBuilder>(options ?? {});

const writeObjects = <TBuilder extends SourceBuilder = KotlinFileBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<KtObject<TBuilder> | AppendValue<TBuilder>>
) => {
  builder.forEach(toArray(nodes), writeKt, { separator: '\n' });
};

export const ktObject = Object.assign(createObject, {
  write: writeObjects,
});
