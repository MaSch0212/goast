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

/**
 * A member that can be written in the body of an object: an init block, a property, a function, or any appended value.
 * @template TBuilder The type of the builder that the member is written to.
 */
export type KtObjectMember<TBuilder extends SourceBuilder> =
  | KtInitBlock<TBuilder>
  | KtProperty<TBuilder>
  | KtFunction<TBuilder>
  | BasicAppendValue<TBuilder>;

/**
 * Represents a Kotlin `object` declaration or object expression, such as `object Foo : Bar(1, 2), Baz { ... }`.
 *
 * Written in this order: the `data` and `companion` modifiers, the `object` keyword, the name, the supertypes with the
 * base class constructor call, then the body. A named object is followed by a line break. An anonymous object, such as
 * `object : Bar() {}`, is not, so it can be written inside another expression.
 *
 * @template TBuilder The type of the source builder the object is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktObject
 */
export class KtObject<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * Whether the object is written with the `data` modifier, such as `data object Foo`.
   * @default false
   */
  public data: boolean;
  /**
   * The object name written after the `object` keyword. `null` writes an anonymous object, such as `object : Bar() {}`.
   */
  public name: string | null;
  /**
   * The base class written after ` : `, followed by its constructor call in parentheses, such as `Bar()`. The call is
   * always written, even without arguments. `null` writes no base class.
   */
  public class: KtType<TBuilder> | null;
  /**
   * The arguments written inside the parentheses of the base class constructor call, separated by commas. Only written
   * when `class` is set.
   */
  public classArguments: (KtArgument<TBuilder> | KtValue<TBuilder>)[];
  /**
   * The interfaces written after the base class, separated by commas, such as `Bar, Baz`. Without a base class, they
   * are written directly after ` : `. The clause is omitted when the list is empty.
   */
  public implements: KtType<TBuilder>[];
  /**
   * The members written in the body, in the given order. Properties without a doc comment or annotations and plain
   * strings are written without blank lines between them, other members are set off by blank lines. An empty list
   * writes `{}` on one line.
   */
  public members: KtObjectMember<TBuilder>[];
  /**
   * Whether the object is written with the `companion` modifier, such as `companion object`.
   * @default false
   */
  public companion: boolean;

  /**
   * Initializes a new instance of the KtObject class.
   * @param options The options to use for this instance.
   */
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

/**
 * Factory for creating object nodes. The `write` function writes one or more object nodes to a builder.
 *
 * @param options The settings of the object. See `KtObject` for the available properties.
 * @example
 * ```ts
 * ktObject({
 *   name: 'Foo',
 *   class: 'Bar',
 *   classArguments: ['1', '2'],
 *   implements: ['Baz'],
 *   members: [ktProperty('x', { type: 'Int', default: '1' })],
 * });
 * // Emits:
 * // object Foo : Bar(1, 2), Baz {
 * //     val x: Int = 1
 * // }
 * ```
 */
export const ktObject: typeof createObject & { write: typeof writeKtNodes } = Object.assign(createObject, {
  write: writeKtNodes,
});
