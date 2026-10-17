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
 * Represents a union type, which combines alternative types with `|`, such as `(string) | (number)`.
 *
 * Each type is wrapped in parentheses. Nested union types are flattened into the same list. A union without types is
 * written as `never`, and one with a single type is written as that type without parentheses. Unions of more than three
 * types are written with one type per line, and each line starts with `|`.
 *
 * @template TBuilder The type of the source builder the union type is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsUnionType
 */
export class TsUnionType<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The alternative types, in the given order. Null entries are skipped. Nested union types are flattened into this
   * list when the node is written, so they add no nested parentheses.
   */
  public types: TsType<TBuilder>[];

  /**
   * Initializes a new instance of the TsUnionType class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.types = options.types.filter(notNullish);
  }

  protected override onWrite(builder: TBuilder): void {
    const types = this.types.length === 0 ? ['never'] : resolveNestedUnionTypes(this);
    if (types.length === 1) {
      writeTsNode(builder, types[0]);
    } else {
      const multiline = types.length > 3;
      if (multiline) {
        builder.appendLine().append('| ');
      }
      builder.forEach(types, (b, t) => b.parenthesize('()', (b) => writeTsNode(b, t)), {
        separator: multiline ? '\n| ' : ' | ',
      });
    }
  }
}

const createUnionType = <TBuilder extends SourceBuilder>(
  types: Options<TBuilder>['types'],
  options?: Prettify<Omit<Options<TBuilder>, 'types'>>,
): TsUnionType<TBuilder> => new TsUnionType<TBuilder>({ ...options, types });

/**
 * Factory for creating union type nodes. The `write` function writes one or more union type nodes to a builder.
 *
 * @param types The alternative types. See `TsUnionType.types` for how they are written.
 * @param options The settings of the union type. See `TsUnionType` for the available properties.
 * @example
 * ```ts
 * tsUnionType(['string', 'number']);
 * // Emits:
 * // (string) | (number)
 * ```
 */
export const tsUnionType: typeof createUnionType & { write: typeof writeTsNodes } = Object.assign(createUnionType, {
  write: writeTsNodes,
});

function resolveNestedUnionTypes<TBuilder extends SourceBuilder>(node: TsUnionType<TBuilder>): TsType<TBuilder>[] {
  const types: TsType<TBuilder>[] = [];
  for (const type of node.types) {
    if (type instanceof TsUnionType) {
      types.push(...resolveNestedUnionTypes(type));
    } else {
      types.push(type);
    }
  }
  return types;
}
