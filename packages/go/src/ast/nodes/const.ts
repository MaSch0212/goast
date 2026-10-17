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

/**
 * One constant of a `const` declaration, written as `Name Type = value`. The type is omitted when there is none, and
 * the doc comment, if any, is written above the constant.
 *
 * Written in this order: the doc comment, then the name, the type and the value, separated by spaces. Inside a
 * `const` block, `GoConst` aligns the names, types and values of all its specs like `gofmt` does.
 *
 * @template TBuilder The type of the source builder the constant is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goConstSpec
 */
export class GoConstSpec<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects
> {
  /**
   * The name of the constant.
   */
  public name: string;
  /**
   * The type of the constant, or `null` to write none so that Go infers it from the value.
   */
  public type: GoType<TBuilder> | null;
  /**
   * The value of the constant, written after ` = `.
   */
  public value: AppendValue<TBuilder> | GoNode<TBuilder>;
  /**
   * The doc comment written above the constant, or `null` for none.
   */
  public doc: GoDoc<TBuilder> | null;

  /**
   * Initializes a new instance of the GoConstSpec class.
   * @param options The options to use for this instance.
   */
  constructor(options: SpecOptions<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.type = options.type ?? null;
    this.value = options.value;
    this.doc = options.doc ?? null;
  }

  /**
   * The cells `gofmt` aligns: the name, the type (empty if there is none) and the value prefixed with `= `. `GoConst`
   * uses these cells to align the specs of a block.
   * @param builder The builder the type is rendered for, which resolves its imports.
   * @returns The cells of the row.
   */
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

/**
 * A `const ( ... )` declaration that groups one or more constant specs. The specs are aligned like `gofmt` aligns them,
 * and the doc comment of each spec is written above its line. Nothing is written when there are no specs.
 *
 * Written in this order: the doc comment, then `const (`, one line per spec, and `)`.
 *
 * @template TBuilder The type of the source builder the declaration is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goConst
 */
export class GoConst<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The constant specs of the block, in the order they are written. `null` entries are removed when the node is
   * created.
   */
  public specs: GoConstSpec<TBuilder>[];
  /**
   * The doc comment written above the declaration, or `null` for none.
   */
  public doc: GoDoc<TBuilder> | null;

  /**
   * Initializes a new instance of the GoConst class.
   * @param options The options to use for this instance.
   */
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

/**
 * Factory for creating constant spec nodes. The `write` function writes one or more constant specs to a builder.
 *
 * @param name The name of the constant.
 * @param value The value of the constant, written after ` = `.
 * @param options The settings of the constant spec. See `GoConstSpec` for the available properties.
 * @example
 * ```ts
 * goConstSpec('Answer', '42', { type: goReference('int'), doc: goDoc('The answer.') });
 * // Emits:
 * // // The answer.
 * // Answer int = 42
 * ```
 */
export const goConstSpec: typeof createConstSpec & { write: typeof writeGoNodes } = Object.assign(createConstSpec, {
  write: writeGoNodes,
});

/**
 * Factory for creating const declaration nodes. The `write` function writes one or more const declarations to a
 * builder.
 *
 * @param specs The constant specs of the block. `null` entries are skipped.
 * @param options The settings of the declaration. See `GoConst` for the available properties.
 * @example
 * ```ts
 * goConst([
 *   goConstSpec('PetStatusAvailable', goString('available'), { type: goReference('PetStatus') }),
 *   goConstSpec('PetStatusSold', goString('sold'), { type: goReference('PetStatus') }),
 * ]);
 * // Emits:
 * // const (
 * // 	PetStatusAvailable PetStatus = "available"
 * // 	PetStatusSold      PetStatus = "sold"
 * // )
 * ```
 */
export const goConst: typeof createConst & { write: typeof writeGoNodes } = Object.assign(createConst, {
  write: writeGoNodes,
});
