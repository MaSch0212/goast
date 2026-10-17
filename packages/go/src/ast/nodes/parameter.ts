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

/** A parameter, result or receiver of a function. */
export class GoParameter<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string | null;
  public type: GoType<TBuilder>;
  public variadic: boolean;

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

export const goParameter: typeof createParameter & {
  write: typeof writeGoNodes;
  writeList: typeof writeParameters;
} = Object.assign(createParameter, {
  write: writeGoNodes,
  writeList: writeParameters,
});
