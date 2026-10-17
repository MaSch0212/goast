import type { StringBuilder } from '../utils/string-builder/string-builder.ts';
import type { AppendValue } from '../utils/string-builder/utils.ts';
import type { Prettify } from '../utils/type.utils.ts';

const NODE_HISTORY_SYMBOL = Symbol('node-history');
type BuilderWithHistory<T extends StringBuilder = StringBuilder> = T & { [NODE_HISTORY_SYMBOL]?: AstNode[] };

/**
 * The injection points of an AST node. For each name `X` in `TInjects`, the node accepts an optional `beforeX` and
 * `afterX` value, such as `beforeName` for the name of a declaration. `before` and `after` are always available and
 * wrap the whole node.
 * @template TBuilder The type of the builder that the node is written to.
 * @template TInjects The names of the injection points that the node supports, in addition to `before` and `after`.
 * @see AstNode.write
 */
export type AstNodeInject<TBuilder extends StringBuilder, TInjects extends string> = {
  [K in `${'after' | 'before'}${Capitalize<TInjects>}`]?: AppendValue<TBuilder>;
};

/**
 * The options that are accepted by the constructor of an AST node class. They combine the options of the subclass with
 * the options of its base class constructor, so that language packages can extend the options of their base nodes.
 * @template TBase The class whose constructor options are included.
 * @template TExtensions The additional options of the subclass.
 */
export type AstNodeOptions<
  TBase extends abstract new (...args: any) => any,
  TExtensions extends object = {},
> = Prettify<TExtensions & ConstructorParameters<TBase>[0]>;

/**
 * Base class for AST nodes that write themselves to a `StringBuilder`. The language packages build their nodes on it,
 * for example `TsNode` in `@goast/typescript` and `KtNode` in `@goast/kotlin`.
 *
 * A node is written with `write`, which runs in three steps:
 * 1. The node is pushed onto a history stack that is kept per builder. Nodes that are written while it is on the stack
 *    can find it through `getParentNode`, which allows a node to render differently depending on where it is placed.
 * 2. The `before` injection is appended, followed by the node's own output, which the subclass renders in `onWrite`.
 * 3. The `after` injection is appended, and the node is popped from the history stack again.
 *
 * Injection points let callers add custom content to a node without subclassing it. `before` and `after` wrap the whole
 * node. The node-specific injections declared through `TInjects`, such as `beforeDecorators` or `afterBody`, are
 * appended by the subclass around the matching part of its output. Injected values are appended like any other value,
 * so they can be strings, builder functions or arrays.
 * @template TBuilder The type of the builder that the node is written to.
 * @template TInjects Additional names of custom injection points (`before*` and `after*`) accepted by this node.
 */
export abstract class AstNode<TBuilder extends StringBuilder = StringBuilder, TInjects extends string = never> {
  /**
   * The values that are injected before and after this node or its parts. See the class documentation for details.
   */
  public inject: AstNodeInject<TBuilder, TInjects | ''>;

  /**
   * Initializes a new instance of the AstNode class.
   * @param options The options of the node. Only `inject` is read by this base class.
   */
  constructor(options: { inject?: AstNode<TBuilder, TInjects>['inject'] }) {
    this.inject = options.inject ?? {};
  }

  /**
   * Writes this node to the builder. The `before` injection wraps the output of the node, and the node is registered in
   * the history of the builder while it is written.
   * @param builder The builder to write the node to.
   */
  public write(builder: TBuilder): void {
    let history = (builder as BuilderWithHistory)[NODE_HISTORY_SYMBOL];
    if (!history) {
      history = [];
      (builder as BuilderWithHistory)[NODE_HISTORY_SYMBOL] = history;
    }

    history.push(this);
    builder.append(this.inject.before);
    this.onWrite(builder);
    builder.append(this.inject.after);
    history.pop();
  }

  protected getParentNode(builder: TBuilder): AstNode | undefined {
    const history = (builder as BuilderWithHistory)[NODE_HISTORY_SYMBOL];
    return history?.at(-2);
  }

  protected abstract onWrite(builder: TBuilder): void;
}
