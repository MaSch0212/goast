import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtAnnotations } from '../utils/write-kt-annotations.ts';
import { writeKtNode } from '../utils/write-kt-node.ts';
import { type KtArgument, ktArgument } from './argument.ts';
import type { KtType, KtValue } from './types.ts';

type Injects = 'class' | 'target' | 'arguments';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    class: KtType<TBuilder>;
    arguments?: Nullable<Nullable<KtArgument<TBuilder> | KtValue<TBuilder>>[]>;
    target?: Nullable<KtAnnotationTarget>;
  }
>;

/**
 * The use-site target of an annotation, written as a prefix before the colon, such as `field` for `@field:Inject`.
 * Without a target, the annotation applies to the element that it is written on.
 */
export type KtAnnotationTarget =
  | 'file'
  | 'property'
  | 'field'
  | 'get'
  | 'set'
  | 'receiver'
  | 'param'
  | 'setparam'
  | 'delegate';

/**
 * Represents a Kotlin annotation, such as `@Inject` or `@field:JsonProperty("user_id")`.
 *
 * Written in this order: the `@` sign, the use-site target followed by a colon, the annotation class, then the
 * arguments in parentheses.
 *
 * @template TBuilder The type of the source builder the annotation is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktAnnotation
 */
export class KtAnnotation<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The annotation class, written right after the `@` sign and the optional target, such as `Inject` or
   * `kotlin.Deprecated`.
   */
  public class: KtType<TBuilder>;
  /**
   * The arguments written in parentheses after the annotation class, such as `("user_id")`. Nothing is written when the
   * list is empty, so the annotation stays a marker annotation without parentheses.
   */
  public arguments: (KtArgument<TBuilder> | KtValue<TBuilder>)[];
  /**
   * The use-site target written between the `@` sign and the annotation class, followed by a colon, such as `field` for
   * `@field:Inject`. `null` omits the target.
   */
  public target: KtAnnotationTarget | null;

  /**
   * Initializes a new instance of the KtAnnotation class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.class = options.class;
    this.arguments = options.arguments?.filter(notNullish) ?? [];
    this.target = options.target ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('@');

    if (this.target) {
      builder.append(this.inject.beforeTarget);
      builder.append(this.target);
      builder.append(this.inject.afterTarget);
      builder.append(':');
    }

    builder.append(this.inject.beforeClass);
    writeKtNode(builder, this.class);
    builder.append(this.inject.afterClass);

    if (this.arguments.length > 0) {
      builder.append(this.inject.beforeArguments);
      ktArgument.write(builder, this.arguments);
      builder.append(this.inject.afterArguments);
    }
  }
}

const createAnnotation = <TBuilder extends SourceBuilder>(
  $class: Options<TBuilder>['class'],
  $arguments?: Options<TBuilder>['arguments'],
  options?: Prettify<Omit<Options<TBuilder>, 'class' | 'arguments'>>,
): KtAnnotation<TBuilder> => new KtAnnotation<TBuilder>({ ...options, class: $class, arguments: $arguments });

/**
 * Factory for creating annotation nodes. The `write` function writes one or more annotations to a builder,
 * each followed by a line break when `multiline` is set and by a space otherwise.
 *
 * @param $class The annotation class. See `KtAnnotation.class`.
 * @param $arguments The arguments of the annotation. See `KtAnnotation.arguments`.
 * @param options The settings of the annotation. See `KtAnnotation` for the available properties.
 * @example
 * ```ts
 * ktAnnotation('JsonProperty', ['"user_id"'], { target: 'field' });
 * // Emits:
 * // @field:JsonProperty("user_id")
 * ```
 */
export const ktAnnotation: typeof createAnnotation & { write: typeof writeKtAnnotations } = Object.assign(
  createAnnotation,
  {
    write: writeKtAnnotations,
  },
);
