import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { CsNode } from '../node.ts';
import { type CsAppendValue, writeCsNode, writeCsNodes } from '../utils/write-cs-node.ts';
import type { CsParameter } from './parameter.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof CsNode<TBuilder, TInjects | Injects>,
  {
    /** The lambda parameters. Plain strings are untyped parameter names. */
    parameters?: Nullable<Nullable<CsParameter<TBuilder> | string>[]>;
    body?: Nullable<CsAppendValue<TBuilder>>;
    /** Writes the body as an expression (`x => expr`) instead of as a block. */
    singleExpression?: Nullable<boolean>;
    async?: Nullable<boolean>;
    static?: Nullable<boolean>;
  }
>;

export class CsLambda<TBuilder extends SourceBuilder, TInjects extends string = never> extends CsNode<
  TBuilder,
  TInjects | Injects
> {
  public parameters: (CsParameter<TBuilder> | string)[];
  public body: CsAppendValue<TBuilder> | null;
  public singleExpression: boolean;
  public async: boolean;
  public static: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
    this.singleExpression = options.singleExpression ?? false;
    this.async = options.async ?? false;
    this.static = options.static ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.static) builder.append('static ');
    if (this.async) builder.append('async ');

    // A single untyped parameter may omit the parentheses.
    const [first] = this.parameters;
    const bare =
      this.parameters.length === 1 &&
      (typeof first === 'string' ||
        (!first.type && !first.default && first.attributes.length === 0 && !first.modifier && !first.params));
    if (bare) {
      writeCsNode(builder, first);
    } else {
      builder.parenthesize('()', (b) => b.forEach(this.parameters, writeCsNode, { separator: ', ' }));
    }

    builder.append(' =>');
    if (this.singleExpression && this.body) {
      builder.append(' ');
      builder.indent((b) => writeCsNode(b, this.body));
    } else {
      builder.ensureCurrentLineEmpty();
      builder.parenthesize('{}', (b) => writeCsNode(b, this.body), { multiline: true });
    }
  }
}

const createLambda = <TBuilder extends SourceBuilder>(
  parameters: Options<TBuilder>['parameters'],
  body: Options<TBuilder>['body'],
  options?: Prettify<Omit<Options<TBuilder>, 'parameters' | 'body'>>,
): CsLambda<TBuilder> => new CsLambda<TBuilder>({ ...options, parameters, body });

export const csLambda: typeof createLambda & { write: typeof writeCsNodes } = Object.assign(createLambda, {
  write: writeCsNodes,
});
