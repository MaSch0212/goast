import type { AstNodeOptions, BasicAppendValue, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtGenericParameters } from '../utils/write-kt-generic-parameters.ts';
import { writeKtNode } from '../utils/write-kt-node.ts';
import type { KtType } from './types.ts';

type Injects = 'name' | 'constraint';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    description?: Nullable<BasicAppendValue<TBuilder>>;
    constraint?: Nullable<KtType<TBuilder>>;
  }
>;

/**
 * Represents a type parameter of a Kotlin class or function, such as `T : Number` in `class Box<T : Number>`.
 *
 * Written in this order: the name, then ` : ` and the constraint when one is set. The description is not written
 * next to the parameter, but becomes a `@param` tag in the doc comment of the owning class or function.
 *
 * @template TBuilder The type of the source builder the type parameter is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktGenericParameter
 */
export class KtGenericParameter<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the type parameter, written verbatim.
   */
  public name: string;
  /**
   * The description of the type parameter. It becomes a `@param` tag in the doc comment of the owning class or
   * function, and `null` adds no tag.
   */
  public description: BasicAppendValue<TBuilder> | null;
  /**
   * The upper bound written after ` : `, such as `Number` for `T : Number`, or `null` for an unconstrained parameter.
   */
  public constraint: KtType<TBuilder> | null;

  /**
   * Initializes a new instance of the KtGenericParameter class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.description = options.description ?? null;
    this.constraint = options.constraint ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.constraint) {
      builder.append(' : ');
      builder.append(this.inject.beforeConstraint);
      writeKtNode(builder, this.constraint);
      builder.append(this.inject.afterConstraint);
    }
  }
}

const createGenericParameter = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): KtGenericParameter<TBuilder> => new KtGenericParameter<TBuilder>({ ...options, name });

/**
 * Factory for creating generic parameter nodes. The `write` function writes a list of type parameters in angle
 * brackets, or nothing when the list is empty.
 *
 * @param name The name of the type parameter.
 * @param options The settings of the type parameter. See `KtGenericParameter` for the available properties.
 * @example
 * ```ts
 * ktGenericParameter('T', { constraint: 'Number' });
 * // Emits:
 * // T : Number
 * ```
 */
export const ktGenericParameter: typeof createGenericParameter & { write: typeof writeKtGenericParameters } =
  Object.assign(createGenericParameter, {
    write: writeKtGenericParameters,
  });
