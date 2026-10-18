import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsDoc } from './doc.ts';
import { type TsEnumValue, tsEnumValue } from './enum-value.ts';

type Injects = 'doc' | 'modifiers' | 'name' | 'body' | 'members';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    doc?: Nullable<TsDoc<TBuilder>>;
    export?: Nullable<boolean>;
    const?: Nullable<boolean>;
    name: string;
    members?: Nullable<Nullable<TsEnumValue<TBuilder>>[]>;
  }
>;

/**
 * Represents an enum declaration.
 *
 * Written in this order: the doc comment, the `export` and `const` keywords, then `enum`, the name, and the members in
 * braces, followed by a line break.
 *
 * @template TBuilder The type of the source builder the enum is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsEnum
 */
export class TsEnum<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The doc comment written above the enum, or `null` to omit it.
   */
  public doc: TsDoc<TBuilder> | null;
  /**
   * Whether the enum is written with the `export` keyword.
   * @default false
   */
  public export: boolean;
  /**
   * Whether the enum is written as a `const enum`. The `const` keyword is placed after `export` when both are set.
   * @default false
   */
  public const: boolean;
  /**
   * The name of the enum, written after the `enum` keyword.
   */
  public name: string;
  /**
   * The members written in the body, one per line and separated by commas. The last member has no trailing comma, and
   * the braces are written empty when there are no members.
   */
  public members: TsEnumValue<TBuilder>[];

  /**
   * Initializes a new instance of the TsEnum class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.doc = options.doc ?? null;
    this.export = options.export ?? false;
    this.const = options.const ?? false;
    this.name = options.name;
    this.members = options.members?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDoc);
    this.doc?.write(builder);
    builder.append(this.inject.afterDoc);

    builder.append(this.inject.beforeModifiers);
    if (this.export) builder.append('export ');
    if (this.const) builder.append('const ');
    builder.append(this.inject.afterModifiers);

    builder.append('enum ');
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);
    builder.append(' ');

    builder.append(this.inject.beforeBody);
    builder.parenthesize(
      '{}',
      (b) => {
        b.append(this.inject.beforeMembers);
        tsEnumValue.write(b, this.members);
        b.append(this.inject.afterMembers);
      },
      { multiline: this.members.length > 0 },
    );
    builder.append(this.inject.afterBody);

    builder.appendLine();
  }
}

const createEnum = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): TsEnum<TBuilder> => new TsEnum<TBuilder>({ ...options, name });

/**
 * Factory for creating enum nodes. The `write` function writes one or more enums to a builder.
 *
 * @param name The name of the enum.
 * @param options The settings of the enum. See `TsEnum` for the available properties.
 * @example
 * ```ts
 * tsEnum('Color', { export: true, members: [tsEnumValue('Red'), tsEnumValue('Green')] });
 * // Emits:
 * // export enum Color {
 * //   Red,
 * //   Green
 * // }
 * ```
 */
export const tsEnum: typeof createEnum & { write: typeof writeTsNodes } = Object.assign(createEnum, {
  write: writeTsNodes,
});
