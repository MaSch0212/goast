import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { alignCells } from '../../align.ts';
import { GoNode } from '../node.ts';
import { writeGoNodes } from '../utils/write-go-node.ts';
import type { GoField } from './field.ts';

type Injects = 'fields';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    fields?: Nullable<Nullable<GoField<TBuilder>>[]>;
  }
>;

/**
 * A struct type, written as `struct { ... }`. Each field is written on a line of its own, indented by a tab, and the
 * names, types and tags are aligned like `gofmt` aligns them. The doc comment of a field is written above it, and it
 * restarts the alignment. Without fields, the struct is written on one line as `struct{}`.
 *
 * @template TBuilder The type of the source builder the struct type is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goStruct
 */
export class GoStruct<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The fields of the struct, in order. Each field is written on its own line.
   */
  public fields: GoField<TBuilder>[];

  /**
   * Initializes a new instance of the GoStruct class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.fields = options.fields?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.fields.length === 0 && !this.inject.beforeFields && !this.inject.afterFields) {
      builder.append('struct{}');
      return;
    }

    builder.parenthesize(
      ['struct {', '}'],
      (b) => {
        b.append(this.inject.beforeFields);
        // Doc comment lines are single cells, so they end the column blocks around them, as they do in `gofmt`.
        // A field spanning several lines (e.g. of an anonymous struct type) is written as one cell for the same
        // effect.
        const lines = this.fields.flatMap((field) => {
          const cells = field.getCells(b);
          return [
            ...(field.doc?.toLines() ?? []).map((line) => [line]),
            cells.some((x) => x.includes('\n')) ? [cells.join(' ')] : cells,
          ];
        });
        for (const line of alignCells(lines)) b.appendLine(line);
        b.append(this.inject.afterFields);
      },
      { multiline: true },
    );
  }
}

const createStruct = <TBuilder extends SourceBuilder>(
  fields?: Options<TBuilder>['fields'],
  options?: Prettify<Omit<Options<TBuilder>, 'fields'>>,
): GoStruct<TBuilder> => new GoStruct<TBuilder>({ ...options, fields });

/**
 * Factory for creating struct nodes. The `write` function writes one or more struct nodes to a builder.
 *
 * @param fields The fields of the struct, in order. Nullish entries are skipped.
 * @param options The settings of the struct. See `GoStruct` for the available properties.
 * @example
 * ```ts
 * goStruct([
 *   goField('ID', refs.string(), { tag: [['json', 'id']] }),
 *   goField('Tags', goSlice(refs.string()), { tag: [['json', 'tags,omitempty']] }),
 * ]);
 * // Emits:
 * // struct {
 * // 	ID   string   `json:"id"`
 * // 	Tags []string `json:"tags,omitempty"`
 * // }
 * ```
 */
export const goStruct: typeof createStruct & { write: typeof writeGoNodes } = Object.assign(createStruct, {
  write: writeGoNodes,
});
