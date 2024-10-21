import {
  type ArrayItem,
  type AstNodeOptions,
  notNullish,
  type Nullable,
  type Prettify,
  type SourceBuilder,
} from '@goast/core';

import { type KtArgument, ktArgument } from './argument.ts';
import type { KtType, KtValue } from './types.ts';
import { KtNode } from '../node.ts';
import { writeKtNode, writeKtNodes } from '../utils/write-kt-node.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    path: Nullable<KtType<TBuilder> | KtValue<TBuilder>>[];
    arguments?: Nullable<Nullable<KtArgument<TBuilder> | KtValue<TBuilder>>[]>;
    infix?: boolean;
  }
>;

export class KtCall<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public path: (KtType<TBuilder> | KtValue<TBuilder>)[];
  public arguments: (KtArgument<TBuilder> | KtValue<TBuilder>)[] | null;
  public infix: boolean;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.path = options.path.filter(notNullish);
    this.arguments = options.arguments?.filter(notNullish) ?? null;
    this.infix = options.infix ?? false;
  }

  protected override onWrite(builder: TBuilder): void {
    if (this.infix && this.arguments?.length === 1 && this.path.length > 1) {
      writeKtNodes(builder, this.path.slice(0, 1), { separator: '.' });
      builder.append(' ');
      writeKtNode(builder, this.path.at(-1));
      builder.append(' ');
      writeKtNode(builder, this.arguments[0]);
    } else {
      writeKtNodes(builder, this.path, { separator: '.' });

      if (this.arguments) {
        ktArgument.write(builder, this.arguments);
      }
    }
  }
}

const createCall = <TBuilder extends SourceBuilder>(
  path: Options<TBuilder>['path'] | ArrayItem<Options<TBuilder>['path']>,
  args?: Options<TBuilder>['arguments'],
  options?: Prettify<Omit<Options<TBuilder>, 'path' | 'arguments'>>,
) => new KtCall<TBuilder>({ ...options, path: Array.isArray(path) ? path : [path], arguments: args });

export const ktCall = Object.assign(createCall, {
  write: writeKtNodes,
});
