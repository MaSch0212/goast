import {
  type ArrayItem,
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtNode, writeKtNodes } from '../utils/write-kt-node.ts';
import { type KtArgument, ktArgument } from './argument.ts';
import type { KtType, KtValue } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    path: Nullable<KtType<TBuilder> | KtValue<TBuilder>>[];
    arguments?: Nullable<Nullable<KtArgument<TBuilder> | KtValue<TBuilder>>[]>;
    infix?: boolean;
  }
>;

/**
 * Represents a call of a function, such as `listOf(1, 2)` or `client.get("/pets")`.
 *
 * Written in this order: the path with its segments joined by dots, then the arguments in parentheses. With `infix` set
 * and a single argument, the call is written in infix form without parentheses instead.
 *
 * @template TBuilder The type of the source builder the call is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see ktCall
 */
export class KtCall<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The segments of the callee, joined with dots, such as `client` and `get` for `client.get`. With more than two
   * segments, the first segment is written on its own line and each following segment is indented on a new line,
   * starting with a dot.
   */
  public path: (KtType<TBuilder> | KtValue<TBuilder>)[];
  /**
   * The arguments written in parentheses after the path, such as `(1, 2)`. An empty list writes `()`, while `null`
   * omits the parentheses entirely, which turns the call into a plain property access.
   */
  public arguments: (KtArgument<TBuilder> | KtValue<TBuilder>)[] | null;
  /**
   * Whether the call is written in infix form, such as `a plus b`. Infix form requires exactly one argument and a path
   * with more than one segment, and only the first and the last path segment are written in that form. Otherwise the
   * normal call form is used.
   * @default false
   */
  public infix: boolean;

  /**
   * Initializes a new instance of the KtCall class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.path = options.path.filter(notNullish);
    this.arguments = options.arguments?.filter(notNullish) ?? null;
    this.infix = options.infix ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.infix && this.arguments?.length === 1 && this.path.length > 1) {
      writeKtNodes(builder, this.path.slice(0, 1), { separator: '.' });
      builder.append(' ');
      writeKtNode(builder, this.path.at(-1));
      builder.append(' ');
      writeKtNode(builder, this.arguments[0]);
    } else {
      if (this.path.length > 2) {
        writeKtNode(builder, this.path[0]);
        builder.ensureCurrentLineEmpty();
        builder.indent((builder) => {
          builder.append('.');
          writeKtNodes(builder, this.path.slice(1), { separator: '\n.' });
        });
      } else {
        writeKtNodes(builder, this.path, { separator: '.' });
      }

      if (this.arguments) {
        ktArgument.write(builder, this.arguments);
      }
    }
  }
}

const createCall = <TBuilder extends SourceBuilder>(
  path: Options<TBuilder>['path'] | ArrayItem<Options<TBuilder>['path']>,
  args?: Options<TBuilder>['arguments'],
  options?: Prettify<Omit<Options<TBuilder>, 'path' | 'arguments'>>,
): KtCall<TBuilder> => new KtCall<TBuilder>({ ...options, path: Array.isArray(path) ? path : [path], arguments: args });

/**
 * Factory for creating call nodes. The `write` function writes one or more call nodes to a builder.
 *
 * @param path The segments of the callee. A single segment can be passed without an array.
 * @param args The arguments of the call. `null` or `undefined` writes the call without parentheses.
 * @param options The settings of the call. See `KtCall` for the available properties.
 * @example
 * ```ts
 * ktCall(['client', 'get'], ['"/pets"']);
 * // Emits:
 * // client.get("/pets")
 * ```
 */
export const ktCall: typeof createCall & { write: typeof writeKtNodes } = Object.assign(createCall, {
  write: writeKtNodes,
});
