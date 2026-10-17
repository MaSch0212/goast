import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import type { TsType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    keyName?: Nullable<string>;
    keyType: TsType<TBuilder>;
    valueType: TsType<TBuilder>;
    readonly?: Nullable<boolean>;
  }
>;

/**
 * Represents an index signature, such as `readonly [key: string]: number;`.
 *
 * Written in this order: the `readonly` keyword when set, the key in square brackets as `name: keyType`, then
 * `: valueType;`. The signature is followed by a line break. It is used as a member of an interface or a class.
 *
 * @template TBuilder The type of the source builder the index signature is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsIndexer
 */
export class TsIndexer<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the key parameter, written before the key type, such as `id` in `[id: string]`.
   * @default 'key'
   */
  public keyName: string;
  /**
   * The type of the keys, written after the key name in square brackets, such as `string`.
   */
  public keyType: TsType<TBuilder>;
  /**
   * The type of the values, written after the closing bracket, such as `number` in `: number;`.
   */
  public valueType: TsType<TBuilder>;
  /**
   * Whether the signature is written with the `readonly` keyword in front of it.
   * @default false
   */
  public readonly: boolean;

  /**
   * Initializes a new instance of the TsIndexer class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.keyName = options.keyName ?? 'key';
    this.keyType = options.keyType;
    this.valueType = options.valueType;
    this.readonly = options.readonly ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.readonly) builder.append('readonly ');

    builder.parenthesize('[]', (b) => {
      b.append(this.keyName, ': ');
      writeTsNode(b, this.keyType);
    });

    builder.append(': ');
    writeTsNode(builder, this.valueType);
    builder.append(';');

    builder.appendLine();
  }
}

const createIndexer = <TBuilder extends SourceBuilder>(
  keyType: Options<TBuilder>['keyType'],
  valueType: Options<TBuilder>['valueType'],
  options?: Prettify<Omit<Options<TBuilder>, 'keyType' | 'valueType'>>,
): TsIndexer<TBuilder> => new TsIndexer<TBuilder>({ ...options, keyType, valueType });

/**
 * Factory for creating index signature nodes. The `write` function writes one or more index signatures to a builder.
 *
 * @param keyType The type of the keys.
 * @param valueType The type of the values.
 * @param options The settings of the index signature. See `TsIndexer` for the available properties.
 * @example
 * ```ts
 * tsIndexer('string', 'number', { keyName: 'id', readonly: true });
 * // Emits:
 * // readonly [id: string]: number;
 * ```
 */
export const tsIndexer: typeof createIndexer & { write: typeof writeTsNodes } = Object.assign(createIndexer, {
  write: writeTsNodes,
});
