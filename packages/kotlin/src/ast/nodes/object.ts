import { type AstNodeOptions, type BasicAppendValue, notNullish, type Nullable, type SourceBuilder } from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtMembers } from '../utils/write-kt-members.ts';
import { writeKtNode, writeKtNodes } from '../utils/write-kt-node.ts';
import { type KtArgument, ktArgument } from './argument.ts';
import type { KtFunction } from './function.ts';
import type { KtInitBlock } from './init-block.ts';
import type { KtProperty } from './property.ts';
import type { KtType, KtValue } from './types.ts';

type Injects = 'modifiers' | 'name' | 'inheritList' | 'body' | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    data?: boolean;
    name?: Nullable<string>;
    class?: KtType<TBuilder>;
    classArguments?: Nullable<Nullable<KtArgument<TBuilder> | KtValue<TBuilder>>[]>;
    implements?: Nullable<Nullable<KtType<TBuilder>>[]>;
    members?: Nullable<Nullable<KtObjectMember<TBuilder>>[]>;
    companion?: Nullable<boolean>;
  }
>;

export type KtObjectMember<TBuilder extends SourceBuilder> =
  | KtInitBlock<TBuilder>
  | KtProperty<TBuilder>
  | KtFunction<TBuilder>
  | BasicAppendValue<TBuilder>;

export class KtObject<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public data: boolean;
  public name: string | null;
  public class: KtType<TBuilder> | null;
  public classArguments: (KtArgument<TBuilder> | KtValue<TBuilder>)[];
  public implements: KtType<TBuilder>[];
  public members: KtObjectMember<TBuilder>[];
  public companion: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.data = options.data ?? false;
    this.name = options.name ?? null;
    this.class = options.class ?? null;
    this.classArguments = options.classArguments?.filter(notNullish) ?? [];
    this.implements = options.implements?.filter(notNullish) ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
    this.companion = options.companion ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeModifiers);
    if (this.data) builder.append('data ');
    if (this.companion) builder.append('companion ');
    builder.append(this.inject.afterModifiers);

    builder.append('object');

    if (this.name) {
      builder.append(' ', this.inject.beforeName, this.name, this.inject.afterName);
    }

    if (this.class || this.implements.length > 0) {
      builder.append(' : ', this.inject.beforeInheritList);

      if (this.class) {
        writeKtNode(builder, this.class);
        ktArgument.write(builder, this.classArguments);
        if (this.implements.length > 0) builder.append(', ');
      }

      writeKtNodes(builder, this.implements, { separator: ', ' });
      builder.append(this.inject.afterInheritList);
    }

    builder.append(' ', this.inject.beforeBody);
    builder.parenthesize(
      '{}',
      (b) => {
        builder.append(this.inject.beforeMembers);
        writeKtMembers(b, this.members);
        builder.append(this.inject.afterMembers);
      },
      { multiline: this.members.length > 0 },
    );
    builder.append(this.inject.afterBody);

    if (this.name) builder.appendLine();
  }
}

const createObject = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>): KtObject<TBuilder> =>
  new KtObject<TBuilder>(options ?? {});

export const ktObject: typeof createObject & { write: typeof writeKtNodes } = Object.assign(createObject, {
  write: writeKtNodes,
});
