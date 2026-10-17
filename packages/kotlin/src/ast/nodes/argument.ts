import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtArguments } from '../utils/write-kt-arguments.ts';
import { writeKtNode } from '../utils/write-kt-node.ts';
import type { KtValue } from './types.ts';

type Injects = 'name' | 'value';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name?: Nullable<string>;
    value: KtValue<TBuilder>;
  }
>;

/**
 * Represents an argument that is passed to a call or an annotation, such as `42` or `timeout = 30`.
 *
 * Written in this order: the name followed by ` = ` when a name is set, then the value.
 *
 * @template TBuilder The type of the source builder the argument is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktArgument
 */
export class KtArgument<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the parameter that the value is passed to, written before ` = ` to pass the value by name. `null` or an
   * empty name passes the value by position instead.
   */
  public name: string | null;
  /**
   * The value of the argument. A string is written verbatim, while other nodes write their own Kotlin code.
   */
  public value: KtValue<TBuilder>;

  /**
   * Initializes a new instance of the KtArgument class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options?.name ?? null;
    this.value = options.value;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.name) {
      builder.append(this.inject.beforeName);
      builder.append(this.name);
      builder.append(this.inject.afterName);
      builder.append(' = ');
    }

    builder.append(this.inject.beforeValue);
    writeKtNode(builder, this.value);
    builder.append(this.inject.afterValue);
  }
}

const createArgument = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value'>>,
): KtArgument<TBuilder> => new KtArgument<TBuilder>({ ...options, value });

const createNamedArgument = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value' | 'name'>>,
): KtArgument<TBuilder> => new KtArgument<TBuilder>({ ...options, value, name });

/**
 * Factory for creating argument nodes. The `named` function creates an argument with a name, and the `write` function
 * writes a list of arguments in parentheses, or `()` when the list is empty.
 *
 * @param value The value of the argument. A string is written verbatim.
 * @param options The settings of the argument. See `KtArgument` for the available properties.
 * @example
 * ```ts
 * ktArgument('30', { name: 'timeout' });
 * // Emits:
 * // timeout = 30
 * ```
 */
export const ktArgument: typeof createArgument & {
  named: typeof createNamedArgument;
  write: typeof writeKtArguments;
} = Object.assign(createArgument, {
  named: createNamedArgument,
  write: writeKtArguments,
});
