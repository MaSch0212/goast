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
import { writeKtNode, writeKtNodes } from '../utils/write-kt-node.ts';
import { type KtAnnotation, ktAnnotation } from './annotation.ts';
import { ktArgument } from './argument.ts';
import type { KtConstructor } from './constructor.ts';
import { type KtDoc, ktDoc } from './doc.ts';
import type { KtEnum } from './enum.ts';
import type { KtFunction } from './function.ts';
import { type KtGenericParameter, ktGenericParameter } from './generic-parameter.ts';
import { type KtInitBlock, ktInitBlock } from './init-block.ts';
import type { KtInterface } from './interface.ts';
import type { KtObject } from './object.ts';
import type { KtProperty } from './property.ts';
import type { KtType } from './types.ts';

type Injects =
  | 'doc'
  | 'annotations'
  | 'modifiers'
  | 'name'
  | 'generics'
  | 'primaryConstructor'
  | 'inheritList'
  | 'body'
  | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<KtDoc<TBuilder>>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    accessModifier?: Nullable<KtAccessModifier>;
    open?: Nullable<boolean>;
    abstract?: Nullable<boolean>;
    classKind?: Nullable<KtClassKind>;
    name: string;
    generics?: Nullable<Nullable<KtGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    primaryConstructor?: Nullable<KtConstructor<TBuilder>>;
    extends?: Nullable<KtType<TBuilder>>;
    implements?: Nullable<Nullable<KtType<TBuilder>>[]>;
    companionObject?: Nullable<KtObject<TBuilder>>;
    members?: Nullable<Nullable<KtClassMember<TBuilder>>[]>;
  }
>;

/**
 * The kinds of class that are written as a keyword before `class`, such as `data` for `data class`.
 */
export type KtClassKind = 'data' | 'value' | 'annotation' | 'sealed';
/**
 * The nodes that can be written as members of a class body. Other append values are written as-is.
 */
export type KtClassMember<TBuilder extends SourceBuilder> =
  | KtConstructor<TBuilder>
  | KtEnum<TBuilder>
  | KtInitBlock<TBuilder>
  | KtInterface<TBuilder>
  | KtProperty<TBuilder>
  | KtFunction<TBuilder>
  | KtClass<TBuilder>
  | AppendValue<TBuilder>;

/**
 * Represents a Kotlin class declaration, such as `data class PetDto(val id: Long)`.
 *
 * Written in this order: the doc comment, annotations, modifiers, the `class` keyword and name, generics, the primary
 * constructor, the inheritance list, then the body. The modifiers are written in the order access modifier, `open`,
 * `abstract`, class kind. The body is written in braces only when it has members, a companion object or a primary
 * constructor body.
 *
 * @template TBuilder The type of the source builder the class is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktClass
 */
