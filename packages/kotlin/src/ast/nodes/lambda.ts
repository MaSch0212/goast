import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type SourceBuilder,
} from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtNodes } from '../utils/write-kt-node.ts';

type Injects = 'arguments' | 'body';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    arguments?: Nullable<Nullable<BasicAppendValue<TBuilder>>[]>;
    body?: Nullable<AppendValue<TBuilder>>;
    singleline?: boolean;
  }
>;

/**
 * Represents a Kotlin lambda expression, such as `{ a, b -> a + b }`.
 *
 * Written in this order: the opening brace, the parameter names followed by an arrow, the body, then the closing brace.
 * A lambda without a body is always written on one line.
 *
 * @template TBuilder The type of the source builder the lambda is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktLambda
 */
export class KtLambda<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The parameter names written after the opening brace, separated by commas and followed by `->`. Without any names,
   * the arrow is omitted and the body follows the opening brace directly.
   */
  public arguments: BasicAppendValue<TBuilder>[];
  /**
   * The statements of the lambda. `null` writes an empty lambda on one line, such as `{ }`.
   */
  public body: AppendValue<TBuilder> | null;
  /**
   * Whether the body is written on the same line as the braces, such as `{ a, b -> a + b }`. Otherwise the body is
   * written on an indented line of its own, between the arrow and the closing brace.
   * @default false
   */
  public singleline: boolean;

  /**
   * Initializes a new instance of the KtLambda class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.arguments = options.arguments?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
    this.singleline = options.singleline ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    const singleline = this.singleline || !this.body;

    builder.parenthesize('{}', (b) => {
      if (this.arguments.length > 0) {
        b.append(' ', this.inject.beforeArguments);
        writeKtNodes(b, this.arguments, { separator: ', ' });
        b.append(this.inject.afterArguments);

        b.append(' ->');
      }

      b.append(singleline ? ' ' : '\n');

      b.append(this.inject.beforeBody, this.body, this.inject.afterBody);

      if (singleline) {
        if (!b.isCurrentLineEmpty) {
          b.append(' ');
        }
      } else {
        b.ensureCurrentLineEmpty();
      }
    });
  }
}

const createLambda = <TBuilder extends SourceBuilder>(
  args: Options<TBuilder>['arguments'],
  body: Options<TBuilder>['body'],
  options?: Omit<Options<TBuilder>, 'arguments' | 'body'>,
): KtLambda<TBuilder> => new KtLambda<TBuilder>({ ...options, arguments: args, body });

/**
 * Factory for creating lambda nodes. The `write` function writes one or more lambda nodes to a builder.
 *
 * @param args The parameter names of the lambda, or `null` for none.
 * @param body The statements of the lambda, or `null` for an empty lambda.
 * @param options The settings of the lambda. See `KtLambda` for the available properties.
 * @example
 * ```ts
 * ktLambda(['a'], 'println(a)');
 * // Emits:
 * // { a ->
 * //     println(a)
 * // }
 * ```
 */
export const ktLambda: typeof createLambda & { write: typeof writeKtNodes } = Object.assign(createLambda, {
  write: writeKtNodes,
});
