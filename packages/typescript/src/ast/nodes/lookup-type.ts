import type { AstNodeOptions, SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsType } from './types.ts';

type Injects = 'type' | 'index';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    type: TsType<TBuilder>;
    index: TsType<TBuilder>;
  }
>;

/**
 * Represents an indexed access type, which looks up the type of one member of another type, such as `(Foo)['bar']`.
 *
 * Both parts are wrapped in parentheses. The `type` is written first, followed by the `index` in square brackets. The
 * injection points `beforeType` and `afterType` wrap the type, and `beforeIndex` and `afterIndex` wrap the index.
 *
 * @template TBuilder The type of the source builder the indexed access type is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsLookupType
 */
export class TsLookupType<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The type whose member is looked up. It is written in parentheses before the index, such as `(Foo)`.
   */
  public type: TsType<TBuilder>;
  /**
   * The index type or key that selects the member. It is written in square brackets after the type, such as `['bar']`.
   * A plain string is written as it is, so the quotes of a string literal have to be part of the string.
   */
  public index: TsType<TBuilder>;

  /**
   * Initializes a new instance of the TsLookupType class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.type = options.type;
    this.index = options.index;
  }

  protected override onWrite(builder: TBuilder): void {
    builder
      .parenthesize('()', (b) => {
        b.append(this.inject.beforeType);
        writeTsNode(b, this.type);
        b.append(this.inject.afterType);
      })
      .parenthesize('[]', (b) => {
        b.append(this.inject.beforeIndex);
        writeTsNode(b, this.index);
        b.append(this.inject.afterIndex);
      });
  }
}

const createLookupType = <TBuilder extends SourceBuilder>(
  type: Options<TBuilder>['type'],
  index: Options<TBuilder>['index'],
  options?: Omit<Options<TBuilder>, 'type' | 'index'>,
): TsLookupType<TBuilder> => new TsLookupType<TBuilder>({ ...options, type, index });

/**
 * Factory for creating indexed access type nodes. The `write` function writes one or more of them to a builder.
 *
 * @param type The type whose member is looked up. See `TsLookupType.type`.
 * @param index The index type or key. See `TsLookupType.index`.
 * @param options The settings of the indexed access type. See `TsLookupType` for the available properties.
 * @example
 * ```ts
 * tsLookupType('Foo', "'bar'");
 * // Emits:
 * // (Foo)['bar']
 * ```
 */
export const tsLookupType: typeof createLookupType & { write: typeof writeTsNodes } = Object.assign(createLookupType, {
  write: writeTsNodes,
});
