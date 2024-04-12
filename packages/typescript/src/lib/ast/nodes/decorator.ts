import {
  AppendValue,
  AstNodeOptions,
  BasicAppendValue,
  Nullable,
  Prettify,
  SingleOrMultiple,
  SourceBuilder,
  notNullish,
  toArray,
} from '@goast/core';

import { TsArgument, tsArgument } from './argument';
import { TsReference } from './reference';
import { TsValue } from './types';
import { TsNode } from '../node';
import { writeTsNode } from '../utils/write-ts-nodes';

type Injects = 'function' | 'arguments';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    function: TsReference<TBuilder> | BasicAppendValue<TBuilder>;
    arguments?: Nullable<Nullable<TsArgument<TBuilder> | TsValue<TBuilder>>[]>;
  }
>;

export class TsDecorator<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public function: TsReference<TBuilder> | BasicAppendValue<TBuilder>;
  public arguments: (TsArgument<TBuilder> | TsValue<TBuilder>)[] | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.function = options.function;
    this.arguments = options.arguments?.filter(notNullish) ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('@');
    builder.append(this.inject.beforeFunction);
    writeTsNode(builder, this.function);
    builder.append(this.inject.afterFunction);

    if (this.arguments) {
      builder.append(this.inject.beforeArguments);
      tsArgument.write(builder, this.arguments);
      builder.append(this.inject.afterArguments);
    }
  }
}

const createDecorator = <TBuilder extends SourceBuilder>(
  fn: Options<TBuilder>['function'],
  args?: Options<TBuilder>['arguments'],
  options?: Prettify<Omit<Options<TBuilder>, 'function' | 'arguments'>>,
) => new TsDecorator<TBuilder>({ ...options, function: fn, arguments: args });

const writeDecorators = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<TsDecorator<TBuilder> | AppendValue<TBuilder>>>,
  options?: { multiline?: boolean },
) => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, (b, d) => {
    writeTsNode(b, d);
    b.append(options?.multiline ? '\n' : ' ');
  });
};

export const tsDecorator = Object.assign(createDecorator, {
  write: writeDecorators,
});
