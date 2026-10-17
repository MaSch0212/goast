import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    types: Nullable<TsType<TBuilder>>[];
  }
>;

/**
 * Represents an intersection type, which combines several types with `&`, such as `(string) & (number)`.
 *
 * Each type is wrapped in parentheses. Nested intersection types are flattened into the same list. An intersection
 * without types is written as `unknown`, and one with a single type is written as that type without parentheses.
 * Intersections of more than three types are written with one type per line, and each line starts with `&`.
 *
 * @template TBuilder The type of the source builder the intersection type is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsIntersectionType
 */
export class TsIntersectionType<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The types that are combined, in the given order. Null entries are skipped. Nested intersection types are
   * flattened into this list when the node is written, so they add no nested parentheses.
   */
  public types: TsType<TBuilder>[];

  /**
   * Initializes a new instance of the TsIntersectionType class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.types = options.types.filter(notNullish);
  }

  protected override onWrite(builder: TBuilder): void {
    const types = this.types.length === 0 ? ['unknown'] : resolveNestedIntersectionTypes(this);
    if (types.length === 1) {
      writeTsNode(builder, types[0]);
    } else {
      const multiline = types.length > 3;
      if (multiline) {
        builder.appendLine().append('& ');
      }
      builder.forEach(types, (b, t) => b.parenthesize('()', (b) => writeTsNode(b, t)), {
        separator: multiline ? '\n& ' : ' & ',
      });
    }
  }
}

const createIntersectionType = <TBuilder extends SourceBuilder>(
  types: Options<TBuilder>['types'],
  options?: Prettify<Omit<Options<TBuilder>, 'types'>>,
): TsIntersectionType<TBuilder> => new TsIntersectionType<TBuilder>({ ...options, types });

/**
 * Factory for creating intersection type nodes. The `write` function writes one or more intersection type nodes to a
 * builder.
 *
 * @param types The types to combine. See `TsIntersectionType.types` for how they are written.
 * @param options The settings of the intersection type. See `TsIntersectionType` for the available properties.
 * @example
 * ```ts
 * tsIntersectionType(['string', 'number']);
 * // Emits:
 * // (string) & (number)
 * ```
 */
export const tsIntersectionType: typeof createIntersectionType & { write: typeof writeTsNodes } = Object.assign(
  createIntersectionType,
  {
    write: writeTsNodes,
  },
);

function resolveNestedIntersectionTypes<TBuilder extends SourceBuilder>(
  node: TsIntersectionType<TBuilder>,
): TsType<TBuilder>[] {
  const types: TsType<TBuilder>[] = [];
  for (const type of node.types) {
    if (type instanceof TsIntersectionType) {
      types.push(...resolveNestedIntersectionTypes(type));
    } else {
      types.push(type);
    }
  }
  return types;
}
