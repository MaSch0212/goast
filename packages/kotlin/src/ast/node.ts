import { AstNode, type AstNodeOptions, type SourceBuilder } from '@goast/core';

/**
 * Base class for all Kotlin AST nodes. It adds no behavior of its own. Nodes are written with `write`, and their
 * injection points, such as `before` and `beforeName`, come from `AstNode` in `@goast/core`.
 *
 * @template TBuilder The type of the builder that the node is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 */
export abstract class KtNode<TBuilder extends SourceBuilder, TInjects extends string = never> extends AstNode<
  TBuilder,
  TInjects
> {
  /**
   * Initializes a new instance of the KtNode class.
   * @param options The options of the node. They are passed on to the constructor of `AstNode`.
   */
  constructor(options: AstNodeOptions<typeof AstNode<TBuilder, TInjects>>) {
    super(options);
  }
}
