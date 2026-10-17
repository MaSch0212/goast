import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { GoNode } from '../node.ts';
import { writeGoNode, writeGoNodes } from '../utils/write-go-node.ts';
import type { GoMethod } from './method.ts';
import type { GoType } from './types.ts';

type Injects = 'members';

/** A member of an interface: a method, or an embedded interface or type constraint. */
export type GoInterfaceMember<TBuilder extends SourceBuilder> = GoMethod<TBuilder> | GoType<TBuilder>;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    members?: Nullable<Nullable<GoInterfaceMember<TBuilder>>[]>;
  }
>;

/** An interface type: `interface { ... }`. */
export class GoInterface<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public members: GoInterfaceMember<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.members = options.members?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.members.length === 0 && !this.inject.beforeMembers && !this.inject.afterMembers) {
      builder.append('interface{}');
      return;
    }

    builder.parenthesize(
      ['interface {', '}'],
      (b) => {
        b.append(this.inject.beforeMembers);
        for (const member of this.members) {
          writeGoNode(b, member);
          b.appendLine();
        }
        b.append(this.inject.afterMembers);
      },
      { multiline: true },
    );
  }
}

const createInterface = <TBuilder extends SourceBuilder>(
  members?: Options<TBuilder>['members'],
  options?: Prettify<Omit<Options<TBuilder>, 'members'>>,
): GoInterface<TBuilder> => new GoInterface<TBuilder>({ ...options, members });

export const goInterface: typeof createInterface & { write: typeof writeGoNodes } = Object.assign(createInterface, {
  write: writeGoNodes,
});
