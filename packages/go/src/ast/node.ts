import { AstNode, type AstNodeOptions, type SourceBuilder } from '@goast/core';

/**
 * Base class for all Go AST nodes. It adds no behavior of its own. Nodes write themselves to a builder with `write`,
 * and accept the injection points of `AstNode` in `@goast/core`, named `before*` and `after*`.
 *
 * @template TBuilder The type of the builder that the node is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 */
export abstract class GoNode<TBuilder extends SourceBuilder, TInjects extends string = never> extends AstNode<
  TBuilder,
  TInjects
> {
  /**
   * Initializes a new instance of the GoNode class.
   * @param options The options of the node. They are passed on to the constructor of `AstNode`.
   */
  constructor(options: AstNodeOptions<typeof AstNode<TBuilder, TInjects>>) {
    super(options);
  }
}
