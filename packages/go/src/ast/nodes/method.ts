import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { GoNode } from '../node.ts';
import { writeGoNodes } from '../utils/write-go-node.ts';
import type { GoDoc } from './doc.ts';
import { type GoParameter, goParameter } from './parameter.ts';

type Injects = 'parameters' | 'results';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    doc?: Nullable<GoDoc<TBuilder>>;
    parameters?: Nullable<Nullable<GoParameter<TBuilder>>[]>;
    results?: Nullable<Nullable<GoParameter<TBuilder>>[]>;
  }
>;

/**
 * A method of an interface type, written as `Name(params) results`. The doc comment is written above the method.
 *
 * The parameters are written in parentheses. Results follow after a space: a single unnamed result is written without
 * parentheses, and any other results in parentheses. Without results, nothing follows the parameter list. Custom code
 * can be injected before and after the parameter list (`beforeParameters`, `afterParameters`) and before and after the
 * result list (`beforeResults`, `afterResults`), the latter only when there are results.
 *
 * @template TBuilder The type of the source builder the method is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see goMethod
 */
export class GoMethod<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  /**
   * The name of the method, such as `Get`.
   */
  public name: string;
  /**
   * The doc comment written above the method, or `null` to omit it.
   */
  public doc: GoDoc<TBuilder> | null;
  /**
   * The parameters written in parentheses, in order. An empty list writes `()`.
   */
  public parameters: GoParameter<TBuilder>[];
  /**
   * The results written after the parameter list, in order. An empty list writes no results. A single unnamed result is
   * written without parentheses.
   */
  public results: GoParameter<TBuilder>[];

  /**
   * Initializes a new instance of the GoMethod class.
   * @param options The options to use for this instance.
   */
  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.doc = options.doc ?? null;
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.results = options.results?.filter(notNullish) ?? [];
  }

  protected override onWrite(builder: TBuilder): void {
    this.doc?.write(builder);
    builder.append(this.name);
    builder.append(this.inject.beforeParameters);
    goParameter.writeList(builder, this.parameters);
    builder.append(this.inject.afterParameters);
    if (this.results.length > 0) {
      builder.append(' ', this.inject.beforeResults);
      goParameter.writeList(builder, this.results, { results: true });
      builder.append(this.inject.afterResults);
    }
  }
}

const createMethod = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
): GoMethod<TBuilder> => new GoMethod<TBuilder>({ ...options, name });

/**
 * Factory for creating method nodes. The `write` function writes one or more method nodes to a builder.
 *
 * @param name The name of the method, such as `Get`.
 * @param options The settings of the method. See `GoMethod` for the available properties.
 * @example
 * ```ts
 * goMethod('Get', {
 *   parameters: [goParameter('id', refs.string())],
 *   results: [goParameter(null, refs.error())],
 * });
 * // Emits:
 * // Get(id string) error
 * ```
 */
export const goMethod: typeof createMethod & { write: typeof writeGoNodes } = Object.assign(createMethod, {
  write: writeGoNodes,
});
