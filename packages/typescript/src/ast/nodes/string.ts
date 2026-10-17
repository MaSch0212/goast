import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { getTypeScriptBuilderOptions } from '../utils/get-type-script-builder-options.ts';
import { writeTsNodes } from '../utils/write-ts-nodes.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    value: string;
    template?: Nullable<boolean>;
  }
>;

/**
 * Represents a string literal, such as `'X'`.
 *
 * The value is written as a quoted literal with the escapes that a string literal needs. Strings use single quotes
 * unless the `useSingleQuotes` option of the builder is turned off, in which case they use double quotes. When
 * `template` is set, the value is written as a template literal between backticks instead.
 *
 * @template TBuilder The type of the source builder the string is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsString
 */
export class TsString<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The text of the string, escaped for a quoted literal. In template mode, backticks are escaped but `${` is written
   * as it is, so it still starts an interpolation.
   */
  public value: string;
  /**
   * Whether the value is written as a template literal between backticks instead of a quoted string.
   * @default false
   */
  public template: boolean;

  /**
   * Initializes a new instance of the TsString class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.value = options.value;
    this.template = options.template ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    const builderOptions = getTypeScriptBuilderOptions(builder);
    let value = JSON.stringify(this.value);
    if (this.template) {
      value = `\`${value.slice(1, -1).replace(/`/g, '\\`')}\``;
    } else if (builderOptions.useSingleQuotes) {
      value = `'${value.slice(1, -1).replace(/'/g, "\\'")}'`;
    }
    builder.append(value);
  }
}

const createString = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value'>>,
): TsString<TBuilder> => new TsString<TBuilder>({ ...options, value });

/**
 * Factory for creating string nodes. The `write` function writes one or more string nodes to a builder.
 *
 * @param value The text of the string. See `TsString.value`.
 * @param options The settings of the string. See `TsString` for the available properties.
 * @example
 * ```ts
 * tsString('X', { template: true });
 * // Emits:
 * // `X`
 * ```
 */
export const tsString: typeof createString & { write: typeof writeTsNodes } = Object.assign(createString, {
  write: writeTsNodes,
});
