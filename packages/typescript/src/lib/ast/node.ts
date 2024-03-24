import { AstNode, AstNodeOptions, SourceBuilder } from '@goast/core';

export abstract class KtNode<TBuilder extends SourceBuilder, TInjects extends string = never> extends AstNode<
  TBuilder,
  TInjects
> {
  constructor(options: AstNodeOptions<KtNode<TBuilder>, typeof AstNode<TBuilder>>) {
    super(options);
  }
}
