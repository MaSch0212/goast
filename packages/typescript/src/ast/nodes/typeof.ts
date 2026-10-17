import type { AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsValue } from './types.ts';

type Injects = 'value';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    value: TsValue<TBuilder>;
  }
>;

/**
 * Represents a `typeof` type query, which takes the type of a value, such as `typeof foo`.
 *
 * Written as the keyword `typeof` followed by the value. The injection points `beforeValue` and `afterValue` wrap the
 * value.
 *
 * @template TBuilder The type of the source builder the type query is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsTypeof
 */
export class TsTypeof<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The value whose type is queried, written after `typeof`, such as `foo`.
   */
  public value: TsValue<TBuilder>;

  /**
   * Initializes a new instance of the TsTypeof class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.value = options.value;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('typeof ');
    builder.append(this.inject.beforeValue);
    writeTsNode(builder, this.value);
    builder.append(this.inject.afterValue);
  }
}

/**
 * Creates a `typeof` type query node. This is the function that `tsTypeof` wraps, and `tsTypeof` also provides `write`.
 *
 * @param value The value whose type is queried. See `TsTypeof.value`.
 * @param options The settings of the type query. See `TsTypeof` for the available properties.
 * @example
 * ```ts
 * createTypeof('foo');
 * // Emits:
 * // typeof foo
 * ```
 */
export const createTypeof = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Omit<Options<TBuilder>, 'value'>,
): TsTypeof<TBuilder> => new TsTypeof<TBuilder>({ ...options, value });

/**
 * Factory for creating `typeof` type query nodes. The `write` function writes one or more of them to a builder.
 *
 * @param value The value whose type is queried. See `TsTypeof.value`.
 * @param options The settings of the type query. See `TsTypeof` for the available properties.
 * @example
 * ```ts
 * tsTypeof('foo');
 * // Emits:
 * // typeof foo
 * ```
 */
export const tsTypeof: typeof createTypeof & { write: typeof writeTsNodes } = Object.assign(createTypeof, {
  write: writeTsNodes,
});
