import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { toGoStructTag } from '../../utils.ts';
import { GoNode } from '../node.ts';
import { renderGoNode, writeGoNode, writeGoNodes } from '../utils/write-go-node.ts';
import type { GoDoc } from './doc.ts';
import type { GoType } from './types.ts';

type Injects = never;

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

/** A field of a struct type. Written by `GoStruct`, which aligns the fields like `gofmt`. */
export class GoField<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string | null;
  public type: GoType<TBuilder>;
  public doc: GoDoc<TBuilder> | null;
  public tag: GoStructTagEntries | string | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name ?? null;
    this.type = options.type;
    this.doc = options.doc ?? null;
    this.tag = options.tag ?? null;
  }

  /** The tag literal, `null` if the field has none. */
  public getTagLiteral(): string | null {
    if (this.tag === null) return null;
    if (typeof this.tag === 'string') return this.tag;
    return this.tag.length > 0 ? toGoStructTag(this.tag) : null;
  }

  /** The cells `gofmt` aligns: name (unless embedded), type and tag (if any). */
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

export const goField: typeof createField & { write: typeof writeGoNodes } = Object.assign(createField, {
  write: writeGoNodes,
});
