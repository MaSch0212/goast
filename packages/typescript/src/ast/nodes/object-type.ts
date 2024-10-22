import { type AstNodeOptions, type BasicAppendValue, notNullish, type Nullable, type SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsMembers } from '../utils/write-ts-members.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsIndexer } from './indexer.ts';
import type { TsMethod } from './method.ts';
import type { TsProperty } from './property.ts';

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

const createObjectType = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>): TsObjectType<TBuilder> =>
  new TsObjectType<TBuilder>(options ?? {});

export const tsObjectType: typeof createObjectType & { write: typeof writeTsNodes } = Object.assign(createObjectType, {
  write: writeTsNodes,
});
