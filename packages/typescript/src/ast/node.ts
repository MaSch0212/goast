import { AstNode, type AstNodeOptions, type SourceBuilder } from '@goast/core';

/**
 * Base class of the TypeScript AST nodes. It adds no output of its own: each subclass renders its code in `onWrite`,
 * and the `write` method of `AstNode` wraps that output in the `before` and `after` injections.
 *
 * Besides `before` and `after`, a node accepts the injection points that its subclass declares through `TInjects`,
 * such as `beforeName` or `afterBody`.
 *
 * @template TBuilder The type of the source builder the node is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 * @see AstNode
 */
export abstract class TsNode<TBuilder extends SourceBuilder, TInjects extends string = never> extends AstNode<
  TBuilder,
  TInjects
> {
  /**
   * Initializes a new instance of the TsNode class.
   * @param options The options to use for this instance. They are passed on to the `AstNode` base class.
   */
  constructor(options: AstNodeOptions<typeof AstNode<TBuilder, TInjects>>) {
    super(options);
  }
}
