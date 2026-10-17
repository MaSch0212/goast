import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import type { TsAccessModifier } from '../common.ts';
import { writeTsNode } from '../utils/write-ts-nodes.ts';
import { writeTsParameters } from '../utils/write-ts-parameters.ts';
import { tsDecorator } from './decorator.ts';
import { TsParameter } from './parameter.ts';

type Injects = 'modifiers';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsParameter<TBuilder, TInjects | Injects>,
  {
    accessModifier?: Nullable<TsAccessModifier>;
    readonly?: Nullable<boolean>;
  }
>;

/**
 * Represents a parameter of a constructor. Besides the properties of `TsParameter`, it can declare a class property by
 * setting an access modifier and the `readonly` keyword.
 *
 * Written in this order: the decorators, the access modifier, the `readonly` keyword, the name, the optional marker,
 * the type, then the default value. The description is not written on the parameter. The constructor adds it as a
 * `@param` tag to its doc comment instead.
 *
 * @template TBuilder The type of the source builder the constructor parameter is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsConstructorParameter
 */
export class TsConstructorParameter<
  TBuilder extends SourceBuilder,
  TInjects extends string = never,
> extends TsParameter<TBuilder, TInjects | Injects> {
  /**
   * The access modifier written before the name, such as `public`. Setting one makes the parameter a class property.
   * Nothing is written when `null`.
   */
  public accessModifier: TsAccessModifier | null;
  /**
   * Whether the parameter is written with the `readonly` keyword, placed after the access modifier.
   * @default false
   */
  public readonly: boolean;

  /**
   * Initializes a new instance of the TsConstructorParameter class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.accessModifier = options.accessModifier ?? null;
    this.readonly = options.readonly ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeDecorators);
    tsDecorator.write(builder, this.decorators);
    builder.append(this.inject.afterDecorators);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    if (this.readonly) builder.append('readonly ');
    builder.append(this.inject.afterModifiers);

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

const createConstructorParameter = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): TsConstructorParameter<TBuilder> => new TsConstructorParameter<TBuilder>({ ...options, name });

/**
 * Factory for creating constructor parameter nodes. The `write` function writes the parameters of a constructor to a
 * builder, enclosed in parentheses.
 *
 * @param name The name of the parameter.
 * @param options The settings of the parameter. See `TsConstructorParameter` for the available properties.
 * @example
 * ```ts
 * tsConstructorParameter('name', { accessModifier: 'private', readonly: true, type: 'string' });
 * // Emits:
 * // private readonly name: string
 * ```
 */
export const tsConstructorParameter: typeof createConstructorParameter & { write: typeof writeTsParameters } =
  Object.assign(createConstructorParameter, {
    write: writeTsParameters,
  });