export class KtClass<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The KDoc comment written above the class, or `null` to omit it. Descriptions of generic parameters and primary
   * constructor parameters are merged into it as `@param` tags, and property descriptions of primary constructor
   * parameters are merged into it as `@property` tags.
   */
  public doc: KtDoc<TBuilder> | null;
  /**
   * The annotations written above the class, each on its own line.
   */
  public annotations: KtAnnotation<TBuilder>[];
  /**
   * The visibility modifier written before the `class` keyword, or `null` to omit it. Kotlin classes are public by
   * default, so `null` writes a public class.
   */
  public accessModifier: KtAccessModifier | null;
  /**
   * Whether the class is written with the `open` modifier, which allows other classes to extend it.
   * @default false
   */
  public open: boolean;
  /**
   * Whether the class is written with the `abstract` modifier, placed after `open` when both are set.
   * @default false
   */
  public abstract: boolean;
  /**
   * The kind of the class, written as a keyword before `class`, such as `data` for `data class`. `null` writes a
   * regular class.
   */
  public classKind: KtClassKind | null;
  /**
   * The class name, written verbatim after the `class` keyword.
   */
  public name: string;
  /**
   * The type parameters written in angle brackets after the name, such as `<T, U>`. Plain strings are written as-is,
   * while described parameters also add a `@param` tag to the doc comment.
   */
  public generics: (KtGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The primary constructor written in parentheses after the name, or `null` to omit it. Only its annotations, access
   * modifier and parameters are written in the header, while its body is written as an `init` block in the class body.
   */
  public primaryConstructor: KtConstructor<TBuilder> | null;
  /**
   * The base class written after `:` in the inheritance list, or `null` to omit it. When the primary constructor
   * delegates to `super`, its arguments are written after the base class, such as `Bar(x)`.
   */
  public extends: KtType<TBuilder> | null;
  /**
   * The further supertypes written in the inheritance list after `:`, separated by commas. When a base class is also
   * set, they follow it after a comma.
   */
  public implements: KtType<TBuilder>[];
  /**
   * The members written in the class body, in the given order. Properties without a doc comment or annotations are
   * written without blank lines between them, while other members are set off by blank lines.
   */
  public members: KtClassMember<TBuilder>[];
  /**
   * The companion object written first in the class body, or `null` to omit it. It is written before the `init` block
   * of the primary constructor and before the members.
   */
  public companionObject: Nullable<KtObject<TBuilder>>;

  /**
   * Initializes a new instance of the KtClass class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.open = options.open ?? false;
    this.abstract = options.abstract ?? false;
    this.classKind = options.classKind ?? null;
    this.name = options.name;
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.primaryConstructor = options.primaryConstructor ?? null;
    this.extends = options.extends ?? null;
    this.implements = options.implements?.filter(notNullish) ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
    this.companionObject = options.companionObject;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    ktDoc.get(this.doc, { generics: this.generics, parameters: this.primaryConstructor?.parameters })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.open) builder.append('open ');
    if (this.abstract) builder.append('abstract ');
    if (this.classKind) builder.append(this.classKind, ' ');
    builder.append(this.inject.afterModifiers);

    builder.append('class ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    builder.append(this.inject.beforeGenerics);
    ktGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    if (this.primaryConstructor) {
      builder.append(this.inject.beforePrimaryConstructor);
      this.primaryConstructor.writeAsPrimary(builder);
      builder.append(this.inject.afterPrimaryConstructor);
    }

    if (this.extends || this.implements.length > 0) {
      builder.append(' : ');
      builder.append(this.inject.beforeInheritList);
      writeKtNode(builder, this.extends);
      if (this.extends && this.primaryConstructor?.delegateTarget === 'super') {
        ktArgument.write(builder, this.primaryConstructor.delegateArguments);
      }
      if (this.extends && this.implements.length > 0) {
        builder.append(', ');
      }
      writeKtNodes(builder, this.implements, { separator: ', ' });
      builder.append(this.inject.afterInheritList);
    }

    if (this.members.length > 0 || this.primaryConstructor?.body || this.companionObject) {
      builder.append(' ');
      builder.append(this.inject.beforeBody);
      builder.parenthesize(
        '{}',
        (b) => {
          b.append(this.inject.beforeMembers);
          writeKtMembers(b, [
            this.companionObject ? createOverwriteProxy(this.companionObject, { companion: true }) : null,
            this.primaryConstructor?.body ? ktInitBlock(this.primaryConstructor?.body) : null,
            ...this.members,
          ]);
          b.append(this.inject.afterMembers);
        },
        { multiline: true },
      );
      builder.append(this.inject.afterBody);
    }

    builder.appendLine();
  }
}

const createClass = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): KtClass<TBuilder> => new KtClass<TBuilder>({ ...options, name });

/**
 * Factory for creating class nodes. The `write` function writes one or more class nodes to a builder.
 *
 * @param name The name of the class.
 * @param options The settings of the class. See `KtClass` for the available properties.
 * @example
 * ```ts
 * ktClass('PetDto', {
 *   annotations: [ktAnnotation('Serializable')],
 *   classKind: 'data',
 *   primaryConstructor: ktConstructor([
 *     ktParameter.class('id', 'Long', { property: 'readonly' }),
 *     ktParameter.class('name', 'String', { property: 'readonly' }),
 *   ]),
 *   members: [ktProperty('tag', { type: 'String?' })],
 * });
 * // Emits:
 * // @Serializable
 * // data class PetDto(val id: Long, val name: String) {
 * //     val tag: String?
 * // }
 * ```
 */
export const ktClass: typeof createClass & { write: typeof writeKtNodes } = Object.assign(createClass, {
  write: writeKtNodes,
});
