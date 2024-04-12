import { AstNodeOptions, BasicAppendValue, Nullable, SourceBuilder, notNullish } from '@goast/core';

import { TsIndexer } from './indexer';
import { TsMethod } from './method';
import { TsProperty } from './property';
import { TsNode } from '../node';
import { writeTsMembers } from '../utils/write-ts-members';
import { writeTsNodes } from '../utils/write-ts-nodes';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    members?: Nullable<Nullable<Member<TBuilder>>[]>;
  }
>;

type Member<TBuilder extends SourceBuilder> =
  | TsProperty<TBuilder>
  | TsMethod<TBuilder>
  | TsIndexer<TBuilder>
  | BasicAppendValue<TBuilder>;

export class TsObjectType<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public members: Member<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.members = options.members?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder.parenthesize(
      '{}',
      (b) => {
        writeTsMembers(b, this.members);
      },
      { multiline: this.members.length > 0 },
    );
  }
}

const createObjectType = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>) =>
  new TsObjectType<TBuilder>(options ?? {});

export const tsObjectType = Object.assign(createObjectType, {
  write: writeTsNodes,
});
