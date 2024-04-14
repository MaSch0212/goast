import { AstNodeOptions, Nullable, Prettify, SourceBuilder, notNullish } from '@goast/core';

import { TsType } from './types';
import { TsNode } from '../node';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    types: Nullable<TsType<TBuilder>>[];
  }
>;

export class TsIntersectionType<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public types: TsType<TBuilder>[];

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.types = options.types.filter(notNullish);
  }

  protected override onWrite(builder: TBuilder): void {
    const types = this.types.length === 0 ? ['unknown'] : resolveNestedIntersectionTypes(this);
    if (types.length === 1) {
      writeTsNode(builder, types[0]);
    } else {
      const multiline = types.length > 3;
      if (multiline) {
        builder.appendLine().append('& ');
      }
      builder.forEach(types, (b, t) => b.parenthesize('()', (b) => writeTsNode(b, t)), {
        separator: multiline ? '\n& ' : ' & ',
      });
    }
  }
}

const createIntersectionType = <TBuilder extends SourceBuilder>(
  types: Options<TBuilder>['types'],
  options?: Prettify<Omit<Options<TBuilder>, 'types'>>,
) => new TsIntersectionType<TBuilder>({ ...options, types });

export const tsIntersectionType = Object.assign(createIntersectionType, {
  write: writeTsNodes,
});

function resolveNestedIntersectionTypes<TBuilder extends SourceBuilder>(
  node: TsIntersectionType<TBuilder>,
): TsType<TBuilder>[] {
  const types: TsType<TBuilder>[] = [];
  for (const type of node.types) {
    if (type instanceof TsIntersectionType) {
      types.push(...resolveNestedIntersectionTypes(type));
    } else {
      types.push(type);
    }
  }
  return types;
}
