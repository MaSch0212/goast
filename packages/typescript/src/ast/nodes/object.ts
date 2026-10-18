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

/**
 * Represents an object literal, which creates a value in an expression position.
 *
 * The members are written between braces, one per line, and each member ends with a comma. Object literals have no
 * type annotations, so properties are written without one. An object without members is written as `{}`.
 *
 * @template TBuilder The type of the source builder the object literal is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsObject
 * @see TsObjectType
 */
export class TsObject<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The members written between the braces, in the given order. Null entries are skipped. Properties are written as
   * `name: value,`, or as `name,` when they have no value. Properties and bodyless methods without a doc comment or
   * decorators are written without blank lines, other members are set off by blank lines.
   */
  public members: Member<TBuilder>[];

  /**
   * Initializes a new instance of the TsObject class.
   * @param options The options to use for this instance.
   */
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

/**
 * Factory for creating object literal nodes. The `write` function writes one or more object literal nodes to a builder.
 *
 * @param options The settings of the object literal. See `TsObject` for the available properties.
 * @example
 * ```ts
 * tsObject({ members: [tsProperty('x'), tsProperty('y')] });
 * // Emits:
 * // {
 * //   x,
 * //   y,
 * // }
 * ```
 */
const createObject = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>): TsObject<TBuilder> =>
  new TsObject<TBuilder>(options ?? {});

export const tsObject: typeof createObject & { write: typeof writeTsNodes } = Object.assign(createObject, {
  write: writeTsNodes,
});
