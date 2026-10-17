import {
  type AppendValue,
  type AstNodeOptions,
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
import type { KtConstructor } from './constructor.ts';
import { type KtDoc, ktDoc } from './doc.ts';
import { type KtEnumValue, ktEnumValue } from './enum-value.ts';
import type { KtFunction } from './function.ts';
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
  | 'primaryConstructor'
  | 'implements'
  | 'body'
  | 'values'
  | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<KtDoc<TBuilder>>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    accessModifier?: Nullable<KtAccessModifier>;
    primaryConstructor?: Nullable<KtConstructor<TBuilder>>;
    implements?: Nullable<Nullable<KtType<TBuilder>>[]>;
    values?: Nullable<KtEnumValue<TBuilder>[]>;
    members?: Nullable<Nullable<KtEnumMember<TBuilder>>[]>;
    companionObject?: Nullable<KtObject<TBuilder>>;
  }
>;

/**
 * The nodes that can be written in the body of an enum class, after the entries. Other append values are written as-is.
 */
export type KtEnumMember<TBuilder extends SourceBuilder> =
  | KtConstructor<TBuilder>
  | KtEnum<TBuilder>
  | KtInitBlock<TBuilder>
  | KtInterface<TBuilder>
  | KtProperty<TBuilder>
  | KtFunction<TBuilder>
  | KtClass<TBuilder>
  | AppendValue<TBuilder>;

/**
 * Represents a Kotlin enum class, such as `enum class Color(val rgb: Int) { RED(0xFF0000) }`.
 *
 * Written in this order: the doc comment, annotations, the access modifier, `enum class`, the name, the primary
 * constructor, the implemented interfaces, then the body. The body holds the entries, which are followed by a semicolon
 * when members or a companion object are written after them.
 *
 * @template TBuilder The type of the source builder the enum is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktEnum
 */
export class KtEnum<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the enum class, written verbatim after `enum class`.
   */
  public name: string;
  /**
   * The KDoc comment written above the enum, or `null` to omit it. Descriptions of primary constructor parameters are
   * merged into it as `@param` tags.
   */
  public doc: KtDoc<TBuilder> | null;
  /**
   * The annotations written above the enum, each on its own line.
   */
  public annotations: KtAnnotation<TBuilder>[];
  /**
   * The visibility modifier written before `enum class`, or `null` to omit it. Kotlin declarations are public by
   * default, so `null` writes a public enum.
   */
  public accessModifier: KtAccessModifier | null;
  /**
   * The primary constructor written in parentheses after the name, or `null` to omit it. Its body is written as an
   * `init` block among the members.
   */
  public primaryConstructor: KtConstructor<TBuilder> | null;
  /**
   * The interfaces written after `:`, separated by commas. The clause is omitted when the list is empty.
   */
  public implements: KtType<TBuilder>[];
  /**
   * The entries written at the start of the body, separated by commas, in the given order. The body is omitted when
   * there are neither entries nor members.
   */
  public values: KtEnumValue<TBuilder>[];
  /**
   * The members written in the body after the entries, in the given order. Like class members, they are set off by
   * blank lines.
   */
  public members: KtEnumMember<TBuilder>[];
  /**
   * The companion object written first among the members, or `null` to omit it.
   */
  public companionObject: KtObject<TBuilder> | null;

  /**
   * Initializes a new instance of the KtEnum class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.accessModifier = options.accessModifier ?? null;
    this.primaryConstructor = options.primaryConstructor ?? null;
    this.implements = options.implements?.filter(notNullish) ?? [];
    this.values = options.values ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
    this.companionObject = options.companionObject ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    ktDoc.get(this.doc, { parameters: this.primaryConstructor?.parameters })?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    builder.append(this.inject.afterModifiers);

    builder.append('enum class ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.primaryConstructor) {
      builder.append(this.inject.beforePrimaryConstructor);
      this.primaryConstructor.writeAsPrimary(builder);
      builder.append(this.inject.afterPrimaryConstructor);
    }

    if (this.implements.length > 0) {
      builder.append(' : ');
      builder.append(this.inject.beforeImplements);
      writeKtNodes(builder, this.implements, { separator: ', ' });
      builder.append(this.inject.afterImplements);
    }

    const allMembers = [
      this.companionObject ? createOverwriteProxy(this.companionObject, { companion: true }) : null,
      this.primaryConstructor?.body ? ktInitBlock(this.primaryConstructor?.body) : null,
      ...this.members,
    ].filter(notNullish);

    if (this.values.length > 0 || allMembers.length > 0) {
      builder.append(' ');
      builder.append(this.inject.beforeBody);
      builder.parenthesize(
        '{}',
        (b) => {
          if (this.values.length > 0) {
            b.append(this.inject.beforeValues);
            ktEnumValue.write(b, this.values);
            if (allMembers.length > 0) {
              b.append(';\n\n');
            }
            b.append(this.inject.afterValues);
          }

          if (allMembers.length > 0) {
            b.append(this.inject.beforeMembers);
            writeKtMembers(b, allMembers);
            b.append(this.inject.afterMembers);
          }
        },
        { multiline: true },
      );
      builder.append(this.inject.afterBody);
    }

    builder.appendLine();
  }
}

const createEnum = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  values?: Options<TBuilder>['values'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'values'>>,
): KtEnum<TBuilder> => new KtEnum<TBuilder>({ ...options, name, values: values ?? undefined });

/**
 * Factory for creating enum class nodes. The `write` function writes one or more enum nodes to a builder.
 *
 * @param name The name of the enum class.
 * @param values The entries of the enum. See `KtEnum.values`.
 * @param options The settings of the enum. See `KtEnum` for the available properties.
 * @example
 * ```ts
 * ktEnum('Color', [ktEnumValue('RED', { arguments: ['0xFF0000'] })], {
 *   primaryConstructor: ktConstructor([ktParameter('rgb', 'Int')]),
 * });
 * // Emits:
 * // enum class Color(rgb: Int) {
 * //     RED(0xFF0000)
 * // }
 * ```
 */
export const ktEnum: typeof createEnum & { write: typeof writeKtNodes } = Object.assign(createEnum, {
  write: writeKtNodes,
});
