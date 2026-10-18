import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { toGoStructTag } from '../../utils.ts';
import { GoNode } from '../node.ts';
import { renderGoNode, writeGoNode, writeGoNodes } from '../utils/write-go-node.ts';
import type { GoDoc } from './doc.ts';
import type { GoType } from './types.ts';

type Injects = never;

/**
 * The key/value pairs of a struct tag, such as `[['json', 'id,omitempty']]`. They are written as one tag literal,
 * `` `json:"id,omitempty"` ``.
 */
export type GoStructTagEntries = [key: string, value: string][];

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    /** The field name, `null` for an embedded field. */
    name: Nullable<string>;
    type: GoType<TBuilder>;
    doc?: Nullable<GoDoc<TBuilder>>;
    /** The struct tag, as key/value pairs (e.g. `[['json', 'id,omitempty']]`) or as the literal including quotes. */
    tag?: Nullable<GoStructTagEntries | string>;
  }
>;

/**
 * A field of a struct type, written as its name, its type and an optional struct tag. An embedded field has no name and
 * is written as its type only. Written by `GoStruct`, which aligns the fields like `gofmt`.
 *
 * Written in this order: the doc comment, on lines of its own above the field, then the name (if any), the type and
 * the tag (if any), separated by spaces.
 *
 * @template TBuilder The type of the source builder the field is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goField
 */
export class GoField<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the field, or `null` for an embedded field.
   */
  public name: string | null;
  /**
   * The type of the field.
   */
  public type: GoType<TBuilder>;
  /**
   * The doc comment written above the field, or `null` for none.
   */
  public doc: GoDoc<TBuilder> | null;
  /**
   * The struct tag, as key/value pairs or as a literal including the backticks. `null`, or an empty list of entries,
   * writes no tag.
   */
  public tag: GoStructTagEntries | string | null;

  /**
   * Initializes a new instance of the GoField class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name ?? null;
    this.type = options.type;
    this.doc = options.doc ?? null;
    this.tag = options.tag ?? null;
  }

  /**
   * The tag literal, including the backticks, or `null` if the field has none.
   */
  public getTagLiteral(): string | null {
    if (this.tag === null) return null;
    if (typeof this.tag === 'string') return this.tag;
    return this.tag.length > 0 ? toGoStructTag(this.tag) : null;
  }

  /**
   * The cells `gofmt` aligns: the name (unless embedded), the type and the tag (if any). `GoStruct` uses these cells to
   * align the fields of a struct.
   * @param builder The builder the type is rendered for, which resolves its imports.
   * @returns The cells of the row.
   */
  public getCells(builder: TBuilder): string[] {
    const tag = this.getTagLiteral();
    return [this.name, renderGoNode(builder, this.type), tag].filter((x): x is string => x !== null);
  }

  protected override onWrite(builder: TBuilder): void {
    this.doc?.write(builder);
    if (this.name) builder.append(this.name, ' ');
    writeGoNode(builder, this.type);
    const tag = this.getTagLiteral();
    if (tag) builder.append(' ', tag);
  }
}

const createField = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  type: Options<TBuilder>['type'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'type'>>,
): GoField<TBuilder> => new GoField<TBuilder>({ ...options, name, type });

/**
 * Factory for creating struct field nodes. The `write` function writes one or more struct fields to a builder.
 *
 * @param name The name of the field, or `null` for an embedded field.
 * @param type The type of the field.
 * @param options The settings of the field. See `GoField` for the available properties.
 * @example
 * ```ts
 * goField('ID', goReference('string'), { tag: [['json', 'id']] });
 * // Emits:
 * // ID string `json:"id"`
 * ```
 */
export const goField: typeof createField & { write: typeof writeGoNodes } = Object.assign(createField, {
  write: writeGoNodes,
});
