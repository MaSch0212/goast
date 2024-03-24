import {
  AppendValue,
  AstNodeOptions,
  Nullable,
  Prettify,
  SingleOrMultiple,
  SourceBuilder,
  notNullish,
  toArray,
} from '@goast/core';

import { KtCall } from './call';
import { KtString } from './string';
import { KtNode } from '../node';
import { writeKt } from '../utils';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name?: Nullable<string>;
    value: AppendValue<TBuilder> | KtString<TBuilder> | KtCall<TBuilder>;
  }
>;

export class KtArgument<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string | null;
  public value: AppendValue<TBuilder> | KtString<TBuilder> | KtCall<TBuilder>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options?.name ?? null;
    this.value = options.value;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.appendIf(!!this.name, this.name, ' = ').append((b) => writeKt(b, this.value));
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

const writeArguments = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtArgument<TBuilder> | AppendValue<TBuilder>>>,
  options?: { multiline?: boolean },
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  const multiline = options?.multiline ?? filteredNodes.length > 2;
  builder.parenthesize('()', (b) => b.forEach(filteredNodes, writeKt, { separator: multiline ? ',\n' : ', ' }), {
    multiline,
  });
};

export const ktArgument = Object.assign(createArgument, {
  named: createNamedArgument,
  write: writeArguments,
});
