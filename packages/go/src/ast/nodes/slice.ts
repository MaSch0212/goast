import type { AstNodeOptions, Prettify, SourceBuilder } from '@goast/core';

import { GoNode } from '../node.ts';
import { writeGoNode, writeGoNodes } from '../utils/write-go-node.ts';
import type { GoType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    elementType: GoType<TBuilder>;
  }
>;

/** A slice type: `[]T`. */
export class GoSlice<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public elementType: GoType<TBuilder>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.elementType = options.elementType;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('[]');
    writeGoNode(builder, this.elementType);
  }
}

const createSlice = <TBuilder extends SourceBuilder>(
  elementType: Options<TBuilder>['elementType'],
  options?: Prettify<Omit<Options<TBuilder>, 'elementType'>>,
): GoSlice<TBuilder> => new GoSlice<TBuilder>({ ...options, elementType });

export const goSlice: typeof createSlice & { write: typeof writeGoNodes } = Object.assign(createSlice, {
  write: writeGoNodes,
});
