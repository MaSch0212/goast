import { AstNodeOptions, BasicAppendValue, Nullable, Prettify, SourceBuilder } from '@goast/core';

import { KtType } from './types';
import { KtNode } from '../node';
import { writeKtGenericParameters } from '../utils/write-kt-generic-parameters';
import { writeKtNode } from '../utils/write-kt-node';

type Injects = 'name' | 'constraint';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    name: string;
    description?: Nullable<BasicAppendValue<TBuilder>>;
    constraint?: Nullable<KtType<TBuilder>>;
  }
>;

export class KtGenericParameter<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public name: string;
  public description: BasicAppendValue<TBuilder> | null;
  public constraint: KtType<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.name = options.name;
    this.description = options.description ?? null;
    this.constraint = options.constraint ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeName, this.name, this.inject.afterName);

    if (this.constraint) {
      builder.append(' : ');
      builder.append(this.inject.beforeConstraint);
      writeKtNode(builder, this.constraint);
      builder.append(this.inject.afterConstraint);
    }
  }
}

const createGenericParameter = <TBuilder extends SourceBuilder>(
  name: Options<TBuilder>['name'],
  options?: Prettify<Omit<Options<TBuilder>, 'name'>>,
) => new KtGenericParameter<TBuilder>({ ...options, name });

export const ktGenericParameter = Object.assign(createGenericParameter, {
  write: writeKtGenericParameters,
});
