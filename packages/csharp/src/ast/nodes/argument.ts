import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { CsNode } from '../node.ts';
import { writeCsArguments } from '../utils/write-cs-arguments.ts';
import { writeCsNode } from '../utils/write-cs-node.ts';
import type { CsValue } from './types.ts';

type Injects = 'name' | 'value';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    /** The name of a named argument (`name: value`). */
    name?: Nullable<string>;
    /** A `ref`, `out` or `in` modifier of the argument. */
    modifier?: Nullable<'ref' | 'out' | 'in'>;
    value: CsValue<TBuilder>;
  }
>;

export class CsArgument<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string | null;
  public modifier: 'ref' | 'out' | 'in' | null;
  public value: CsValue<TBuilder>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options?.name ?? null;
    this.modifier = options?.modifier ?? null;
    this.value = options.value;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.name) {
      builder.append(this.inject.beforeName);
      builder.append(this.name);
      builder.append(this.inject.afterName);
      builder.append(': ');
    }

    if (this.modifier) builder.append(this.modifier, ' ');

    builder.append(this.inject.beforeValue);
    writeCsNode(builder, this.value);
    builder.append(this.inject.afterValue);
  }
}

const createArgument = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value'>>,
): CsArgument<TBuilder> => new CsArgument<TBuilder>({ ...options, value });

const createNamedArgument = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value' | 'name'>>,
): CsArgument<TBuilder> => new CsArgument<TBuilder>({ ...options, value, name });

export const csArgument: typeof createArgument & {
  named: typeof createNamedArgument;
  write: typeof writeCsArguments;
} = Object.assign(createArgument, {
  named: createNamedArgument,
  write: writeCsArguments,
});
