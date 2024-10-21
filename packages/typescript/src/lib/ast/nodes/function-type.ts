import { type AstNodeOptions, type BasicAppendValue, notNullish, type Nullable, type SourceBuilder } from '@goast/core';

import { type TsGenericParameter, tsGenericParameter } from './generic-parameter.ts';
import { type TsParameter, tsParameter } from './parameter.ts';
import type { TsType } from './types.ts';
import { TsNode } from '../node.ts';
import { writeTsNode, writeTsNodes } from '../utils/write-ts-nodes.ts';

type Injects = 'generics' | 'params' | 'returnType';

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof TsNode<TBuilder, TInjects | Injects>,
  {
    generics?: Nullable<Nullable<TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    parameters?: Nullable<Nullable<TsParameter<TBuilder> | BasicAppendValue<TBuilder>>[]>;
    returnType?: Nullable<TsType<TBuilder>>;
  }
>;

export class TsFunctionType<TBuilder extends SourceBuilder, TInjects extends string = never> extends TsNode<
  TBuilder,
  TInjects | Injects
> {
  public generics: (TsGenericParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public parameters: (TsParameter<TBuilder> | BasicAppendValue<TBuilder>)[];
  public returnType: TsType<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.generics = options.generics?.filter(notNullish) ?? [];
    this.parameters = options.parameters?.filter(notNullish) ?? [];
    this.returnType = options.returnType ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append(this.inject.beforeGenerics);
    tsGenericParameter.write(builder, this.generics);
    builder.append(this.inject.afterGenerics);

    builder.append(this.inject.beforeParams);
    tsParameter.write(builder, this.parameters);
    builder.append(this.inject.afterParams);

    builder.append(' => ');

    builder.append(this.inject.beforeReturnType);
    writeTsNode(builder, this.returnType ?? 'void');
    builder.append(this.inject.afterReturnType);
  }
}

const createFunctionType = <TBuilder extends SourceBuilder>(options?: Options<TBuilder>) =>
  new TsFunctionType<TBuilder>(options ?? {});

export const tsFunctionType = Object.assign(createFunctionType, {
  write: writeTsNodes,
});
