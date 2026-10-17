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

/** A struct type: `struct { ... }`, with the fields aligned like `gofmt` aligns them. */
export class GoStruct<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public fields: GoField<TBuilder>[];

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

export const goStruct: typeof createStruct & { write: typeof writeGoNodes } = Object.assign(createStruct, {
  write: writeGoNodes,
});
