import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { GoNode } from '../node.ts';
import { writeGoNode, writeGoNodes } from '../utils/write-go-node.ts';
import type { GoType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    /** The name, `null` for an unnamed parameter or result. */
    name: Nullable<string>;
    type: GoType<TBuilder>;
    variadic?: Nullable<boolean>;
  }
>;

/**
 * A parameter, result or receiver of a function, written as `name Type`. A `null` name writes the type alone, as in an
 * unnamed result. A variadic parameter writes `...` before its type, as in `values ...T`.
 *
 * @template TBuilder The type of the source builder the parameter is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goParameter
 */
export class GoParameter<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the parameter, or `null` for an unnamed one. The name is written before the type.
   */
  public name: string | null;
  /**
   * The type of the parameter, written after the name.
   */
  public type: GoType<TBuilder>;
  /**
   * Whether the parameter is variadic, which writes `...` before the type.
   * @default false
   */
  public variadic: boolean;

  /**
   * Initializes a new instance of the GoParameter class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name ?? null;
    this.type = options.type;
    this.variadic = options.variadic ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.name) builder.append(this.name, ' ');
    if (this.variadic) builder.append('...');
    writeGoNode(builder, this.type);
  }
}

const createParameter = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  type: Options<TBuilder>['type'],
  options?: Prettify<Omit<Options<TBuilder>, 'name' | 'type'>>,
): GoParameter<TBuilder> => new GoParameter<TBuilder>({ ...options, name, type });

/**
 * Writes a parameter list in parentheses, or a result list: a single unnamed result is written without parentheses.
 *
 * Without `results`, the list is always written in parentheses, even when it is empty. With `results`, a single unnamed
 * result is written without parentheses, and any other list in parentheses.
 *
 * @template TBuilder The type of the source builder the list is written to.
 * @param builder The builder to write to.
 * @param parameters The parameters or results to write, in order.
 * @param options Set `results` to write the list as the results of a function.
 */
function writeParameters<TBuilder extends SourceBuilder>(
  builder: TBuilder,
  parameters: GoParameter<TBuilder>[],
  options?: { results?: boolean },
): void {
  if (options?.results && parameters.length === 1 && !parameters[0].name) {
    writeGoNode(builder, parameters[0]);
    return;
  }
  builder.parenthesize('()', (b) => writeGoNodes(b, parameters, { separator: ', ' }));
}

/**
 * Factory for creating parameter nodes. The `write` function writes one or more parameter nodes to a builder, and
 * `writeList` writes them as a parameter list in parentheses, or as a result list.
 *
 * @param name The name of the parameter, or `null` for an unnamed one.
 * @param type The type of the parameter.
 * @param options The settings of the parameter. See `GoParameter` for the available properties.
 * @example
 * ```ts
 * goParameter('ids', refs.string(), { variadic: true });
 * // Emits:
 * // ids ...string
 * ```
 */
export const goParameter: typeof createParameter & {
  write: typeof writeGoNodes;
  writeList: typeof writeParameters;
} = Object.assign(createParameter, {
  write: writeGoNodes,
  writeList: writeParameters,
});
