import {
  type AppendValue,
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtEnumValues } from '../utils/write-kt-enum-values.ts';
import { writeKtMembers } from '../utils/write-kt-members.ts';
import { type KtAnnotation, ktAnnotation } from './annotation.ts';
import { type KtArgument, ktArgument } from './argument.ts';
import type { KtDoc } from './doc.ts';
import type { KtFunction } from './function.ts';
import type { KtParameter } from './parameter.ts';

type Injects = 'doc' | 'annotations' | 'name' | 'arguments' | 'body' | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<KtDoc<TBuilder>>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    arguments?: Nullable<Nullable<KtArgument<TBuilder> | AppendValue<TBuilder>>[]>;
    members?: Nullable<Nullable<KtEnumValueMember<TBuilder>>[]>;
  }
>;

/**
 * The nodes that can be written in the body of an enum value. Other append values are written as-is.
 */
export type KtEnumValueMember<TBuilder extends SourceBuilder> =
  | KtParameter<TBuilder>
  | KtFunction<TBuilder>
  | AppendValue<TBuilder>;

/**
 * Represents a single value, also called an entry, of a Kotlin enum class, such as `RED(0xFF0000)`.
 *
 * Written in this order: the doc comment, annotations, the name, the arguments in parentheses, then the members in
 * braces.
 *
 * @template TBuilder The type of the source builder the enum value is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktEnumValue
 */
export class KtEnumValue<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the entry, written verbatim.
   */
  public name: string;
  /**
   * The KDoc comment written above the entry, or `null` to omit it.
   */
  public doc: KtDoc<TBuilder> | null;
  /**
   * The annotations written above the entry, each on its own line.
   */
  public annotations: KtAnnotation<TBuilder>[];
  /**
   * The arguments written in parentheses after the name, such as `(0, 1)`. They are passed to the primary
   * constructor of the enum. Nothing is written when the list is empty.
   */
  public arguments: (KtArgument<TBuilder> | AppendValue<TBuilder>)[];
  /**
   * The members written in braces after the entry, such as functions that only this entry overrides. The braces are
   * omitted when there are no members.
   */
  public members: KtEnumValueMember<TBuilder>[];

  /**
   * Initializes a new instance of the KtEnumValue class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.arguments = options.arguments?.filter(notNullish) ?? [];
    this.members = options.members?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    this.doc?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.arguments.length > 0) {
      builder.append(this.inject.beforeArguments);
      ktArgument.write(builder, this.arguments);
      builder.append(this.inject.afterArguments);
    }

    if (this.members.length > 0) {
      builder.append(' ');
      builder.append(this.inject.beforeBody);
      builder.parenthesize(
        '{}',
        (b) => {
          builder.append(this.inject.beforeMembers);
          writeKtMembers(b, this.members);
          builder.append(this.inject.afterMembers);
        },
        { multiline: true },
      );
      builder.append(this.inject.afterBody);
    }
  }
}

const createEnumValue = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): KtEnumValue<TBuilder> => new KtEnumValue<TBuilder>({ ...options, name });

/**
 * Factory for creating enum value nodes. The `write` function writes a list of enum values, separated by commas.
 * The list is written with one value per line when there are more than four values, or when any value has arguments,
 * a doc comment, annotations or members. Blank lines separate the values when any value has a doc comment, annotations
 * or members.
 *
 * @param name The name of the entry, written verbatim.
 * @param options The settings of the entry. See `KtEnumValue` for the available properties.
 * @example
 * ```ts
 * ktEnumValue('ADMIN', { annotations: [ktAnnotation('Deprecated')], arguments: ['"admin"'] });
 * // Emits:
 * // @Deprecated
 * // ADMIN("admin")
 * ```
 */
export const ktEnumValue: typeof createEnumValue & { write: typeof writeKtEnumValues } = Object.assign(
  createEnumValue,
  {
    write: writeKtEnumValues,
  },
);
