import type { AstNodeOptions, Prettify, SourceBuilder } from '@goast/core';

import { GoNode } from '../node.ts';
import { writeGoNode, writeGoNodes } from '../utils/write-go-node.ts';
import type { GoType } from './types.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    keyType: GoType<TBuilder>;
    valueType: GoType<TBuilder>;
  }
>;

/** A map type: `map[K]V`. */
export class GoMap<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public keyType: GoType<TBuilder>;
  public valueType: GoType<TBuilder>;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.keyType = options.keyType;
    this.valueType = options.valueType;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('map[');
    writeGoNode(builder, this.keyType);
    builder.append(']');
    writeGoNode(builder, this.valueType);
  }
}

const createMap = <TBuilder extends SourceBuilder>(
  keyType: Options<TBuilder>['keyType'],
  valueType: Options<TBuilder>['valueType'],
  options?: Prettify<Omit<Options<TBuilder>, 'keyType' | 'valueType'>>,
): GoMap<TBuilder> => new GoMap<TBuilder>({ ...options, keyType, valueType });

export const goMap: typeof createMap & { write: typeof writeGoNodes } = Object.assign(createMap, {
  write: writeGoNodes,
});
