import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import type { KtValue } from './types.ts';
import { KtNode } from '../node.ts';
import { writeKtArguments } from '../utils/write-kt-arguments.ts';
import { writeKtNode } from '../utils/write-kt-node.ts';

type Injects = 'name' | 'value';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name?: Nullable<string>;
    value: KtValue<TBuilder>;
  }
>;

export class KtArgument<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string | null;
  public value: KtValue<TBuilder>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options?.name ?? null;
    this.value = options.value;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.name) {
      builder.append(this.inject.beforeName);
      builder.append(this.name);
      builder.append(this.inject.afterName);
      builder.append(' = ');
    }

    builder.append(this.inject.beforeValue);
    writeKtNode(builder, this.value);
    builder.append(this.inject.afterValue);
  }
}

const createArgument = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value'>>,
) => new KtArgument<TBuilder>({ ...options, value });

const createNamedArgument = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value' | 'name'>>,
) => new KtArgument<TBuilder>({ ...options, value, name });

export const ktArgument = Object.assign(createArgument, {
  named: createNamedArgument,
  write: writeKtArguments,
});
