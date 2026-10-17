import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  createOverwriteProxy,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import type { KtAccessModifier } from '../common.ts';
import { KtNode } from '../node.ts';
import { writeKtMembers } from '../utils/write-kt-members.ts';
import { writeKtNodes } from '../utils/write-kt-node.ts';
import { type KtAnnotation, ktAnnotation } from './annotation.ts';
import type { KtClass } from './class.ts';
import { type KtDoc, ktDoc } from './doc.ts';
import type { KtEnum } from './enum.ts';
import type { KtFunction } from './function.ts';
import { type KtGenericParameter, ktGenericParameter } from './generic-parameter.ts';
import type { KtObject } from './object.ts';
import type { KtProperty } from './property.ts';
import type { KtType } from './types.ts';

type Injects = 'doc' | 'annotations' | 'modifiers' | 'name' | 'generics' | 'extends' | 'body' | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<KtDoc<TBuilder>>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    accessModifier?: Nullable<KtAccessModifier>;
    name: string;
    generics?: Nullable<Nullable<KtGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    extends?: Nullable<Nullable<KtType<TBuilder>>[]>;
    members?: Nullable<Nullable<KtInterfaceMember<TBuilder>>[]>;
    companionObject?: Nullable<KtObject<TBuilder>>;
  }
>;

/**
 * A member that can be written in the body of an interface: an enum, an interface, a property, a function, a class,
 * or any appended value.
 * @template TBuilder The type of the builder that the member is written to.
 */
export type KtInterfaceMember<TBuilder extends SourceBuilder> =
  | KtEnum<TBuilder>
  | KtInterface<TBuilder>
  | KtProperty<TBuilder>
  | KtFunction<TBuilder>
  | KtClass<TBuilder>
  | AppendValue<TBuilder>;

/**
 * Represents a Kotlin interface declaration, such as `private interface Foo<T> : Bar, Baz { ... }`.
 *
 * Written in this order: the KDoc comment, the annotations, the access modifier, the `interface` keyword, the name, the
 * generic parameters, the super-interfaces, then the body. The body is only written when there are members or a
 * companion object. The descriptions of generic parameters are merged into the KDoc comment as `@param` tags.
 *
 * @template TBuilder The type of the source builder the interface is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktInterface
 */
export class KtInterface<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The KDoc comment written above the interface, or `null` to omit it. The descriptions of the generic parameters are
   * added to it as `@param` tags.
   */
  public doc: KtDoc<TBuilder> | null;
  /**
   * The annotations written above the interface, each on a line of its own.
   */
  public annotations: KtAnnotation<TBuilder>[];
  /**
   * The visibility written before the `interface` keyword, such as `private`. `null` writes no visibility keyword.
   */
  public accessModifier: KtAccessModifier | null;
  /**
   * The interface name written after the `interface` keyword.
   */
  public name: string;
  /**
   * The generic parameters written in angle brackets after the name, such as `<T, U>`. Plain strings are written as
   * they are. Described parameters also add a `@param` tag to the KDoc comment.
   */
  public generics: (KtGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The super-interfaces written after ` : ` as a comma-separated list, such as `Bar, Baz`. The clause is omitted when
   * the list is empty.
   */
  public extends: KtType<TBuilder>[];
  /**
   * The members written in the body, in the given order. Properties without a doc comment or annotations are written
   * without blank lines between them, other members are set off by blank lines.
   */
  public members: KtInterfaceMember<TBuilder>[];
  /**
   * The companion object written first in the body, with the `companion` modifier. Setting it writes the body even when
   * there are no other members.
   */
  public companionObject: KtObject<TBuilder> | null;

  /**
   * Initializes a new instance of the KtInterface class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.name = options.name;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.extends = options.extends?.filter(notNullish) ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
    this.companionObject = options.companionObject ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    ktDoc.get(this.doc, { generics: this.generics })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    builder.append(this.inject.afterModifiers);

    builder.append('interface ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    builder.append(this.inject.beforeGenerics);
    ktGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    if (this.extends.length > 0) {
      builder.append(' : ');
      builder.append(this.inject.beforeExtends);
      writeKtNodes(builder, this.extends, { separator: ', ' });
      builder.append(this.inject.afterExtends);
    }

    const allMembers = [
      this.companionObject ? createOverwriteProxy(this.companionObject, { companion: true }) : null,
      ...this.members,
    ].filter(notNullish);

    if (allMembers.length > 0) {
      builder.append(' ');
      builder.append(this.inject.beforeBody);
      builder.parenthesize(
        '{}',
        (b) => {
          b.append(this.inject.beforeMembers);
          writeKtMembers(b, allMembers);
          b.append(this.inject.afterMembers);
        },
        { multiline: true },
      );
      builder.append(this.inject.afterBody);
    }

    builder.appendLine();
  }
}

const createInterface = <TBuilder extends SourceBuilder>(
  name: KtInterface<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): KtInterface<TBuilder> => new KtInterface<TBuilder>({ ...options, name });

/**
 * Factory for creating interface nodes. The `write` function writes one or more interface nodes to a builder.
 *
 * @param name The name of the interface.
 * @param options The settings of the interface. See `KtInterface` for the available properties.
 * @example
 * ```ts
 * ktInterface('Foo', {
 *   annotations: [ktAnnotation('Deprecated')],
 *   accessModifier: 'private',
 *   generics: [ktGenericParameter('T')],
 *   extends: ['Bar', 'Baz'],
 *   members: [ktProperty('x', { type: 'Int' })],
 *   companionObject: ktObject(),
 * });
 * // Emits:
 * // @Deprecated
 * // private interface Foo<T> : Bar, Baz {
 * //     companion object {}
 * //
 * //     val x: Int
 * // }
 * ```
 */
export const ktInterface: typeof createInterface & { write: typeof writeKtNodes } = Object.assign(createInterface, {
  write: writeKtNodes,
});
