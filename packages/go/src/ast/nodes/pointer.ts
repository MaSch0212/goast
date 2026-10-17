import type { AstNodeOptions, Prettify, SourceBuilder } from '@goast/core';

import { GoNode } from '../node.ts';
import { writeGoNode, writeGoNodes } from '../utils/write-go-node.ts';
import type { GoType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    type: GoType<TBuilder>;
  }
>;

/** A pointer type: `*T`. */
export class GoPointer<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public type: GoType<TBuilder>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.type = options.type;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('*');
    writeGoNode(builder, this.type);
  }
}

const createPointer = <TBuilder extends SourceBuilder>(
  type: Options<TBuilder>['type'],
  options?: Prettify<Omit<Options<TBuilder>, 'type'>>,
): GoPointer<TBuilder> => new GoPointer<TBuilder>({ ...options, type });

export const goPointer: typeof createPointer & { write: typeof writeGoNodes } = Object.assign(createPointer, {
  write: writeGoNodes,
});
