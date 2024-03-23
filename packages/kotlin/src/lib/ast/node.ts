import { AstNode, AstNodeOptions, SourceBuilder } from '@goast/core';

import { KotlinFileBuilder } from '../file-builder';

export abstract class KtNode<
  TBuilder extends SourceBuilder = KotlinFileBuilder,
  TInjects extends string = never
> extends AstNode<TBuilder, TInjects> {
  constructor(options: AstNodeOptions<KtNode<TBuilder>, typeof AstNode<TBuilder>>) {
    super(options);
  }
}
