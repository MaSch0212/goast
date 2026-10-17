import {
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode } from '../utils/write-ts-nodes.ts';
import { writeTsParameters } from '../utils/write-ts-parameters.ts';
import { type TsDecorator, tsDecorator } from './decorator.ts';
import type { TsType, TsValue } from './types.ts';

type Injects = 'decorators' | 'name' | 'type' | 'default';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    description?: Nullable<BasicAppendValue<TBuilder>>;
    decorators?: Nullable<Nullable<TsDecorator<TBuilder>>[]>;
    type?: Nullable<TsType<TBuilder>>;
    optional?: Nullable<boolean>;
    default?: Nullable<TsValue<TBuilder>>;
  }
>;

/**
 * Represents a parameter of a function or method, such as `x?: number = 42`.
 *
 * Written in this order: decorators, name, optional marker, type annotation, and default value. The injection points
 * `beforeDecorators` and `afterDecorators` wrap the decorators, `beforeName` and `afterName` wrap the name,
 * `beforeType` and `afterType` wrap the type, and `beforeDefault` and `afterDefault` wrap the default value.
 *
 * A parameter does not write its own parentheses. `tsParameter.write` writes a list of parameters in parentheses, one
 * per line when there are more than two parameters or when one of them has decorators.
 *
 * @template TBuilder The type of the source builder the parameter is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsParameter
 */
export class TsParameter<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the parameter, written verbatim.
   */
  public name: string;
  /**
   * The text of the `@param` tag that the method or function that owns this parameter writes for it. The parameter
   * itself does not write the description, so `null` only omits the tag.
   */
  public description: BasicAppendValue<TBuilder> | null;
  /**
   * The decorators written before the parameter. They are separated by spaces and written on the same line, such as
   * `@decorator x`.
   */
  public decorators: TsDecorator<TBuilder>[];
  /**
   * The type annotation written after the name, such as `: number`, or `null` to omit it.
   */
  public type: TsType<TBuilder> | null;
  /**
   * Whether the name is followed by `?`, which marks the parameter as optional.
   * @default false
   */
  public optional: boolean;
  /**
   * The default value written after ` = `, such as ` = 42`, or `null` to omit it. Falsy values are not written.
   */
  public default: TsValue<TBuilder> | null;

  /**
   * Initializes a new instance of the TsParameter class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.description = options.description ?? null;
    this.decorators = options.decorators?.filter(notNullish) ?? [];
    this.type = options.type ?? null;
    this.optional = options.optional ?? false;
    this.default = options.default ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDecorators);
    tsDecorator.write(builder, this.decorators);
    builder.append(this.inject.afterDecorators);

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);
    if (this.optional) builder.append('?');

    if (this.type) {
      builder.append(': ');
      builder.append(this.inject.beforeType);
      writeTsNode(builder, this.type);
      builder.append(this.inject.afterType);
    }

    if (this.default) {
      builder.append(' = ');
      builder.append(this.inject.beforeDefault);
      writeTsNode(builder, this.default);
      builder.append(this.inject.afterDefault);
    }
  }
}

const createParameter = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): TsParameter<TBuilder> => new TsParameter<TBuilder>({ ...options, name });

/**
 * Factory for creating parameter nodes. The `write` function writes a parenthesized list of parameters to a builder.
 *
 * @param name The name of the parameter. See `TsParameter.name`.
 * @param options The settings of the parameter. See `TsParameter` for the available properties.
 * @example
 * ```ts
 * tsParameter('x', { decorators: [tsDecorator('decorator')], type: 'number', default: '42', optional: true });
 * // Emits:
 * // @decorator x?: number = 42
 * ```
 */
export const tsParameter: typeof createParameter & { write: typeof writeTsParameters } = Object.assign(
  createParameter,
  {
    write: writeTsParameters,
  },
);
