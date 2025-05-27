import {
  type AppendValue,
  type AstNodeOptions,
  type BasicAppendValue,
  notNullish,
  type Nullable,
  type SourceBuilder,
} from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtNodes } from '../utils/write-kt-node.ts';

type Injects = 'arguments' | 'body';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    arguments?: Nullable<Nullable<BasicAppendValue<TBuilder>>[]>;
    body?: Nullable<AppendValue<TBuilder>>;
    singleline?: boolean;
  }
>;

export class KtLambda<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public arguments: BasicAppendValue<TBuilder>[];
  public body: AppendValue<TBuilder> | null;
  public singleline: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.arguments = options.arguments?.filter(notNullish) ?? [];
    this.body = options.body ?? null;
    this.singleline = options.singleline ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    const singleline = this.singleline || !this.body;

    builder.parenthesize('{}', (b) => {
      if (this.arguments.length > 0) {
        b.append(' ', this.inject.beforeArguments);
        writeKtNodes(b, this.arguments, { separator: ', ' });
        b.append(this.inject.afterArguments);

        b.append(' ->');
      }

      b.append(singleline ? ' ' : '\n');

      b.append(this.inject.beforeBody, this.body, this.inject.afterBody);

      if (singleline) {
        if (!b.isCurrentLineEmpty) {
          b.append(' ');
        }
      } else {
        b.ensureCurrentLineEmpty();
      }
    });
  }
}

const createLambda = <TBuilder extends SourceBuilder>(
  args: Options<TBuilder>['arguments'],
  body: Options<TBuilder>['body'],
  options?: Omit<Options<TBuilder>, 'arguments' | 'body'>,
): KtLambda<TBuilder> => new KtLambda<TBuilder>({ ...options, arguments: args, body });

export const ktLambda: typeof createLambda & { write: typeof writeKtNodes } = Object.assign(createLambda, {
  write: writeKtNodes,
});
