import type { AstNodeOptions, Prettify, SourceBuilder } from '@goast/core';

import { GoNode } from '../node.ts';
import { writeGoNode, writeGoNodes } from '../utils/write-go-node.ts';
import type { GoType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    keyType: GoType<TBuilder>;
    valueType: GoType<TBuilder>;
  }
>;

/**
 * A map type, written as `map[K]V`.
 *
 * @template TBuilder The type of the source builder the map type is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goMap
 */
export class GoMap<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The type of the keys, written between the brackets.
   */
  public keyType: GoType<TBuilder>;
  /**
   * The type of the values, written after the closing bracket.
   */
  public valueType: GoType<TBuilder>;

  /**
   * Initializes a new instance of the GoMap class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.keyType = options.keyType;
    this.valueType = options.valueType;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('map[');
    writeGoNode(builder, this.keyType);
    builder.append(']');
    writeGoNode(builder, this.valueType);
  }
}

const createMap = <TBuilder extends SourceBuilder>(
  keyType: Options<TBuilder>['keyType'],
  valueType: Options<TBuilder>['valueType'],
  options?: Prettify<Omit<Options<TBuilder>, 'keyType' | 'valueType'>>,
): GoMap<TBuilder> => new GoMap<TBuilder>({ ...options, keyType, valueType });

/**
 * Factory for creating map type nodes. The `write` function writes one or more map types to a builder.
 *
 * @param keyType The type of the keys.
 * @param valueType The type of the values.
 * @param options The settings of the map type. See `GoMap` for the available properties.
 * @example
 * ```ts
 * goMap(goReference('string'), goReference('Pet'));
 * // Emits:
 * // map[string]Pet
 * ```
 */
export const goMap: typeof createMap & { write: typeof writeGoNodes } = Object.assign(createMap, {
  write: writeGoNodes,
});
