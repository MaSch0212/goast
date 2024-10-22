import { type AstNodeOptions, notNullish, type Nullable, type Prettify, type SourceBuilder } from '@goast/core';

import { KtNode } from '../node.ts';
import { writeKtAnnotations } from '../utils/write-kt-annotations.ts';
import { writeKtNode } from '../utils/write-kt-node.ts';
import { type KtArgument, ktArgument } from './argument.ts';
import type { KtType, KtValue } from './types.ts';

type Injects = 'class' | 'target' | 'arguments';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    class: KtType<TBuilder>;
    arguments?: Nullable<Nullable<KtArgument<TBuilder> | KtValue<TBuilder>>[]>;
    target?: Nullable<KtAnnotationTarget>;
  }
>;

export type KtAnnotationTarget =
  | 'file'
  | 'property'
  | 'field'
  | 'get'
  | 'set'
  | 'receiver'
  | 'param'
  | 'setparam'
  | 'delegate';

export class KtAnnotation<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public class: KtType<TBuilder>;
  public arguments: (KtArgument<TBuilder> | KtValue<TBuilder>)[];
  public target: KtAnnotationTarget | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.class = options.class;
    this.arguments = options.arguments?.filter(notNullish) ?? [];
    this.target = options.target ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('@');

    if (this.target) {
      builder.append(this.inject.beforeTarget);
      builder.append(this.target);
      builder.append(this.inject.afterTarget);
      builder.append(':');
    }

    builder.append(this.inject.beforeClass);
    writeKtNode(builder, this.class);
    builder.append(this.inject.afterClass);

    if (this.arguments.length > 0) {
      builder.append(this.inject.beforeArguments);
      ktArgument.write(builder, this.arguments);
      builder.append(this.inject.afterArguments);
    }
  }
}

const createAnnotation = <TBuilder extends SourceBuilder>(
  $class: Options<TBuilder>['class'],
  $arguments?: Options<TBuilder>['arguments'],
  options?: Prettify<Omit<Options<TBuilder>, 'class' | 'arguments'>>,
) => new KtAnnotation<TBuilder>({ ...options, class: $class, arguments: $arguments });

export const ktAnnotation = Object.assign(createAnnotation, {
  write: writeKtAnnotations,
});
