import type { AstNodeOptions, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { toGoStringLiteral } from '../../utils.ts';
import { GoNode } from '../node.ts';
import { writeGoNodes } from '../utils/write-go-node.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof GoNode<TBuilder, TInjects | Injects>,
  {
    value: Nullable<string>;
  }
>;

/** A string literal: `"..."`. */
export class GoString<TBuilder extends SourceBuilder, TInjects extends string = never> extends GoNode<
  TBuilder,
  TInjects | Injects
> {
  public value: string;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.value = options.value ?? '';
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(toGoStringLiteral(this.value));
  }
}

const createString = <TBuilder extends SourceBuilder>(
  value: Options<TBuilder>['value'],
  options?: Prettify<Omit<Options<TBuilder>, 'value'>>,
): GoString<TBuilder> => new GoString<TBuilder>({ ...options, value });

export const goString: typeof createString & { write: typeof writeGoNodes } = Object.assign(createString, {
  write: writeGoNodes,
});
