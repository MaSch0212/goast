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

/**
 * Represents an object type literal, which describes the shape of a value in a type position.
 *
 * The members are written between braces, one per line. An object type without members is written as `{}`.
 * Properties and bodyless methods end with a semicolon.
 *
 * @template TBuilder The type of the source builder the object type is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsObjectType
 * @see TsObject
 */
export class TsObjectType<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The members written between the braces, in the given order. Null entries are skipped. Properties and bodyless
   * methods without a doc comment or decorators are written without blank lines, other members are set off by blank
   * lines.
   */
  public members: Member<TBuilder>[];

  /**
   * Initializes a new instance of the TsObjectType class.
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

const createObjectType = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>): TsObjectType<TBuilder> =>
  new TsObjectType<TBuilder>(options ?? {});

/**
 * Factory for creating object type nodes. The `write` function writes one or more object type nodes to a builder.
 *
 * @param options The settings of the object type. See `TsObjectType` for the available properties.
 * @example
 * ```ts
 * tsObjectType({ members: [tsProperty('x'), tsProperty('y')] });
 * // Emits:
 * // {
 * //   x;
 * //   y;
 * // }
 * ```
 */
export const tsObjectType: typeof createObjectType & { write: typeof writeTsNodes } = Object.assign(createObjectType, {
  write: writeTsNodes,
});
