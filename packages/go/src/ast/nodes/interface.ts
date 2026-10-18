import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { GoNode } from '../node.ts';
import { writeGoNode, writeGoNodes } from '../utils/write-go-node.ts';
import type { GoMethod } from './method.ts';
import type { GoType } from './types.ts';

type Injects = 'members';

/**
 * A member of an interface: a method, or an embedded interface or type constraint. Embedded types are written as their
 * type only, such as `fmt.Stringer`.
 */
export type GoInterfaceMember<TBuilder extends SourceBuilder> = GoMethod<TBuilder> | GoType<TBuilder>;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    members?: Nullable<Nullable<GoInterfaceMember<TBuilder>>[]>;
  }
>;

/**
 * An interface type, written as `interface { ... }` with one member per line. An interface without members is written
 * as `interface{}`, unless it has custom injection points for its members.
 *
 * @template TBuilder The type of the source builder the interface is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goInterface
 */
export class GoInterface<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The methods and embedded types of the interface, in the order they are written.
   */
  public members: GoInterfaceMember<TBuilder>[];

  /**
   * Initializes a new instance of the GoInterface class.
   * @param options The options to use for this instance.
   */
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

/**
 * Factory for creating interface type nodes. The `write` function writes one or more interface types to a builder.
 *
 * @param members The methods and embedded types of the interface. `null` entries are skipped.
 * @param options The settings of the interface. See `GoInterface` for the available properties.
 * @example
 * ```ts
 * goInterface([
 *   goMethod('GetPet', {
 *     parameters: [goParameter('id', goReference('string'))],
 *     results: [goParameter(null, goPointer(goReference('Pet'))), goParameter(null, goReference('error'))],
 *   }),
 * ]);
 * // Emits:
 * // interface {
 * // 	GetPet(id string) (*Pet, error)
 * // }
 * ```
 */
export const goInterface: typeof createInterface & { write: typeof writeGoNodes } = Object.assign(createInterface, {
  write: writeGoNodes,
});
