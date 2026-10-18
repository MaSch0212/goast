import { type AstNodeOptions, notNullish, type Nullable, type SourceBuilder } from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtNode, writeKtNodes } from '../utils/write-kt-node.ts';
import { ktParameter } from './parameter.ts';
import type { KtType } from './types.ts';

type Injects = 'extensionFor' | 'params' | 'returnType';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    extensionFor?: Nullable<KtType<TBuilder>>;
    parameters?: Nullable<Nullable<KtType<TBuilder>>[]>;
    returnType: KtType<TBuilder>;
    suspend?: boolean;
  }
>;

/**
 * Represents a Kotlin function type, such as `(Int, String) -> Boolean`.
 *
 * Written in this order: the `suspend` modifier, the receiver type followed by a dot, the parameter types in
 * parentheses, the arrow, then the return type.
 *
 * @template TBuilder The type of the source builder the lambda type is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktLambdaType
 */
export class KtLambdaType<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The receiver type written before the parameters, followed by a dot, such as `Foo.(Int) -> Unit`. `null` writes a
   * function type without a receiver.
   */
  public extensionFor: KtType<TBuilder> | null;
  /**
   * The parameter types written in parentheses, separated by commas. An empty list writes `()`. With more than two
   * types, each type is written on a line of its own.
   */
  public parameters: KtType<TBuilder>[];
  /**
   * The return type written after the arrow, such as `Unit` in `() -> Unit`.
   */
  public returnType: KtType<TBuilder>;
  /**
   * Whether the type is written with the `suspend` modifier in front, such as `suspend () -> Unit`.
   * @default false
   */
  public suspend: boolean;

  /**
   * Initializes a new instance of the KtLambdaType class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.extensionFor = options.extensionFor ?? null;
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.returnType = options.returnType;
    this.suspend = options.suspend ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.suspend) {
      builder.append('suspend ');
    }

    if (this.extensionFor) {
      builder.append(this.inject.beforeExtensionFor);
      writeKtNode(builder, this.extensionFor);
      builder.append(this.inject.afterExtensionFor);
      builder.append('.');
    }

    builder.append(this.inject.beforeParams);
    if (this.parameters.length === 0) {
      builder.append('()');
    } else {
      ktParameter.write(builder, this.parameters);
    }
    builder.append(this.inject.afterParams);

    builder.append(' -> ');

    builder.append(this.inject.beforeReturnType);
    writeKtNode(builder, this.returnType);
    builder.append(this.inject.afterReturnType);
  }
}

const createLambdaType = <TBuilder extends SourceBuilder>(
  parameters: Options<TBuilder>['parameters'],
  returnType: Options<TBuilder>['returnType'],
  options?: Omit<Options<TBuilder>, 'parameters' | 'returnType'>,
): KtLambdaType<TBuilder> => new KtLambdaType<TBuilder>({ ...options, parameters, returnType });

/**
 * Factory for creating lambda type nodes. The `write` function writes one or more lambda type nodes to a builder.
 *
 * @param parameters The types of the parameters, or `null` for none. An empty list writes `()`.
 * @param returnType The return type of the lambda type.
 * @param options The settings of the lambda type. See `KtLambdaType` for the available properties.
 * @example
 * ```ts
 * ktLambdaType(['Int'], 'Unit', { extensionFor: 'Foo' });
 * // Emits:
 * // Foo.(Int) -> Unit
 * ```
 */
export const ktLambdaType: typeof createLambdaType & { write: typeof writeKtNodes } = Object.assign(createLambdaType, {
  write: writeKtNodes,
});
