import type { AstNodeOptions, BasicAppendValue, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsGenericParameters } from '../utils/write-ts-generic-parameters.ts';
import { writeTsNode } from '../utils/write-ts-nodes.ts';
import type { TsType } from './types.ts';

type Injects = 'modifiers' | 'name' | 'constraint' | 'default';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    description?: Nullable<BasicAppendValue<TBuilder>>;
    const?: Nullable<boolean>;
    name: string;
    constraint?: Nullable<TsType<TBuilder>>;
    default?: Nullable<TsType<TBuilder>>;
  }
>;

/**
 * Represents a type parameter, such as `const T extends number = 4711`.
 *
 * Written in this order: the `const` modifier, the name, the constraint and the default type. The description is not
 * written inline. Nodes with a doc comment, such as classes, functions and interfaces, add it as a `@template` tag.
 *
 * @template TBuilder The type of the source builder the type parameter is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see tsGenericParameter
 */
export class TsGenericParameter<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The description of the type parameter. It is not written inline. Enclosing nodes with a doc comment add it as a
   * `@template` tag.
   */
  public description: BasicAppendValue<TBuilder> | null;
  /**
   * Whether the parameter is written with the `const` modifier, such as `const T`.
   * @default false
   */
  public const: boolean;
  /**
   * The name of the type parameter, such as `T`.
   */
  public name: string;
  /**
   * The type that the parameter must extend, written as ` extends Type`, or `null` to omit it.
   */
  public constraint: TsType<TBuilder> | null;
  /**
   * The type used when no type argument is given, written as ` = Type`, or `null` to omit it.
   */
  public default: TsType<TBuilder> | null;

  /**
   * Initializes a new instance of the TsGenericParameter class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.description = options.description ?? null;
    this.const = options.const ?? false;
    this.name = options.name;
    this.constraint = options.constraint ?? null;
    this.default = options.default ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeModifiers);
    builder.appendIf(this.const, 'const ');
    builder.append(this.inject.afterModifiers);

    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.constraint !== null) {
      builder.append(' extends ');
      builder.append(this.inject.beforeConstraint);
      writeTsNode(builder, this.constraint);
      builder.append(this.inject.afterConstraint);
    }

    if (this.default !== null) {
      builder.append(' = ');
      builder.append(this.inject.beforeDefault);
      writeTsNode(builder, this.default);
      builder.append(this.inject.afterDefault);
    }
  }
}

const createGenericParameter = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): TsGenericParameter<TBuilder> => new TsGenericParameter<TBuilder>({ ...options, name });

/**
 * Factory for creating type parameter nodes. The `write` function writes the parameters in angle brackets, or nothing
 * when there are none. More than two parameters are written one per line.
 *
 * @param name The name of the type parameter.
 * @param options The settings of the type parameter. See `TsGenericParameter` for the available properties.
 * @example
 * ```ts
 * tsGenericParameter('T', { constraint: 'number', default: '4711', const: true });
 * // Emits:
 * // const T extends number = 4711
 * ```
 */
export const tsGenericParameter: typeof createGenericParameter & { write: typeof writeTsGenericParameters } =
  Object.assign(createGenericParameter, {
    write: writeTsGenericParameters,
  });
