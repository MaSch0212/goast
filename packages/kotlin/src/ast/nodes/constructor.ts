import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import type { KtAccessModifier } from '../common.ts';
import { KtNode } from '../node.ts';
import { writeKtNodes } from '../utils/write-kt-node.ts';
import { type KtAnnotation, ktAnnotation } from './annotation.ts';
import { type KtArgument, ktArgument } from './argument.ts';
import { type KtParameter, ktParameter } from './parameter.ts';
import type { KtValue } from './types.ts';

type Injects = 'annotations' | 'modifiers' | 'params' | 'body' | 'delegate';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    accessModifier?: Nullable<KtAccessModifier>;
    annotations?: Nullable<Nullable<KtAnnotation<TBuilder>>[]>;
    parameters?: Nullable<Nullable<KtParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    body?: Nullable<AppendValue<TBuilder>>;
    delegateTarget?: Nullable<KtDelegateTarget>;
    delegateArguments?: Nullable<Nullable<KtArgument<TBuilder> | KtValue<TBuilder>>[]>;
  }
>;

/**
 * The constructor that a constructor delegates to, written after `:` as `this(...)` or `super(...)`.
 */
export type KtDelegateTarget = 'this' | 'super';

/**
 * Represents a constructor of a Kotlin class. A secondary constructor is written in the class body, while a primary
 * constructor is written in the class header.
 *
 * Written in this order as a secondary constructor: annotations, access modifier, the `constructor` keyword,
 * parameters, the delegation, then the body. As a primary constructor, only the annotations, the access modifier,
 * and the parameters are written in the header, and the containing class writes the body as an `init` block.
 *
 * @template TBuilder The type of the source builder the constructor is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktConstructor
 */
export class KtConstructor<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The visibility modifier written before the `constructor` keyword, or `null` to omit it. For a primary
   * constructor, a set modifier also makes the `constructor` keyword appear in the header, such as
   * `Foo private constructor(x: Int)`.
   */
  public accessModifier: KtAccessModifier | null;
  /**
   * The annotations written above a secondary constructor, each on its own line. For a primary constructor they are
   * written inline before the parameters, separated by spaces.
   */
  public annotations: KtAnnotation<TBuilder>[];
  /**
   * The parameters written in parentheses after the `constructor` keyword. A parameter with a `property` also
   * declares a property of the class when it is part of a primary constructor. A secondary constructor always writes
   * the parentheses, while a primary constructor omits them when there is nothing to write.
   */
  public parameters: (KtParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  /**
   * The statements written inside the braces of a secondary constructor, or `null` for empty braces. A primary
   * constructor does not write its body here, since the containing class writes it as an `init` block.
   */
  public body: AppendValue<TBuilder> | null;
  /**
   * The constructor that is called before the body, written as ` : this(...)` or ` : super(...)`, or `null` to omit
   * the delegation. A primary constructor writes no delegation itself, so the containing class writes `super` after
   * its base class instead.
   */
  public delegateTarget: KtDelegateTarget | null;
  /**
   * The arguments written in parentheses after the delegation target, such as `(42, true)`. Only written when
   * `delegateTarget` is set, and an empty list writes `()`.
   */
  public delegateArguments: (KtArgument<TBuilder> | KtValue<TBuilder>)[];

  /**
   * Initializes a new instance of the KtConstructor class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
    this.accessModifier = options.accessModifier ?? null;
    this.annotations = options.annotations?.filter(notNullish) ?? [];
    this.delegateTarget = options.delegateTarget ?? null;
    this.delegateArguments = options.delegateArguments?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations, { multiline: true });
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    builder.append(this.inject.afterModifiers);

    builder.append('constructor');

    builder.append(this.inject.beforeParams);
    ktParameter.write(builder, this.parameters);
    builder.append(this.inject.afterParams);

    if (this.delegateTarget) {
      builder.append(' : ');
      builder.append(this.inject.beforeDelegate);
      builder.append(this.delegateTarget);
      ktArgument.write(builder, this.delegateArguments);
      builder.append(this.inject.afterDelegate);
    }

    builder.append(' ');
    builder.append(this.inject.beforeBody);
    builder.parenthesize('{}', this.body, { multiline: !!this.body });
    builder.append(this.inject.afterBody);

    builder.appendLine();
  }

  public writeAsPrimary(builder: TBuilder): void {
    builder.append(this.inject.before);
    this.onWriteAsPrimary(builder);
    builder.append(this.inject.after);
  }

  protected onWriteAsPrimary(builder: TBuilder): void {
    const needsCtorKeyword = this.annotations.length > 0 || !!this.accessModifier;
    if (needsCtorKeyword) builder.append(' ');

    builder.append(this.inject.beforeAnnotations);
    ktAnnotation.write(builder, this.annotations);
    builder.append(this.inject.afterAnnotations);

    builder.append(this.inject.beforeModifiers);
    if (this.accessModifier) builder.append(this.accessModifier, ' ');
    builder.append(this.inject.afterModifiers);

    if (needsCtorKeyword) builder.append('constructor');

    if (needsCtorKeyword || this.parameters.length > 0) {
      builder.append(this.inject.beforeParams);
      ktParameter.write(builder, this.parameters);
      builder.append(this.inject.afterParams);
    }
  }
}

const createConstructor = <TBuilder extends SourceBuilder>(
  parameters?: Options<TBuilder>['parameters'],
  body?: Options<TBuilder>['body'],
  options?: Prettify<Omit<Options<TBuilder>, 'parameters' | 'body'>>,
): KtConstructor<TBuilder> => new KtConstructor<TBuilder>({ ...options, parameters: parameters ?? undefined, body });

/**
 * Factory for creating constructor nodes. The `write` function writes one or more constructor nodes to a builder.
 *
 * @param parameters The parameters of the constructor. Pass nothing for a constructor without parameters.
 * @param body The statements of the constructor body, or `null` for an empty body.
 * @param options The settings of the constructor. See `KtConstructor` for the available properties.
 * @example
 * ```ts
 * ktConstructor([ktParameter('x', 'Int')], 'println(x)', {
 *   accessModifier: 'private',
 *   delegateTarget: 'this',
 *   delegateArguments: ['x'],
 * });
 * // Emits:
 * // private constructor(x: Int) : this(x) {
 * //     println(x)
 * // }
 * ```
 */
export const ktConstructor: typeof createConstructor & { write: typeof writeKtNodes } = Object.assign(
  createConstructor,
  {
    write: writeKtNodes,
  },
);
