import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type Prettify,
  type SingleOrMultiple,
  type SourceBuilder,
  toArray,
} from '@goast/core';

import { TsNode } from '../node.ts';
import { writeTsNode } from '../utils/write-ts-nodes.ts';
import { type TsArgument, tsArgument } from './argument.ts';
import type { TsReference } from './reference.ts';
import type { TsValue } from './types.ts';

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
): TsDecorator<TBuilder> => new TsDecorator<TBuilder>({ ...options, function: fn, arguments: args });

const writeDecorators = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<TsDecorator<TBuilder> | AppendValue<TBuilder>>>,
  options?: { multiline?: boolean },
): void => {
  const filteredNodes = toArray(nodes).filter(notNullish);
  builder.forEach(filteredNodes, (b, d) => {
    writeTsNode(b, d);
    b.append(options?.multiline ? '\n' : ' ');
  });
};

export const tsDecorator: typeof createDecorator & { write: typeof writeDecorators } = Object.assign(createDecorator, {
  write: writeDecorators,
});
