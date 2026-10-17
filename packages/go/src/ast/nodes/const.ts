import {
  type AppendValue,
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { alignCells } from '../../align.ts';
import { GoNode } from '../node.ts';
import { renderGoNode, writeGoNodes } from '../utils/write-go-node.ts';
import type { GoDoc } from './doc.ts';
import type { GoType } from './types.ts';

type SpecOptions<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects>,
  {
    name: string;
    type?: Nullable<GoType<TBuilder>>;
    value: AppendValue<TBuilder> | GoNode<TBuilder>;
    doc?: Nullable<GoDoc<TBuilder>>;
  }
>;

/** One constant of a `const` declaration: `Name Type = value`. */
export class GoConstSpec<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects
> {
  public name: string;
  public type: GoType<TBuilder> | null;
  public value: AppendValue<TBuilder> | GoNode<TBuilder>;
  public doc: GoDoc<TBuilder> | null;

  constructor(options: SpecOptions<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.type = options.type ?? null;
    this.value = options.value;
    this.doc = options.doc ?? null;
  }

  /** The cells `gofmt` aligns: name, type (empty if there is none) and value. */
  public getCells(builder: TBuilder): string[] {
    return [
      this.name,
      this.type === null ? '' : renderGoNode(builder, this.type),
      `= ${renderGoNode(builder, this.value)}`,
    ];
  }

  protected override onWrite(builder: TBuilder): void {
    this.doc?.write(builder);
    builder.append(
      this.getCells(builder)
        .filter((x) => x !== '')
        .join(' '),
    );
  }
}

type Injects = 'specs';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    specs: Nullable<GoConstSpec<TBuilder>>[];
    doc?: Nullable<GoDoc<TBuilder>>;
  }
>;

/** A `const ( ... )` declaration, with the specs aligned like `gofmt` aligns them. */
export class GoConst<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public specs: GoConstSpec<TBuilder>[];
  public doc: GoDoc<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.specs = options.specs.filter(notNullish);
    this.doc = options.doc ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.specs.length === 0) return;
    this.doc?.write(builder);
    builder.parenthesize(
      ['const (', ')'],
      (b) => {
        b.append(this.inject.beforeSpecs);
        const lines = this.specs.flatMap((spec) => [
          ...(spec.doc?.toLines() ?? []).map((line) => [line]),
          spec.getCells(b),
        ]);
        for (const line of alignCells(lines)) b.appendLine(line);
        b.append(this.inject.afterSpecs);
      },
      { multiline: true },
    );
    builder.appendLine();
  }
}

const createConstSpec = <TBuilder extends SourceBuilder>(
  name: SpecOptions<TBuilder>['name'],
  value: SpecOptions<TBuilder>['value'],
  options?: Prettify<Omit<SpecOptions<TBuilder>, 'name' | 'value'>>,
): GoConstSpec<TBuilder> => new GoConstSpec<TBuilder>({ ...options, name, value });

const createConst = <TBuilder extends SourceBuilder>(
  specs: Options<TBuilder>['specs'],
  options?: Prettify<Omit<Options<TBuilder>, 'specs'>>,
): GoConst<TBuilder> => new GoConst<TBuilder>({ ...options, specs });

export const goConstSpec: typeof createConstSpec & { write: typeof writeGoNodes } = Object.assign(createConstSpec, {
  write: writeGoNodes,
});

export const goConst: typeof createConst & { write: typeof writeGoNodes } = Object.assign(createConst, {
  write: writeGoNodes,
});
