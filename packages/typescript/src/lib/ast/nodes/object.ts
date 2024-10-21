import { type AstNodeOptions, type BasicAppendValue, notNullish, type Nullable, type SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsMembers } from '../utils/write-ts-members.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';

import type { TsMethod } from './method.ts';
import type { TsProperty } from './property.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    members?: Nullable<Nullable<Member<TBuilder>>[]>;
  }
>;

type Member<TBuilder extends SourceBuilder> = TsProperty<TBuilder> | TsMethod<TBuilder> | BasicAppendValue<TBuilder>;

export class TsObject<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
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

const createObject = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>) =>
  new TsObject<TBuilder>(options ?? {});

export const tsObject = Object.assign(createObject, {
  write: writeTsNodes,
});
