import { type AstNodeOptions, type BasicAppendValue, notNullish, type Nullable, type SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';
import { type TsGenericParameter, tsGenericParameter } from './generic-parameter.ts';
import { type TsParameter, tsParameter } from './parameter.ts';
import type { TsType } from './types.ts';

type Injects = 'generics' | 'params' | 'returnType';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    parameters?: Nullable<Nullable<TsParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    returnType?: Nullable<TsType<TBuilder>>;
  }
>;

/**
 * Represents a function type, such as `(x: number) => string`.
 *
 * Written in this order: the generics, the parameters in parentheses, ` => `, then the return type. The return type is
 * written as `void` when it is not set.
 *
 * @template TBuilder The type of the source builder the function type is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsFunctionType
 */
export class TsFunctionType<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The type parameters written in angle brackets before the parameters, such as `<T, U>`. Nothing is written when
   * there are none.
   */
  public generics: (TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The parameters written in parentheses, such as `(x, y)`. More than two parameters are written one per line.
   */
  public parameters: (TsParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The return type written after ` => `, or `void` when it is `null`.
   */
  public returnType: TsType<TBuilder> | null;

  /**
   * Initializes a new instance of the TsFunctionType class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.returnType = options.returnType ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeGenerics);
    tsGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    builder.append(this.inject.beforeParams);
    tsParameter.write(builder, this.parameters);
    builder.append(this.inject.afterParams);

    builder.append(' => ');

    builder.append(this.inject.beforeReturnType);
    writeTsNode(builder, this.returnType ?? 'void');
    builder.append(this.inject.afterReturnType);
  }
}

const createFunctionType = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>): TsFunctionType<TBuilder> =>
  new TsFunctionType<TBuilder>(options ?? {});

/**
 * Factory for creating function type nodes. The `write` function writes one or more function types to a builder.
 *
 * @param options The settings of the function type. See `TsFunctionType` for the available properties.
 * @example
 * ```ts
 * tsFunctionType({ parameters: [tsParameter('x', { type: 'number' })], returnType: 'string' });
 * // Emits:
 * // (x: number) => string
 * ```
 */
export const tsFunctionType: typeof createFunctionType & { write: typeof writeTsNodes } = Object.assign(
  createFunctionType,
  {
    write: writeTsNodes,
  },
);
